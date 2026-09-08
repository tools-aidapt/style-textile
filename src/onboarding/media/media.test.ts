import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { LIMITS } from "../contract";
import { prepareDocument } from "./client";
import { runPipeline } from "./pipeline";
import { isImageKind, refusalFor, sniff } from "./sniff";
import type { SourceBytes } from "./types";
import { checkerImage, noiseImage } from "@/test/images";

/**
 * The pipeline end to end, on real bytes.
 *
 * `src/test/canvasShim.ts` gives Node a working `createImageBitmap` and
 * `OffscreenCanvas`, so photos here are genuinely decoded, resized and
 * re-encoded, and the merged PDFs are genuinely built. The ladder itself is
 * pinned in `image.test.ts` and the photo checks in `photo.test.ts`.
 *
 * TWO PATHS STILL NEED A BROWSER, and neither can be faked honestly:
 *
 * - **EXIF orientation.** `imageOrientation: "from-image"` is implemented by
 *   browsers, not by a decoder library. `image.test.ts` asserts the app asks
 *   for it; that the request is honoured is a browser's promise.
 * - **HEIC conversion.** `heic2any` carries its own libheif build and wants a
 *   DOM canvas. What is covered here is that a HEIC is correctly identified
 *   from its bytes and that a failure names the two iPhone settings that fix
 *   it — which is the part that gets the employee unstuck.
 *
 * Also browser-only: `rasterisePdf`, because pdf.js spawns its own worker.
 * The size ceiling that triggers it, and the refusal when it cannot help, are
 * both covered below.
 *
 * TODO(kenafric): one manual pass on a real iPhone and a real phone-scanner
 * PDF before this ships. Those three are the whole list.
 */

const bytesOf = (values: number[], length = 32): ArrayBuffer => {
  const view = new Uint8Array(length);
  values.forEach((value, index) => {
    view[index] = value;
  });
  return view.buffer;
};

const ascii = (text: string, at: number, length = 32): ArrayBuffer => {
  const view = new Uint8Array(length);
  for (let index = 0; index < text.length; index += 1) view[at + index] = text.charCodeAt(index);
  return view.buffer;
};

const source = (bytes: ArrayBuffer, type = "application/octet-stream"): SourceBytes => ({
  name: "IMG_20260904_113402",
  type,
  bytes,
});

/**
 * Pseudo-random, and deterministic. Padding a PDF with a repeated character
 * proves nothing — Flate squashes it back down to nothing, which is exactly
 * what a real phone scan's embedded photos will not do.
 */
const incompressible = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  // Math.imul, because a 32-bit multiply done in doubles loses its low bits
  // and the "random" sequence collapses into something Flate eats whole
  let seed = 1;
  for (let index = 0; index < length; index += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    bytes[index] = (seed >>> 24) & 0xff;
  }
  return bytes;
};

/** A PDF of `pages` blank A4 pages, optionally padded to a given size. */
const makePdf = async (pages: number, padTo = 0): Promise<ArrayBuffer> => {
  const document = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) document.addPage([595.28, 841.89]);
  if (padTo > 0) {
    // Stands in for the full-resolution photos a phone-scanner app embeds
    await document.attach(incompressible(padTo), "scan.bin");
  }
  const saved = await document.save();
  return saved.slice().buffer;
};

describe("sniff", () => {
  it("names each accepted type from its magic bytes", () => {
    expect(sniff(bytesOf([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
    expect(sniff(bytesOf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
    expect(sniff(ascii("%PDF-1.7", 0))).toBe("pdf");
  });

  it("separates a WebP from any other RIFF file", () => {
    const webp = new Uint8Array(32);
    "RIFF".split("").forEach((char, index) => (webp[index] = char.charCodeAt(0)));
    "WEBP".split("").forEach((char, index) => (webp[8 + index] = char.charCodeAt(0)));
    expect(sniff(webp.buffer)).toBe("webp");
  });

  it("separates an iPhone photo from an iPhone video in the same container", () => {
    const heic = new Uint8Array(32);
    "ftyp".split("").forEach((char, index) => (heic[4 + index] = char.charCodeAt(0)));
    "heic".split("").forEach((char, index) => (heic[8 + index] = char.charCodeAt(0)));
    expect(sniff(heic.buffer)).toBe("heic");

    const video = new Uint8Array(heic);
    "mp42".split("").forEach((char, index) => (video[8 + index] = char.charCodeAt(0)));
    expect(sniff(video.buffer)).toBe("video");
  });

  it("does not trust an extension or a reported MIME type", () => {
    // A .docx renamed to .pdf is still a zip, and the refusal has to say so
    const zip = sniff(bytesOf([0x50, 0x4b, 0x03, 0x04]));
    expect(zip).toBe("zip");
    expect(isImageKind(zip)).toBe(false);
    expect(refusalFor(zip)).toContain("export it as a PDF");
    expect(refusalFor("video")).toContain("Take a photo of the document instead");
  });
});

describe("the pipeline", () => {
  it("passes a small PDF through untouched", async () => {
    const bytes = await makePdf(2);
    const result = await runPipeline({
      documentKey: "kra-pin",
      sources: [source(bytes, "application/pdf")],
      merge: false,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.extension).toBe("pdf");
    expect(result.pageCount).toBe(2);
    // Untouched means untouched: an iTax PDF re-encoded is bigger and blurrier
    expect(result.bytes).toBe(bytes.byteLength);
  });

  it("refuses a PDF that is over the ceiling", async () => {
    const bytes = await makePdf(1, LIMITS.documentBytes + 1024);
    expect(bytes.byteLength).toBeGreaterThan(LIMITS.documentBytes);

    const result = await runPipeline({
      documentKey: "good-conduct",
      sources: [source(bytes, "application/pdf")],
      merge: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("still-too-large");
    expect(result.message).toBe("This document is over the 5 MB limit even after compressing.");
    // The tile needs the real figure to say how far over it is
    expect(result.bytes).toBeGreaterThan(LIMITS.documentBytes);
  });

  it("refuses a PDF longer than the page cap", async () => {
    const result = await runPipeline({
      documentKey: "education-certs",
      sources: [source(await makePdf(LIMITS.pdfPages + 1), "application/pdf")],
      merge: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("pdf-too-many-pages");
    expect(result.message).toContain("Split it");
  });

  it("merges several PDFs into one document, pages in order", async () => {
    const result = await runPipeline({
      documentKey: "education-certs",
      sources: [
        source(await makePdf(2), "application/pdf"),
        source(await makePdf(3), "application/pdf"),
      ],
      merge: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.extension).toBe("pdf");
    expect(result.sourceCount).toBe(2);
    expect(result.pageCount).toBe(5);

    // The pages were copied, not rasterised — so they are still there
    const merged = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(merged.getPageCount()).toBe(5);
  });

  it("refuses a file that is neither a photo nor a PDF, and says what to do", async () => {
    const result = await runPipeline({
      documentKey: "nssf",
      sources: [source(bytesOf([0x50, 0x4b, 0x03, 0x04]))],
      merge: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("unsupported-type");
    expect(result.message).toContain("export it as a PDF");
  });

  it("refuses more files than one document can hold", async () => {
    const sources = await Promise.all(
      Array.from({ length: LIMITS.sourceFiles + 1 }, () => makePdf(1)),
    );
    const result = await runPipeline({
      documentKey: "payslips",
      sources: sources.map((bytes) => source(bytes, "application/pdf")),
      merge: true,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("too-many-files");
  });
});

describe("the pipeline, on real photos", () => {
  it("keeps a single photo as a JPEG rather than wrapping it in a PDF", async () => {
    // A one-page PDF around one photo is bigger, and HR cannot glance at it
    const photo = await noiseImage(3200, 2400);
    const result = await runPipeline({
      documentKey: "kra-pin",
      sources: [source(photo.bytes, "image/jpeg")],
      merge: false,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.extension).toBe("jpg");
    expect(result.blob.type).toBe("image/jpeg");
    expect(result.bytes).toBeLessThanOrEqual(LIMITS.documentBytes);
    expect(result.pageCount).toBe(1);
    // The tile shows its working, so the numbers have to be the real ones
    expect(result.originalBytes).toBe(photo.bytes.byteLength);
    expect(result.bytes).toBeLessThan(result.originalBytes);
  }, 60_000);

  it("merges two photos of an ID into one PDF, front page first", async () => {
    const front = await noiseImage(2600, 1800);
    const back = await noiseImage(2600, 1800);

    const result = await runPipeline({
      documentKey: "national-id",
      sources: [source(front.bytes, "image/jpeg"), source(back.bytes, "image/jpeg")],
      merge: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.extension).toBe("pdf");
    expect(result.pageCount).toBe(2);
    expect(result.sourceCount).toBe(2);
    expect(result.bytes).toBeLessThanOrEqual(LIMITS.documentBytes);

    const merged = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(merged.getPageCount()).toBe(2);
    // Landscape photos get landscape pages: a landscape ID shrunk onto a
    // portrait page is half the size somebody has to read it at
    const [width, height] = [merged.getPage(0).getWidth(), merged.getPage(0).getHeight()];
    expect(width).toBeGreaterThan(height);
  }, 60_000);

  it("gives a portrait photo a portrait page", async () => {
    const photo = await checkerImage(1500, 2000);
    const result = await runPipeline({
      documentKey: "education-certs",
      sources: [source(photo.bytes, "image/jpeg")],
      merge: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // A multi-file document is always a PDF, even with one file in it, so
    // adding a second later does not change the type HR already has
    expect(result.extension).toBe("pdf");
    const merged = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(merged.getPage(0).getHeight()).toBeGreaterThan(merged.getPage(0).getWidth());
  }, 60_000);

  it("merges a photo and a PDF without rasterising the PDF", async () => {
    const photo = await checkerImage(1600, 1200);
    const result = await runPipeline({
      documentKey: "payslips",
      sources: [
        source(photo.bytes, "image/jpeg"),
        source(await makePdf(3), "application/pdf"),
      ],
      merge: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pageCount).toBe(4);
    const merged = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(merged.getPageCount()).toBe(4);
  }, 60_000);

  it("carries the low-resolution advisory up out of the merge", async () => {
    const small = await checkerImage(800, 900);
    const result = await runPipeline({
      documentKey: "education-certs",
      sources: [source(small.bytes, "image/jpeg"), source(await makePdf(1), "application/pdf")],
      merge: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.advisories.map((advisory) => advisory.code)).toEqual(["low-resolution"]);
  }, 60_000);

  it("brings eight photos in under the one ceiling they share", async () => {
    const photos = await Promise.all(
      Array.from({ length: 8 }, () => noiseImage(2400, 1800, 92)),
    );
    const result = await runPipeline({
      documentKey: "education-certs",
      sources: photos.map((photo) => source(photo.bytes, "image/jpeg")),
      merge: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pageCount).toBe(8);
    expect(result.bytes).toBeLessThanOrEqual(LIMITS.documentBytes);
  }, 120_000);

  it("refuses a photo it cannot decode, and keeps the wording plain", async () => {
    const broken = new Uint8Array(64);
    broken.set([0xff, 0xd8, 0xff, 0xe0]);
    const result = await runPipeline({
      documentKey: "nssf",
      sources: [source(broken.buffer, "image/jpeg")],
      merge: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("decode-failed");
    expect(result.message).toContain("Take it again");
  });
});

describe("prepareDocument", () => {
  /** A File that claims a size without allocating it. */
  const fileOf = (bytes: ArrayBuffer, name: string, type: string, size?: number): File => {
    const file = new File([bytes], name, { type });
    if (size !== undefined) Object.defineProperty(file, "size", { value: size });
    return file;
  };

  it("refuses an absurd file before doing any work on it", async () => {
    const result = await prepareDocument({
      documentKey: "national-id",
      files: [fileOf(new ArrayBuffer(8), "VID_0001.mp4", "video/mp4", 220 * 1024 * 1024)],
      merge: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Not "unsupported-type": the point is that the size was refused first,
    // before 220 MB was read into a phone's memory
    expect(result.code).toBe("source-too-large");
    expect(result.message).toContain("Take a photo of the document instead");
  });

  it("refuses more than eight files", async () => {
    const files = Array.from({ length: 9 }, (_, index) =>
      fileOf(new ArrayBuffer(8), `page-${index}.pdf`, "application/pdf"),
    );
    const result = await prepareDocument({ documentKey: "payslips", files, merge: true });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("too-many-files");
  });

  it("tells an iPhone user exactly which setting to change", async () => {
    const heic = new Uint8Array(64);
    "ftyp".split("").forEach((char, index) => (heic[4 + index] = char.charCodeAt(0)));
    "heic".split("").forEach((char, index) => (heic[8 + index] = char.charCodeAt(0)));

    const result = await prepareDocument({
      documentKey: "national-id",
      // The browser reports HEIC inconsistently, so the bytes are what decide
      files: [fileOf(heic.buffer, "IMG_0001.HEIC", "")],
      merge: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("heic-failed");
    expect(result.message).toContain("Most Compatible");
  });

  it("refuses a Word document with the fix rather than with 'unsupported'", async () => {
    const result = await prepareDocument({
      documentKey: "good-conduct",
      files: [
        fileOf(
          bytesOf([0x50, 0x4b, 0x03, 0x04], 64),
          "conduct.docx",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
      ],
      merge: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("save or export it as a PDF");
  });
});

import { describe, expect, it } from "vitest";
import { checkerImage, flatImage, noiseImage } from "@/test/images";
import { lastImageBitmapOptions, resetImageBitmapOptions } from "@/test/canvasShim";
import { compressImage, perPageBudget } from "./image";

/**
 * The compression ladder, against real pixels.
 *
 * Every assertion here is about the promise the ladder makes: it gets a phone
 * photo under the ceiling, and it stops before the document becomes
 * unreadable. A ladder with no floor is not compression, it is deletion with a
 * green tick next to it.
 *
 * See `src/test/canvasShim.ts` for what a Node canvas can and cannot stand in
 * for — EXIF orientation and HEIC still need a browser.
 */

const edgeOf = async (bytes: ArrayBuffer): Promise<{ width: number; height: number }> => {
  const bitmap = await createImageBitmap(new Blob([bytes]));
  return { width: bitmap.width, height: bitmap.height };
};

const MB = 1024 * 1024;

describe("compressImage", () => {
  it("asks for the EXIF rotation to be baked in", async () => {
    resetImageBitmapOptions();
    const photo = await checkerImage(800, 600);
    await compressImage(photo.bytes, "image/jpeg", 5 * MB);

    // The one thing that fixes sideways IDs. Stripping the tag by re-encoding
    // WITHOUT having applied it is how a document that looked upright on the
    // phone reaches HR on its side.
    expect(lastImageBitmapOptions?.imageOrientation).toBe("from-image");
  });

  it("brings a large photo under the ceiling and caps the longest edge", async () => {
    // Per-pixel noise at q95: incompressible, so the ladder has real work
    const photo = await noiseImage(3200, 2400);
    expect(photo.bytes.byteLength).toBeGreaterThan(5 * MB);

    const result = await compressImage(photo.bytes, "image/jpeg", 5 * MB);

    expect(result.blob.size).toBeLessThanOrEqual(5 * MB);
    expect(result.blob.type).toBe("image/jpeg");
    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(2200);
    // 2200 is the top of the ladder because payslip body text does not survive
    // 1200 — a document that is smaller than it needs to be is still a loss
    expect(Math.max(result.width, result.height)).toBe(2200);

    const decoded = await edgeOf(await result.blob.arrayBuffer());
    expect(Math.max(decoded.width, decoded.height)).toBe(2200);
  });

  it("keeps the aspect ratio, so nothing is stretched", async () => {
    const photo = await noiseImage(3000, 1500);
    const result = await compressImage(photo.bytes, "image/jpeg", 5 * MB);
    expect(result.width / result.height).toBeCloseTo(2, 1);
  });

  it("never upscales, and says so when the photo is small", async () => {
    const photo = await checkerImage(900, 700);
    const result = await compressImage(photo.bytes, "image/jpeg", 5 * MB);

    expect(result.width).toBe(900);
    expect(result.height).toBe(700);
    expect(result.advisories.map((advisory) => advisory.code)).toContain("low-resolution");
    expect(result.advisories[0].message).toContain("Check the text is readable");
  });

  it("does not warn about resolution when there is enough of it", async () => {
    const photo = await checkerImage(1600, 1200);
    const result = await compressImage(photo.bytes, "image/jpeg", 5 * MB);
    expect(result.advisories).toEqual([]);
  });

  it("stops at the floor rather than making a document unreadable", async () => {
    // A budget nothing can meet. The ladder must give up, not keep going.
    const photo = await noiseImage(3000, 2200);
    const result = await compressImage(photo.bytes, "image/jpeg", 8 * 1024);

    expect(result.blob.size).toBeGreaterThan(8 * 1024);
    // 1600px and q0.55 are the floor; below that the file would be smaller and
    // worthless. The caller turns this into the "still too large" refusal,
    // which offers the employee three things that actually work.
    expect(Math.max(result.width, result.height)).toBe(1600);
  });

  it("gets a modest photo well under the ceiling without touching its size", async () => {
    const photo = await checkerImage(2000, 1500);
    const result = await compressImage(photo.bytes, "image/jpeg", 5 * MB);
    expect(result.blob.size).toBeLessThan(2 * MB);
    expect(Math.max(result.width, result.height)).toBe(2000);
  });

  it("composites a transparent PNG onto white, not onto black", async () => {
    // A JPEG has no alpha channel. Without the fill, a scanned document with a
    // transparent background arrives as a black rectangle.
    const { createCanvas } = await import("@napi-rs/canvas");
    const canvas = createCanvas(400, 300);
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, 400, 300);
    context.fillStyle = "rgba(0,0,0,1)";
    context.fillRect(10, 10, 20, 20);
    const png = (await canvas.encode("png")).slice().buffer as ArrayBuffer;

    const result = await compressImage(png, "image/png", 5 * MB);
    const bitmap = await createImageBitmap(result.blob);
    const probe = createCanvas(bitmap.width, bitmap.height);
    const probeContext = probe.getContext("2d");
    probeContext.drawImage(bitmap as never, 0, 0);
    const [red, green, blue] = probeContext.getImageData(300, 250, 1, 1).data;
    expect(Math.min(red, green, blue)).toBeGreaterThan(230);
  });

  it("reports a file it cannot decode rather than uploading it", async () => {
    await expect(
      compressImage(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer, "image/jpeg", 5 * MB),
    ).rejects.toThrow("decode-failed");
  });

  it("strips the metadata, including where the photo was taken", async () => {
    const photo = await checkerImage(1600, 1200);
    const result = await compressImage(photo.bytes, "image/jpeg", 5 * MB);
    const bytes = new Uint8Array(await result.blob.arrayBuffer());
    const text = String.fromCharCode(...bytes.subarray(0, 4096));

    // Re-encoding through the canvas is what does it. GPS coordinates from a
    // photo of somebody's ID on their kitchen table do not belong in an HR
    // system, and no APP1/Exif segment survives.
    expect(text).not.toContain("Exif");
    expect(text).not.toContain("GPS");
  });
});

describe("perPageBudget", () => {
  it("shares the ceiling between pages, with a floor", () => {
    expect(perPageBudget(5 * MB, 1)).toBe(5 * MB);
    expect(perPageBudget(5 * MB, 4)).toBe(Math.floor((5 * MB) / 4));
    // Dividing 5 MB by eight and compressing each page to 640 KB produces
    // eight unreadable pages when a looser first pass would have fitted anyway
    expect(perPageBudget(5 * MB, 40)).toBe(400 * 1024);
  });
});

describe("what a Node canvas cannot prove", () => {
  it("documents the two paths that still need a browser", async () => {
    // Kept as an executable note rather than prose in a comment nobody reads:
    // the shim decodes JPEG, PNG and WebP, and neither HEIC nor EXIF rotation
    // is among them. See the browser-pass TODO in media.test.ts.
    const heic = new Uint8Array(32);
    "ftyp".split("").forEach((char, index) => (heic[4 + index] = char.charCodeAt(0)));
    "heic".split("").forEach((char, index) => (heic[8 + index] = char.charCodeAt(0)));
    await expect(compressImage(heic.buffer, "image/heic", 5 * MB)).rejects.toThrow("decode-failed");

    const flat = await flatImage(100, 100, 128);
    expect(flat.bytes.byteLength).toBeGreaterThan(0);
  });
});

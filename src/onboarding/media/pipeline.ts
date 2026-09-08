/**
 * The fixed order of operations, for every document.
 *
 *   1. Accept — reject an unsupported type outright.
 *   2. Refuse the absurd BEFORE doing any work (the client does this one,
 *      because it can read a File's size without reading its bytes).
 *   3. Compress / convert.
 *   4. Merge multi-file documents into one PDF.
 *   5. Measure. Under 5 MB, upload. Over, one tighter retry, then refuse.
 *
 * The order matters because the 5 MB cap is on the FINISHED document — after
 * compression and after the merge — not on any source file.
 *
 * This module runs inside the compression worker. Two things happen before it,
 * on the main thread, because they need APIs a worker does not reliably have:
 * HEIC conversion and rasterising an oversized PDF. See `client.ts`.
 */

import { LIMITS } from "../contract";
import { compressImage, perPageBudget } from "./image";
import { mergeToPdf, type MergeItem } from "./merge";
import { readPdfInfo } from "./pdf";
import { isImageKind, refusalFor, sniff } from "./sniff";
import type { MediaAdvisory, ProcessJob, ProcessResult } from "./types";

const BUDGET = LIMITS.documentBytes;

/** One retry, one tier tighter. More than that is a slow way to say no. */
const TIGHTER = 0.6;

const tooLarge = (bytes: number): ProcessResult => ({
  ok: false,
  code: "still-too-large",
  message: "This document is over the 5 MB limit even after compressing.",
  bytes,
});

const asPdfResult = (
  bytes: Uint8Array,
  originalBytes: number,
  sourceCount: number,
  pageCount: number,
  advisories: MediaAdvisory[],
): ProcessResult => {
  // A fresh ArrayBuffer, because the view pdf-lib returns may be a window onto
  // a larger buffer and a Blob built from that would carry the whole thing
  const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
  return blob.size > BUDGET
    ? tooLarge(blob.size)
    : {
        ok: true,
        blob,
        extension: "pdf",
        bytes: blob.size,
        originalBytes,
        sourceCount,
        pageCount,
        advisories,
      };
};

export const runPipeline = async (job: ProcessJob): Promise<ProcessResult> => {
  const { sources, merge } = job;

  if (sources.length === 0) {
    return { ok: false, code: "unsupported-type", message: "No file was added." };
  }
  if (sources.length > LIMITS.sourceFiles) {
    return {
      ok: false,
      code: "too-many-files",
      message: `Add up to ${LIMITS.sourceFiles} files for one document.`,
    };
  }

  // ---- 1 · accept -------------------------------------------------------
  const kinds = sources.map((source) => sniff(source.bytes));
  const refused = kinds.findIndex((kind) => !isImageKind(kind) && kind !== "pdf");
  if (refused >= 0) {
    return { ok: false, code: "unsupported-type", message: refusalFor(kinds[refused]) };
  }
  // HEIC should have been converted on the main thread; reaching here with one
  // means the conversion was skipped rather than failed, which is a bug
  const heic = kinds.indexOf("heic");
  if (heic >= 0) {
    return {
      ok: false,
      code: "heic-failed",
      message:
        "iPhone photos need converting. In your camera settings choose Formats, then Most Compatible, or use Files to export as JPEG.",
    };
  }

  const originalBytes = sources.reduce((total, source) => total + source.bytes.byteLength, 0);
  const advisories: MediaAdvisory[] = [];

  // ---- a single PDF: pass through, or it has already been rasterised ----
  if (sources.length === 1 && kinds[0] === "pdf") {
    const info = await readPdfInfo(sources[0].bytes);
    if (info.encrypted) {
      return {
        ok: false,
        code: "pdf-encrypted",
        message: "This PDF is password-protected. Save an unlocked copy and try again.",
      };
    }
    if (info.pageCount > LIMITS.pdfPages) {
      return {
        ok: false,
        code: "pdf-too-many-pages",
        message: `This PDF has ${info.pageCount} pages. Split it and add it in two parts.`,
      };
    }
    const blob = new Blob([sources[0].bytes], { type: "application/pdf" });
    if (blob.size > BUDGET) return tooLarge(blob.size);
    return {
      ok: true,
      blob,
      extension: "pdf",
      bytes: blob.size,
      originalBytes,
      sourceCount: 1,
      pageCount: info.pageCount,
      advisories,
    };
  }

  // ---- a single image: stays a JPEG ------------------------------------
  if (sources.length === 1 && !merge) {
    let compressed;
    try {
      compressed = await compressImage(sources[0].bytes, sources[0].type, BUDGET);
    } catch {
      return {
        ok: false,
        code: "decode-failed",
        message: "This photo couldn't be read. Take it again, or choose a different file.",
      };
    }
    if (compressed.blob.size > BUDGET) return tooLarge(compressed.blob.size);
    return {
      ok: true,
      blob: compressed.blob,
      extension: "jpg",
      bytes: compressed.blob.size,
      originalBytes,
      sourceCount: 1,
      pageCount: 1,
      advisories: compressed.advisories,
    };
  }

  // ---- several files, or one file in a multi-file document: one PDF ----
  const build = async (budgetPerPage: number) => {
    const items: MergeItem[] = [];
    let pageCount = 0;

    for (let index = 0; index < sources.length; index += 1) {
      const source = sources[index];

      if (kinds[index] === "pdf") {
        const info = await readPdfInfo(source.bytes);
        if (info.encrypted) throw new Error("pdf-encrypted");
        pageCount += info.pageCount;
        items.push({ kind: "pdf", bytes: source.bytes });
        continue;
      }

      const compressed = await compressImage(source.bytes, source.type, budgetPerPage);
      compressed.advisories.forEach((advisory) => {
        if (!advisories.some((existing) => existing.code === advisory.code)) {
          advisories.push(advisory);
        }
      });
      pageCount += 1;
      items.push({ kind: "jpeg", bytes: await compressed.blob.arrayBuffer() });
    }

    if (pageCount > LIMITS.pdfPages) throw new Error("pdf-too-many-pages");
    return { bytes: await mergeToPdf(items), pageCount };
  };

  const budget = perPageBudget(BUDGET, sources.length);

  try {
    const first = await build(budget);
    const result = asPdfResult(first.bytes, originalBytes, sources.length, first.pageCount, advisories);
    if (result.ok) return result;

    // One tighter pass across every page, then it is refused. See §8.5.
    const second = await build(Math.floor(budget * TIGHTER));
    return asPdfResult(second.bytes, originalBytes, sources.length, second.pageCount, advisories);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "pdf-encrypted") {
      return {
        ok: false,
        code: "pdf-encrypted",
        message: "One of these PDFs is password-protected. Save an unlocked copy and try again.",
      };
    }
    if (code === "pdf-too-many-pages") {
      return {
        ok: false,
        code: "pdf-too-many-pages",
        message: `This comes to more than ${LIMITS.pdfPages} pages. Add it in two parts.`,
      };
    }
    return {
      ok: false,
      code: "decode-failed",
      message: "One of these files couldn't be read. Remove it and try again.",
    };
  }
};

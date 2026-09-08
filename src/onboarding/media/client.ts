/**
 * The main-thread side of the pipeline.
 *
 * Three things happen here rather than in the worker, and each for a reason:
 *
 * - **The size and count guards**, because a `File`'s size is readable without
 *   reading its bytes. Refusing a 200 MB video before loading it into memory
 *   is the difference between a message and a crash.
 * - **HEIC conversion**, because `heic2any` reaches for a DOM canvas. iPhones
 *   shoot HEIC by default and no browser but Safari decodes it, so this is the
 *   most-travelled path in the whole app, and it is not the place to be clever.
 * - **Rasterising an oversized PDF**, because pdf.js brings its own worker.
 *   See the note in `pdf.ts`.
 *
 * Everything after that — the quality ladder and the merge — crosses to the
 * worker, which is where the ten-second stalls were.
 */

import { LIMITS } from "../contract";
import type { DocumentKey } from "../documents";
import { refusalFor, sniff } from "./sniff";
import type { ProcessJob, ProcessResult, SourceBytes, WorkerRequest, WorkerResponse } from "./types";

/**
 * What the tile is currently waiting on.
 *
 * Compression and upload are different waits and must look different: a
 * progress bar that stalls at 40% for eight seconds during compression reads
 * as a broken upload, and the employee reloads the page.
 */
export type PrepareStage = "reading" | "converting" | "compressing";

export interface PrepareInput {
  documentKey: DocumentKey;
  files: File[];
  /** True for the four multi-file documents; they become one PDF. */
  merge: boolean;
  onStage?: (stage: PrepareStage) => void;
}

/** One worker for the whole session — spinning one up per document is ~50ms each. */
let worker: Worker | null = null;
let workerBroken = false;
const pending = new Map<string, (result: ProcessResult) => void>();
let nextId = 0;

const ensureWorker = (): Worker | null => {
  if (workerBroken) return null;
  if (worker) return worker;

  try {
    worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
      const resolve = pending.get(event.data.id);
      pending.delete(event.data.id);
      resolve?.(event.data.result);
    });
    worker.addEventListener("error", () => {
      // A worker that died mid-job would otherwise leave the tile spinning
      // forever, which is the one outcome with no way out for the employee
      pending.forEach((resolve) =>
        resolve({
          ok: false,
          code: "decode-failed",
          message: "Something went wrong preparing this file. Try again.",
        }),
      );
      pending.clear();
      worker?.terminate();
      worker = null;
      workerBroken = true;
    });
    return worker;
  } catch {
    // No module workers — old Safari, or a locked-down webview. The pipeline
    // is the same code either way; it just runs where the user can feel it.
    workerBroken = true;
    return null;
  }
};

const runJob = async (job: ProcessJob): Promise<ProcessResult> => {
  const instance = ensureWorker();
  if (!instance) {
    // The same code, run where the user can feel it. Loaded on demand so that
    // pdf-lib is not in the page's own chunk: everyone downloads the page,
    // almost nobody needs the fallback, and this form is opened on mobile data.
    const { runPipeline } = await import("./pipeline");
    return runPipeline(job);
  }

  const id = String((nextId += 1));
  return new Promise<ProcessResult>((resolve) => {
    pending.set(id, resolve);
    const request: WorkerRequest = { id, job };
    // The buffers are transferred, not copied: eight 12 MB photos copied into
    // a worker is 96 MB of duplicate memory on a phone that has not got it
    instance.postMessage(
      request,
      job.sources.map((source) => source.bytes),
    );
  });
};

/**
 * HEIC to JPEG.
 *
 * The failure message names the two settings that actually fix it. "Unsupported
 * format" is what makes someone email HR instead.
 */
const convertHeic = async (source: SourceBytes): Promise<SourceBytes> => {
  const { default: heic2any } = await import("heic2any");
  const converted = await heic2any({
    blob: new Blob([source.bytes], { type: "image/heic" }),
    toType: "image/jpeg",
    quality: 0.92,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return { name: source.name, type: "image/jpeg", bytes: await blob.arrayBuffer() };
};

const HEIC_FAILURE =
  "iPhone photos need converting. In your camera settings choose Formats, then Most Compatible, or use Files to export as JPEG.";

/**
 * Take the source files and return something ready to upload, or a refusal
 * written for the employee.
 */
export const prepareDocument = async ({
  documentKey,
  files,
  merge,
  onStage,
}: PrepareInput): Promise<ProcessResult> => {
  // ---- 2 · refuse the absurd, before doing any work --------------------
  if (files.length === 0) {
    return { ok: false, code: "unsupported-type", message: "No file was added." };
  }
  if (files.length > LIMITS.sourceFiles) {
    return {
      ok: false,
      code: "too-many-files",
      message: `Add up to ${LIMITS.sourceFiles} files for one document.`,
    };
  }
  const oversized = files.find((file) => file.size > LIMITS.sourceBytes);
  if (oversized) {
    return {
      ok: false,
      code: "source-too-large",
      message: `That file is ${(oversized.size / 1024 / 1024).toFixed(0)} MB, which is too big to work with. Take a photo of the document instead, or scan it at a lower quality.`,
    };
  }

  onStage?.("reading");
  let sources: SourceBytes[] = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type,
      bytes: await file.arrayBuffer(),
    })),
  );

  // ---- HEIC, on this thread -------------------------------------------
  const kinds = sources.map((source) => sniff(source.bytes));
  const refused = kinds.findIndex(
    (kind) => kind === "zip" || kind === "rar" || kind === "video" || kind === "unknown",
  );
  if (refused >= 0) {
    return { ok: false, code: "unsupported-type", message: refusalFor(kinds[refused]) };
  }

  if (kinds.includes("heic")) {
    onStage?.("converting");
    try {
      sources = await Promise.all(
        sources.map((source, index) => (kinds[index] === "heic" ? convertHeic(source) : source)),
      );
    } catch {
      return { ok: false, code: "heic-failed", message: HEIC_FAILURE };
    }
  }

  // ---- an oversized PDF, on this thread -------------------------------
  const needsRaster = sources.some(
    (source, index) => kinds[index] === "pdf" && source.bytes.byteLength > LIMITS.documentBytes,
  );
  if (needsRaster) {
    onStage?.("converting");
    try {
      sources = await Promise.all(
        sources.map(async (source, index) => {
          if (kinds[index] !== "pdf" || source.bytes.byteLength <= LIMITS.documentBytes) {
            return source;
          }
          // pdf.js and pdf-lib, both on demand — see the note in pdf.ts
          const { rasterisePdf } = await import("./pdf");
          const rebuilt = await rasterisePdf(source.bytes);
          return { name: source.name, type: "application/pdf", bytes: rebuilt.slice().buffer };
        }),
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      if (reason === "pdf-too-many-pages") {
        return {
          ok: false,
          code: "pdf-too-many-pages",
          message: `This PDF has more than ${LIMITS.pdfPages} pages. Split it and add it in two parts.`,
        };
      }
      // A PDF that will not rasterise is still measured by the pipeline, which
      // will refuse it with the size message and its three real options
    }
  }

  onStage?.("compressing");
  return runJob({ documentKey, sources, merge });
};

/** Tests and the success screen both want the worker gone. */
export const releaseWorker = (): void => {
  worker?.terminate();
  worker = null;
  pending.clear();
};

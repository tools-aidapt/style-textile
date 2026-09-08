/**
 * PDFs.
 *
 * Most of them need nothing done to them. An iTax certificate is 200 KB of
 * vector text, and re-encoding it makes it larger, blurrier and slower to
 * open. So under the ceiling, a PDF passes through untouched.
 *
 * Over the ceiling, it is almost always a phone-scanner app that embedded
 * full-resolution camera photos of four pages. That one gets rasterised at
 * ~150 DPI and rebuilt, which is the only thing that actually shrinks it.
 *
 * ---
 * Where this runs, and why it is not in the compression worker:
 *
 * pdf.js renders through a canvas and brings its own worker. Running it inside
 * our worker means a nested worker plus an OffscreenCanvas factory — two
 * things that fail differently across browsers, on the one code path an
 * employee reaches while holding a 30 MB scan and no support number. So
 * rasterising happens on the main thread and pdf.js's own worker keeps it off
 * the UI thread. Image compression and merging stay in our worker, where the
 * ten-second stalls actually were.
 */

import { PDFDocument } from "pdf-lib";
import { LIMITS } from "../contract";

export interface PdfInfo {
  pageCount: number;
  encrypted: boolean;
}

/**
 * Page count, and whether it is locked.
 *
 * A password-protected PDF is refused rather than opened: pdf-lib will load one
 * with `ignoreEncryption`, and stripping protection from a document somebody
 * chose to protect is not this form's business.
 */
export const readPdfInfo = async (bytes: ArrayBuffer): Promise<PdfInfo> => {
  try {
    const document = await PDFDocument.load(bytes);
    return { pageCount: document.getPageCount(), encrypted: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/encrypt/i.test(message)) return { pageCount: 0, encrypted: true };
    throw new Error("decode-failed");
  }
};

/** 150 DPI against PDF's 72 pt user space. Readable, and a third of the bytes. */
const RASTER_SCALE = 150 / 72;
const RASTER_QUALITY = 0.8;

/**
 * pdf.js, loaded on demand.
 *
 * It is around a megabyte, and most employees upload photos and a clean iTax
 * PDF. Nobody pays for it until a file actually needs rasterising.
 */
const loadPdfJs = async () => {
  const pdfjs = await import("pdfjs-dist");
  // Vite resolves this to a hashed asset URL at build time; without it pdf.js
  // tries to fetch a worker from a CDN, which the CSP will refuse
  pdfjs.GlobalWorkerOptions.workerSrc = (
    await import("pdfjs-dist/build/pdf.worker.mjs?url")
  ).default;
  return pdfjs;
};

/**
 * Rasterise an oversized scanned PDF and rebuild it.
 *
 * Throws `pdf-too-many-pages` beyond the cap: rendering forty pages on a phone
 * is a minute of held breath, and a forty-page attachment is a document that
 * should have been split.
 */
export const rasterisePdf = async (bytes: ArrayBuffer): Promise<Uint8Array> => {
  const pdfjs = await loadPdfJs();

  const source = await pdfjs.getDocument({
    // pdf.js takes ownership of the buffer it is handed, so give it a copy —
    // the caller still needs the original if this path fails
    data: new Uint8Array(bytes.slice(0)),
    isEvalSupported: false,
    useSystemFonts: false,
  }).promise;

  if (source.numPages > LIMITS.pdfPages) {
    await source.destroy();
    throw new Error("pdf-too-many-pages");
  }

  const rebuilt = await PDFDocument.create();

  for (let number = 1; number <= source.numPages; number += 1) {
    const page = await source.getPage(number);
    const viewport = page.getViewport({ scale: RASTER_SCALE });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("decode-failed");

    // A PDF page is transparent where nothing is drawn, and a JPEG has no
    // alpha, so an unpainted page would come out black
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;

    const jpeg = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", RASTER_QUALITY),
    );
    if (!jpeg) throw new Error("decode-failed");

    const embedded = await rebuilt.embedJpg(await jpeg.arrayBuffer());
    const target = rebuilt.addPage([viewport.width, viewport.height]);
    target.drawImage(embedded, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });

    // Release the decoded page before rendering the next one
    page.cleanup();
    canvas.width = 0;
    canvas.height = 0;
  }

  await source.destroy();
  return rebuilt.save();
};

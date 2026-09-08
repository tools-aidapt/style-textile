/**
 * Making a phone photo small enough to send, without making it unreadable.
 *
 * The whole point of the ladder below is that it has a floor. A document
 * compressed until the text on it cannot be read has not been uploaded; it has
 * been thrown away with a green tick next to it. So quality stops at 0.55 and
 * the longest edge stops at 1600 px, and if that is still too big the file is
 * refused with something the employee can act on — see §8.5 in the brief.
 *
 * 2200 px is the top of the ladder because payslip body text does not survive
 * 1200. It is a document, not a picture of one.
 */

import type { MediaAdvisory } from "./types";

/** Top of the ladder, then the two steps down. Never below the last. */
const EDGE_TIERS = [2200, 1800, 1600];

const QUALITY_START = 0.82;
const QUALITY_STEP = 0.06;
const QUALITY_FLOOR = 0.55;

/** Below this on the longest edge, warn — it may not be readable. */
const LOW_RESOLUTION_EDGE = 1200;

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  advisories: MediaAdvisory[];
}

/**
 * Decode with the EXIF rotation BAKED IN.
 *
 * `imageOrientation: "from-image"` is the whole fix for the single most common
 * HR complaint about phone uploads. A photo carries its rotation as a tag;
 * re-encoding through a canvas strips the tag, so anything that decodes
 * without applying it first writes out a sideways document that looked upright
 * on the phone.
 */
const decode = async (bytes: ArrayBuffer, type: string): Promise<ImageBitmap> => {
  const blob = new Blob([bytes], { type });
  return createImageBitmap(blob, { imageOrientation: "from-image" });
};

const canvasFor = (width: number, height: number): OffscreenCanvas => {
  if (typeof OffscreenCanvas === "undefined") {
    // Every browser that can run the rest of this has it; a browser that
    // cannot must be told, not handed a silently unprocessed file
    throw new Error("no-offscreen-canvas");
  }
  return new OffscreenCanvas(width, height);
};

/** Longest edge to `edge`, and NEVER upscaled — a 900 px photo stays 900 px. */
const scaleTo = (bitmap: ImageBitmap, edge: number) => {
  const longest = Math.max(bitmap.width, bitmap.height);
  const ratio = longest <= edge ? 1 : edge / longest;
  return {
    width: Math.max(1, Math.round(bitmap.width * ratio)),
    height: Math.max(1, Math.round(bitmap.height * ratio)),
  };
};

const encode = async (
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> => {
  const canvas = canvasFor(width, height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no-2d-context");

  // A JPEG has no alpha channel, so a transparent PNG would composite onto
  // black. White is what a scanned document's background is.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);

  // Re-encoding through the canvas is also what strips the metadata: EXIF,
  // and with it the GPS coordinates of somebody's home
  return canvas.convertToBlob({ type: "image/jpeg", quality });
};

/**
 * Compress one image to at most `budget` bytes, or as close as the floor allows.
 *
 * Returns whatever the floor produced even when it is over budget. Deciding
 * what to do about that is the caller's job, because after a merge the answer
 * is "try the whole document one tier tighter" rather than "refuse this page".
 */
export const compressImage = async (
  bytes: ArrayBuffer,
  type: string,
  budget: number,
): Promise<CompressedImage> => {
  let bitmap: ImageBitmap;
  try {
    bitmap = await decode(bytes, type);
  } catch {
    throw new Error("decode-failed");
  }

  const advisories: MediaAdvisory[] = [];
  if (Math.max(bitmap.width, bitmap.height) < LOW_RESOLUTION_EDGE) {
    advisories.push({
      code: "low-resolution",
      message: "This looks small. Check the text is readable before you submit.",
    });
  }

  try {
    let best: CompressedImage | null = null;

    for (const edge of EDGE_TIERS) {
      const { width, height } = scaleTo(bitmap, edge);

      for (let quality = QUALITY_START; quality >= QUALITY_FLOOR - 0.001; quality -= QUALITY_STEP) {
        const blob = await encode(bitmap, width, height, Number(quality.toFixed(2)));
        best = { blob, width, height, advisories };
        if (blob.size <= budget) return best;
      }

      // A photo already smaller than the next tier down cannot be helped by
      // resizing to a size it is already under
      if (Math.max(bitmap.width, bitmap.height) <= EDGE_TIERS[EDGE_TIERS.length - 1]) break;
    }

    // The floor. Over budget, and deliberately not compressed further.
    if (!best) throw new Error("decode-failed");
    return best;
  } finally {
    // The bitmap holds decoded pixels — 12 MP is ~48 MB of them, and a phone
    // processing eight in a row cannot wait for a GC to notice
    bitmap.close?.();
  }
};

/**
 * The per-page budget inside a document.
 *
 * A merged PDF has one 5 MB ceiling shared between its pages, so each page
 * gets a share of it — with a floor, because dividing 5 MB by eight pages and
 * then compressing each page to 640 KB produces eight unreadable pages when a
 * looser first pass would have come in under the ceiling anyway.
 */
export const perPageBudget = (documentBudget: number, pages: number): number =>
  Math.max(400 * 1024, Math.floor(documentBudget / Math.max(1, pages)));

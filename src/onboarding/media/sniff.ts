/**
 * What a file actually is.
 *
 * Never the extension, and never `File.type`. Both are supplied by the client
 * — a renamed `.jpg` and a browser that reports `application/octet-stream` for
 * a HEIC are both ordinary — and a document form that accepts a file because
 * its name ended in `.pdf` is accepting whatever the sender chose to send.
 *
 * Sniffing also lets a refusal be useful. "Unsupported format" tells someone
 * nothing; "that's a Word document, export it as a PDF" tells them what to do.
 */

import type { SniffedKind } from "./types";

const ascii = (view: Uint8Array, at: number, length: number): string =>
  String.fromCharCode(...view.subarray(at, at + length));

const startsWith = (view: Uint8Array, bytes: number[], at = 0): boolean =>
  bytes.every((byte, index) => view[at + index] === byte);

/**
 * ISO-BMFF brands. HEIC, HEIF and MP4 share a container, and the brand at
 * offset 8 is the only thing that separates an iPhone photo from an iPhone
 * video — which matters, because one of them is a document and the other is
 * a 200 MB file someone picked by accident.
 */
const HEIF_BRANDS = ["heic", "heix", "heim", "heis", "hevc", "hevx", "mif1", "msf1"];
const VIDEO_BRANDS = ["isom", "iso2", "mp41", "mp42", "avc1", "qt  ", "3gp4", "3gp5", "M4V "];

export const sniff = (bytes: ArrayBuffer): SniffedKind => {
  const view = new Uint8Array(bytes);
  if (view.length < 12) return "unknown";

  // JPEG — SOI marker
  if (startsWith(view, [0xff, 0xd8, 0xff])) return "jpeg";

  // PNG — the eight-byte signature, including the CRLF trap bytes
  if (startsWith(view, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";

  // PDF — may carry junk ahead of the header, which readers tolerate
  if (ascii(view, 0, 5) === "%PDF-") return "pdf";
  if (ascii(view.subarray(0, 1024), 0, 1024).includes("%PDF-")) return "pdf";

  // RIFF container: WEBP at offset 8
  if (ascii(view, 0, 4) === "RIFF" && ascii(view, 8, 4) === "WEBP") return "webp";

  // ISO-BMFF: size, then "ftyp", then the brand
  if (ascii(view, 4, 4) === "ftyp") {
    const brand = ascii(view, 8, 4);
    if (HEIF_BRANDS.includes(brand)) return "heic";
    if (VIDEO_BRANDS.includes(brand)) return "video";
    // An unknown brand in this container is far more likely to be video than
    // a still, and calling it video produces the more useful refusal
    return "video";
  }

  // The two things people actually attach by mistake
  if (startsWith(view, [0x50, 0x4b, 0x03, 0x04])) return "zip"; // also .docx, .xlsx
  if (ascii(view, 0, 4) === "Rar!") return "rar";
  // Legacy .doc — an OLE compound file
  if (startsWith(view, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "zip";

  return "unknown";
};

export const isImageKind = (kind: SniffedKind): boolean =>
  kind === "jpeg" || kind === "png" || kind === "webp" || kind === "heic";

/**
 * Why this file was refused, in words that name the next step.
 *
 * A `.docx` is the most common wrong attachment — a certificate someone typed
 * up rather than scanned — and "unsupported" leaves them stuck with a file
 * that opens perfectly well on their own machine.
 */
export const refusalFor = (kind: SniffedKind): string => {
  switch (kind) {
    case "zip":
      return "This is a Word or Zip file. Open it and save or export it as a PDF, then add that.";
    case "rar":
      return "This is a compressed archive. Add the document itself as a PDF or a photo.";
    case "video":
      return "This is a video. Take a photo of the document instead.";
    default:
      return "This file isn't a photo or a PDF. Add a photo of the document, or the PDF you were given.";
  }
};

/** The picker's own filter. Advisory only — everything is sniffed after. */
export const ACCEPT_ATTRIBUTE =
  "image/jpeg,image/png,image/heic,image/heif,image/webp,application/pdf,.jpg,.jpeg,.png,.heic,.heif,.webp,.pdf";

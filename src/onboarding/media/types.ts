/**
 * What the compression pipeline takes and returns.
 *
 * The pipeline runs in a Web Worker. Compressing four 12 MP photos on the main
 * thread locks a phone for ten seconds, and a locked phone reads as a broken
 * form — so people tap the button again, and now there are eight.
 */

import type { DocumentKey } from "../documents";

/** What the bytes actually are, whatever the extension claimed. */
export type SniffedKind =
  | "jpeg"
  | "png"
  | "webp"
  | "heic"
  | "pdf"
  /** Named so the refusal can say what to do instead of "unsupported format". */
  | "zip"
  | "rar"
  | "video"
  | "unknown";

export type MediaErrorCode =
  | "unsupported-type"
  | "source-too-large"
  | "too-many-files"
  | "heic-failed"
  | "pdf-encrypted"
  | "pdf-too-many-pages"
  | "decode-failed"
  /** Compressed, merged, retried one tier tighter, and still over 5 MB. */
  | "still-too-large";

/** A warning that does not stop the upload. */
export type MediaAdvisoryCode = "low-resolution" | "very-small-file";

export interface MediaAdvisory {
  code: MediaAdvisoryCode;
  message: string;
}

/** One source file, already read into memory so it can cross to the worker. */
export interface SourceBytes {
  /** The phone's name for it. Kept for the UI only; never uploaded. */
  name: string;
  /** The browser-reported MIME type. Advisory — the bytes are sniffed. */
  type: string;
  bytes: ArrayBuffer;
}

export interface ProcessJob {
  documentKey: DocumentKey;
  sources: SourceBytes[];
  /**
   * Multi-file documents become one PDF. A single-file document that happens
   * to be one image stays a JPEG — wrapping one photo in a PDF makes it bigger
   * and harder for HR to glance at.
   */
  merge: boolean;
}

export interface ProcessOk {
  ok: true;
  /** JPEG bytes or PDF bytes, ready to upload. */
  blob: Blob;
  extension: "pdf" | "jpg";
  bytes: number;
  /** The sum of the source sizes, so the tile can show its working. */
  originalBytes: number;
  sourceCount: number
  pageCount: number;
  advisories: MediaAdvisory[];
}

export interface ProcessFailed {
  ok: false;
  code: MediaErrorCode;
  /** Written for the employee, and shown on the tile verbatim. */
  message: string;
  /** Present on `still-too-large`, so the tile can say how far over it is. */
  bytes?: number;
}

export type ProcessResult = ProcessOk | ProcessFailed;

/** Worker protocol. Correlated by `id` because uploads are sequential but
 *  compression of the next document can overlap the current upload. */
export interface WorkerRequest {
  id: string;
  job: ProcessJob;
}

export interface WorkerResponse {
  id: string;
  result: ProcessResult;
}

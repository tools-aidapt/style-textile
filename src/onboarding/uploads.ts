/**
 * The state of one document, and the words for it.
 *
 * Held apart from the hook that drives it so that validation, the review
 * block and the tests can all read a document's state without a React tree.
 *
 * Nothing leaves the browser until submit. A document is compressed and merged
 * as soon as it is added — that work is what the employee is waiting on — and
 * then held, with its bytes in IndexedDB so a closed tab does not lose the ten
 * minutes it took. Every document goes up together, in the one request the
 * submit makes.
 */

import type { DocumentKey } from "./documents";
import type { MediaAdvisory, MediaErrorCode } from "./media/types";
import type { PrepareStage } from "./media/client";

/**
 * A document is only ever being prepared, ready to send, or refused.
 *
 * Sending is not per-document any more, so there is no per-document upload
 * state: the submit owns that, and it owns it once. Compression has no honest
 * percentage and so gets a spinner and words rather than a bar.
 */
export type EntryPhase =
  | "empty"
  | "preparing"
  /** Compressed, named, and waiting for the submit. */
  | "ready"
  /** The file itself was refused. Kept listed and removable, never dropped. */
  | "rejected";

export interface SourceFile {
  /** Local only, for React keys and for reordering. */
  id: string;
  file: File;
  name: string;
  bytes: number;
}

export interface EntryOutput {
  /**
   * The pairing key that was actually sent with the bytes. Recorded rather
   * than looked up again at submit time, so the manifest states what happened
   * instead of what the spec currently says should have happened.
   */
  clickupFieldName: string;
  filename: string;
  bytes: number;
  originalBytes: number;
  sourceCount: number;
  pageCount: number;
}

export interface DocumentEntry {
  key: DocumentKey;
  phase: EntryPhase;
  /** What the current wait is, so the tile can name it. */
  stage?: PrepareStage;
  sources: SourceFile[];
  output?: EntryOutput;
  /** Held until the upload succeeds; also what goes to IndexedDB when offline. */
  blob?: Blob;
  error?: { code: MediaErrorCode; message: string; bytes?: number };
  advisories: MediaAdvisory[];
  /**
   * Restored from IndexedDB rather than prepared in this sitting. The bytes
   * are real and will be sent; only the source files are gone, so it cannot
   * have a page removed or reordered without being added again.
   */
  restored?: boolean;
}

export const emptyEntry = (key: DocumentKey): DocumentEntry => ({
  key,
  phase: "empty",
  sources: [],
  advisories: [],
});

export type DocumentEntries = Partial<Record<DocumentKey, DocumentEntry>>;

export const entryFor = (entries: DocumentEntries, key: DocumentKey): DocumentEntry =>
  entries[key] ?? emptyEntry(key);

/** Has bytes ready to send. Either way the employee owes nothing more. */
export const isProvided = (entry: DocumentEntry): boolean => entry.phase === "ready";

/** Still compressing. Blocks submit — B-10. */
export const isBusy = (entry: DocumentEntry): boolean => entry.phase === "preparing";

/**
 * Sizes, rendered honestly.
 *
 * "1.2 MB · was 8.4 MB" is on the tile because people trust a form more when
 * it shows its working, and the "was" line is what stops somebody emailing HR
 * to ask whether the upload really finished.
 */
export const formatSize = (bytes: number): string =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export const sizeSummary = (output: EntryOutput): string => {
  const now = formatSize(output.bytes);
  // Only worth saying when compression actually did something visible
  const shrank = output.originalBytes > output.bytes * 1.15;
  return shrank ? `${now} · was ${formatSize(output.originalBytes)}` : now;
};

/** What the one request will weigh. Checked before it is attempted — B-11. */
export const totalBytes = (entries: DocumentEntries): number =>
  Object.values(entries).reduce(
    (total, entry) => total + (entry && isProvided(entry) ? (entry.output?.bytes ?? 0) : 0),
    0,
  );

/** A local id for a source file. Not a submissionId; nothing depends on its shape. */
let sourceCounter = 0;
export const asSource = (file: File): SourceFile => ({
  id: `${(sourceCounter += 1)}`,
  file,
  name: file.name,
  bytes: file.size,
});

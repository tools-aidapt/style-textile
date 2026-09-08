/**
 * Surviving a closed tab.
 *
 * A new hire fills this over two or three sittings, on a phone, hunting for
 * their NSSF card between them. Losing the form to a locked screen is the
 * failure that turns this into thirteen WhatsApp messages to HR.
 *
 * Three stores, for three different things:
 *
 * - **Text answers → `localStorage`**, debounced. Small, and needed on the
 *   very first paint so the restore bar can appear before anything else.
 * - **Uploaded documents → the server.** They are already there; the session
 *   endpoint returns the manifest. Never the bytes: four documents would blow
 *   the `localStorage` quota and the fifth write would throw.
 * - **Compressed but not yet uploaded → IndexedDB**, cleared once uploaded.
 *   This is the offline case, and it is the only place blobs are kept.
 *
 * Everything local is cleared on a successful submit. Bank details and an
 * address must not sit in a phone's storage after the job is done.
 *
 * Every read and write is wrapped. A private window throws on access, and a
 * storage failure must cost the employee the draft and nothing else.
 */

import { emptyValues, type OnboardingValues } from "./form";
import type { DocumentKey } from "./documents";

const DRAFT_KEY = "kenafric.onboarding.draft.v1";
const SUBMISSION_KEY = "kenafric.onboarding.submission.v1";

const UUID_V4 =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

/**
 * Which link a draft belongs to.
 *
 * Answers one question: is this the same person as last time? A shared phone
 * must not show one new hire the part-filled form of another, and two people
 * in the same household on the same handset is not a strange thing at all.
 *
 * The employee id is already in the URL, so there is nothing to protect by
 * hashing it — this is just a short, stable key.
 */
export const scopeOf = (employeeId: string): string => employeeId.trim().toLowerCase();

export interface Draft {
  /** The employee id this draft was filled under. */
  scope: string;
  submissionId: string;
  savedAt: string;
  values: OnboardingValues;
  /** Advisory ids the employee has already ticked, so a reload keeps them. */
  acknowledged: string[];
}

export const readDraft = (employeeId: string): Draft | null => {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    if (!draft?.values || typeof draft.values !== "object") return null;
    // A draft belonging to somebody else is discarded, not shown
    if (draft.scope !== scopeOf(employeeId)) return null;
    return {
      ...draft,
      acknowledged: Array.isArray(draft.acknowledged) ? draft.acknowledged : [],
      // Merged over the empty shape, so a draft written by an older build is
      // missing keys rather than breaking the form
      values: { ...emptyValues(), ...draft.values },
    };
  } catch {
    return null;
  }
};

export const writeDraft = (draft: Omit<Draft, "savedAt">): void => {
  try {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() } satisfies Draft),
    );
  } catch {
    // Private windows throw on write. The form keeps working; the draft does not.
  }
};

export const clearDraft = (): void => {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nothing to do */
  }
};

/**
 * A UUID v4.
 *
 * `crypto.randomUUID` is absent over plain HTTP on some browsers, and the
 * fallback has to be a real v4 — version and variant nibbles included — rather
 * than merely unique, because the wire schema pins the format.
 */
const uuidV4 = (): string => {
  const webCrypto = typeof crypto === "undefined" ? undefined : crypto;
  if (webCrypto?.randomUUID) return webCrypto.randomUUID();

  const bytes = new Uint8Array(16);
  if (webCrypto?.getRandomValues) {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < 16; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

/**
 * The idempotency key.
 *
 * Generated on first mount and reused by every document upload and every
 * submit attempt, including a retry after a failure. n8n rejects a duplicate
 * `submissionId` on submit, and treats a repeated `documentKey` on the same
 * `submissionId` as a REPLACE rather than a second file. A new hire on a flaky
 * connection will retry; that must never produce two submissions or two copies
 * of a payslip.
 */
export const readOrCreateSubmissionId = (employeeId: string): string => {
  const key = `${SUBMISSION_KEY}.${scopeOf(employeeId)}`;
  try {
    const existing = window.localStorage.getItem(key);
    if (existing && UUID_V4.test(existing)) return existing;
  } catch {
    /* fall through to a fresh id */
  }

  const id = uuidV4();
  try {
    window.localStorage.setItem(key, id);
  } catch {
    /* an in-memory id still deduplicates within this page */
  }
  return id;
};

export const clearSubmissionId = (employeeId: string): void => {
  try {
    window.localStorage.removeItem(`${SUBMISSION_KEY}.${scopeOf(employeeId)}`);
  } catch {
    /* nothing to do */
  }
};

// ---------------------------------------------------------------------------
// IndexedDB — compressed documents waiting for a connection
// ---------------------------------------------------------------------------

const DB_NAME = "kenafric-onboarding";
const DB_VERSION = 1;
const STORE = "pending";

export interface PendingDocument {
  submissionId: string;
  documentKey: DocumentKey;
  clickupFieldName: string;
  filename: string;
  blob: Blob;
  bytes: number;
  originalBytes: number;
  sourceCount: number;
  pageCount: number;
}

const openDb = (): Promise<IDBDatabase | null> =>
  new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      // Another tab holding an old version open would otherwise hang here
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

const idFor = (submissionId: string, documentKey: DocumentKey) => `${submissionId}:${documentKey}`;

const withStore = async <T,>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> => {
  const db = await openDb();
  if (!db) return null;
  return new Promise<T | null>((resolve) => {
    try {
      const transaction = db.transaction(STORE, mode);
      const request = work(transaction.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      transaction.oncomplete = () => db.close();
    } catch {
      db.close();
      resolve(null);
    }
  });
};

export const savePending = async (pending: PendingDocument): Promise<void> => {
  await withStore("readwrite", (store) =>
    store.put(pending, idFor(pending.submissionId, pending.documentKey)),
  );
};

export const readPending = async (
  submissionId: string,
  documentKey: DocumentKey,
): Promise<PendingDocument | null> =>
  (await withStore<PendingDocument>("readonly", (store) =>
    store.get(idFor(submissionId, documentKey)) as IDBRequest<PendingDocument>,
  )) ?? null;

/**
 * Everything held for this submission.
 *
 * This is what "close it and come back" now rests on. Nothing leaves the
 * browser until submit, so IndexedDB is the ONLY record that a document was
 * ever prepared — and preparing thirteen of them is the ten minutes of the
 * employee's evening that must not be spent twice.
 */
export const readAllPending = async (submissionId: string): Promise<PendingDocument[]> => {
  const all = await withStore<PendingDocument[]>("readonly", (store) =>
    store.getAll() as IDBRequest<PendingDocument[]>,
  );
  return (all ?? []).filter((pending) => pending?.submissionId === submissionId);
};

export const clearPending = async (
  submissionId: string,
  documentKey: DocumentKey,
): Promise<void> => {
  await withStore("readwrite", (store) => store.delete(idFor(submissionId, documentKey)));
};

/** After a successful submit: nothing of this person stays on the device. */
export const clearEverything = async (employeeId: string): Promise<void> => {
  clearDraft();
  clearSubmissionId(employeeId);
  const db = await openDb();
  if (!db) return;
  try {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).clear();
    transaction.oncomplete = () => db.close();
  } catch {
    db.close();
  }
};

/** "4 minutes ago" — quiet enough for a restore bar, exact enough to trust. */
export const relativeTime = (iso: string): string => {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "earlier";
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) return "a moment ago";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

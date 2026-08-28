/**
 * Draft persistence.
 *
 * The form has four long-text fields and a repeater, and managers fill it a few
 * times a year between other work. Losing a part-written requisition to a
 * closed tab is the failure that pushes the next one back into email, so the
 * whole form is persisted locally and offered back on return.
 *
 * Every read and write is wrapped: a private window throws on access, and a
 * storage failure must cost the manager nothing but the draft.
 */

import { emptyValues, type RequisitionValues } from "./form";

const UUID_V4 =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

const DRAFT_KEY = "aidapt.requisition.draft.v2";
const SUBMISSION_KEY = "aidapt.requisition.submission.v1";

export interface Draft {
  /**
   * Who saved it. TODO(sso): once the org session is wired, a draft whose
   * identity does not match the signed-in user is discarded rather than shown.
   */
  identity: string;
  savedAt: string;
  values: RequisitionValues;
}

export const readDraft = (): Draft | null => {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    // A draft written by an older shape of the form is worse than none
    if (!draft?.values || !Array.isArray(draft.values.keyResponsibilitiesRows)) return null;
    return { ...draft, values: { ...emptyValues(), ...draft.values } };
  } catch {
    return null;
  }
};

export const writeDraft = (values: RequisitionValues, identity: string): void => {
  try {
    const draft: Draft = { identity, savedAt: new Date().toISOString(), values };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
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
 * A UUID v4. The wire schema pins the format with a pattern, so a fallback has
 * to be a real v4 — version and variant nibbles included — rather than merely
 * unique. `crypto.randomUUID` is absent over plain HTTP on some browsers.
 */
const uuidV4 = (): string => {
  const webCrypto = typeof crypto === "undefined" ? undefined : crypto;
  if (webCrypto?.randomUUID) return webCrypto.randomUUID();

  const bytes = new Uint8Array(16);
  if (webCrypto?.getRandomValues) {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

/**
 * The idempotency key. Generated once and reused by every attempt, including a
 * retry after a failure, so a manager double-clicking Submit on a slow
 * connection cannot raise the same requisition twice.
 */
export const readOrCreateSubmissionId = (): string => {
  try {
    const existing = window.localStorage.getItem(SUBMISSION_KEY);
    // An id stored by an older build may not be a v4, which the wire schema
    // rejects outright. Replace it rather than submit something that 422s.
    if (existing && UUID_V4.test(existing)) return existing;
  } catch {
    /* fall through to a fresh id */
  }

  const id = uuidV4();

  try {
    window.localStorage.setItem(SUBMISSION_KEY, id);
  } catch {
    /* an in-memory id still deduplicates within this page */
  }
  return id;
};

/** After a successful submit the next requisition needs its own identity. */
export const clearSubmissionId = (): void => {
  try {
    window.localStorage.removeItem(SUBMISSION_KEY);
  } catch {
    /* nothing to do */
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

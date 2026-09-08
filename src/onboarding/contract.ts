/**
 * The wire contract with n8n — v1.0.
 *
 * ONE call. `multipart/form-data` to a single webhook: a `payload` field
 * carrying the JSON below, and one file part per document, named `file0`,
 * `file1`… with the mapping in `documents[].field`.
 *
 * That makes the submit the only moment anything leaves the browser, which has
 * one consequence worth stating plainly: there is no partial success. A drop at
 * 95% re-sends everything, so the request has to be kept inside what the
 * webhook will accept — see `LIMITS.totalBytes`.
 *
 * Two rules, the same two the requisition contract keeps:
 * - **Labels, never option UUIDs.** n8n resolves `"Cleared Loan"` against the
 *   live schema, which is what keeps this bundle free of ClickUp ids.
 * - **`null` for an empty optional, never `""`.** An empty string is a value
 *   ClickUp will write; `null` means "not answered".
 */

import type { DocumentKey } from "./documents";

export const SCHEMA_VERSION = "1.0" as const;
export const CLIENT_APP = "kenafric-onboarding-web" as const;

/** This client's implementation of the contract, not the npm package. */
export const APP_VERSION = "1.0.0";

/**
 * The consent wording's own version. It travels with the record because
 * "they consented" is only meaningful alongside what they were shown.
 */
export const CONSENT_VERSION = "2026-09";

export const LIMITS = {
  /**
   * The hard ceiling on a finished document — after compression, after any
   * merge. Nothing above this leaves the browser.
   */
  documentBytes: 5 * 1024 * 1024,
  /**
   * A source file above this is refused before any work is attempted.
   * Compressing a 200 MB video someone picked by accident freezes a mid-range
   * phone, and the freeze reads as a broken form rather than a rejected file.
   */
  sourceBytes: 40 * 1024 * 1024,
  sourceFiles: 8,
  /** Beyond this a scanned PDF is refused and the employee is asked to split it. */
  pdfPages: 20,
  note: 200,
  fullName: { min: 3, max: 80 },
  address: { max: 500 },
  bankNameBranch: { max: 120 },
  accountName: { max: 120 },
  /** 34 is the IBAN ceiling; a Kenyan account is about a third of that. */
  accountNumber: { max: 34 },
  /** Below this a document is probably a screenshot of a screenshot (A-4). */
  smallFileBytes: 60 * 1024,
  /**
   * Everything, in one request.
   *
   * 16 MB is n8n's own default `N8N_PAYLOAD_SIZE_MAX`, and it is the reason
   * this limit exists at all: thirteen documents at the 5 MB per-document
   * ceiling would be 65 MB, which the webhook refuses outright — after the
   * employee has spent ten minutes uploading it.
   *
   * So it is checked BEFORE the submit, with a message naming which documents
   * are biggest. If your n8n is configured higher, raise this to match; a
   * ceiling lower than the server's is a self-inflicted rejection, and one
   * higher is a rejection nobody can act on.
   */
  totalBytes: 16 * 1024 * 1024,
} as const;

/** What the employee was told about a document that could not be sent. */
export type NotProvidedReason = "not-applicable" | "first-job" | "too-large" | "skipped";

export interface DocumentManifestEntry {
  documentKey: DocumentKey;
  /** The pairing key. Never derived from the filename. */
  clickupFieldName: string;
  /**
   * Which multipart part carries the bytes — `file0`, `file1`, …
   *
   * Indexed rather than named after the document, because a binary property
   * called `file_drivers-licence` is awkward to reach in an n8n expression and
   * one called `file3` is not. The mapping lives here, where it is explicit.
   */
  field: string;
  filename: string;
  bytes: number;
  originalBytes: number;
  sourceCount: number;
  note: string | null;
  /** Present in this request. There is no other state it could be in. */
  status: "attached";
}

export interface NotProvidedEntry {
  documentKey: DocumentKey;
  reason: NotProvidedReason;
  note?: string;
}

export interface OnboardingSubmission {
  schemaVersion: typeof SCHEMA_VERSION;
  /** UUID v4, generated on first mount, reused by every attempt. */
  submissionId: string;
  /** ISO 8601 UTC. Never epoch from the browser. */
  submittedAt: string;
  client: { app: typeof CLIENT_APP; appVersion: string };
  /**
   * The ClickUp Employee task id the link carried, echoed back by the session
   * endpoint. n8n re-reads it from its own request rather than trusting this
   * copy — see docs/onboarding-field-ids.md.
   */
  employee: { clickupTaskId: string };
  personal: {
    fullName: string;
    personalEmail: string;
    /** Flags a change from the address the link was sent to, for write-back. */
    personalEmailChanged: boolean;
    /**
     * E.164 — the chosen country code and the national digits, composed.
     * Kenyan numbers are validated properly; other countries get a length
     * check only, so the pattern on the wire is E.164 rather than +254-only.
     */
    mobile: string;
    address: string;
  };
  bank: {
    /**
     * Three answers on the wire; n8n concatenates them into the one
     * `Bank Account Details` text field the workspace has. Kept apart here
     * because "Stephen Wahito 0110123456789" is not something a payroll clerk
     * can safely split back up.
     */
    bankNameBranch: string;
    accountName: string;
    accountNumber: string;
    helbLoanStatus: string;
  };
  documents: DocumentManifestEntry[];
  notProvided: NotProvidedEntry[];
  /** Codes of the advisories the employee explicitly acknowledged. */
  advisoriesAcknowledged: string[];
  consent: { given: true; at: string; version: string };
}

/** `201`. `duplicate: true` is the idempotent replay, and is still a success. */
export interface SubmissionSuccess {
  ok: true;
  submissionId: string;
  taskId: string;
  duplicate?: boolean;
}

/**
 * `422`. `path` is dot-notation matching the payload, so an issue maps to the
 * field that holds it. Server messages are shown verbatim — the app never
 * rewords something written for the employee to read.
 */
export interface SubmissionIssue {
  path: string;
  code: string;
  message: string;
}

/** The reply to one document upload. */
export interface DocumentUploadReceipt {
  ok: true;
  documentKey: DocumentKey;
  storedAs: string;
  bytes: number;
}

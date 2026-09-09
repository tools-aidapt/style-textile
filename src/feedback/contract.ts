/**
 * The wire contract with n8n — v1.0.
 *
 * One `application/json` POST to WF-14. Four keys, and nothing else:
 *
 * ```json
 * {
 *   "t": "<the token from the link, verbatim>",
 *   "formType": "CRR",
 *   "submittedAt": "2026-09-09T14:20:00+03:00",
 *   "answers": { "<clickup field id>": 4 }
 * }
 * ```
 *
 * Three rules hold this together, and each one exists because breaking it
 * costs a workflow rebuild:
 *
 * - **`answers` is keyed by ClickUp custom field id.** WF-14 holds no
 *   question-text mapping table, so rewording a question never breaks it and
 *   a new instrument needs no workflow change.
 * - **Option NAMES, never option UUIDs.** WF-14 resolves a name against the
 *   live field schema. An option UUID changes if anyone rebuilds a field, and
 *   a public bundle has no business holding one.
 * - **An unanswered optional question is OMITTED, not sent as null or "".**
 *   An empty string is a value ClickUp will write, which turns "they skipped
 *   it" into "they answered nothing" — and those report differently.
 *
 * What the app deliberately does NOT send:
 *
 * - **The structural fields.** Form Type, Position, Person, Company,
 *   Department, Recruitment Type, Submitted On, Response Token and Overall
 *   Rating are all derivable by WF-14 from the token and the tasks it loads.
 *   A browser that cannot be trusted to say who it is must not be the source
 *   of who the response belongs to, and every ClickUp id kept out of the
 *   bundle is one that cannot leak from it.
 * - **`Overall Rating`.** WF-14 computes it. Two computations of one number
 *   is one too many; the app's copy is for display and the log line only.
 * - **An idempotency key.** The token is the idempotency key. WF-14 refuses a
 *   `Response Token` already present on the list, which is also what makes an
 *   n8n retry harmless.
 */

import type { FormType } from "./schema";

export const SCHEMA_VERSION = "1.0" as const;
export const CLIENT_APP = "kenafric-feedback-web" as const;

/** This client's implementation of the contract, not the npm package. */
export const APP_VERSION = "1.0.0";

/**
 * A single answer.
 *
 * `number` for a five-star question — an integer 1-5, which is what the
 * ClickUp `emoji` field takes and returns. `string` for everything else,
 * including a 1-5 dropdown, whose options really are named "1" to "5".
 */
export type AnswerValue = number | string;

/** Keyed by ClickUp custom field id. Sparse: unanswered questions are absent. */
export type Answers = Record<string, AnswerValue>;

export interface FeedbackSubmission {
  /** The token from the link, passed straight through. Never decoded here. */
  t: string;
  formType: FormType;
  /** ISO 8601 with the offset, so a 09:00 EAT submit does not read as 06:00. */
  submittedAt: string;
  answers: Answers;
}

/** WF-14 answers before it touches ClickUp, so this is thin on purpose. */
export interface FeedbackReceipt {
  ok: true;
  /** Present once the response task exists. Never shown to a candidate. */
  taskId?: string;
}

/**
 * Why a submit was refused, per question, so the form can point at it.
 *
 * `field` is a ClickUp field id when WF-14 can attribute the objection to one
 * answer, and absent when it cannot.
 */
export interface SubmissionIssue {
  field?: string;
  message: string;
}

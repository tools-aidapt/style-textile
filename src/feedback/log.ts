/**
 * Logging, on a page that collects opinions about named colleagues.
 *
 * `lib/telemetry.ts` raises a DOM event so an analytics snippet can pick a
 * failure up. This layer deliberately does not use it, for the same reason
 * `onboarding/log.ts` does not: a session recorder here captures a candidate
 * saying their interviewer was unprepared, or a manager rating a named new
 * hire a 2 — attributed, in a third party's console, for ever.
 *
 * What may be logged: the form type, the outcome, a count, a rating, an HTTP
 * status, a short machine code.
 *
 * What may never be logged: an answer, a name, an email, a payroll number, a
 * position title, or the token — the token identifies the person and is the
 * credential that opens their form.
 */

import type { FormType } from "./schema";

export type FeedbackOutcome =
  | "opened"
  | "context-refused"
  | "submitted"
  | "submit-rejected"
  | "submit-failed";

export interface FeedbackLogFields {
  formType?: FormType;
  /** How many questions were on screen, and how many were answered. */
  asked?: number;
  answered?: number;
  /** The mean of the rating questions. A figure, attached to no name. */
  rating?: number | null;
  status?: number;
  /** A short machine code — never a message written about a person. */
  code?: string;
}

export const logFeedback = (outcome: FeedbackOutcome, fields: FeedbackLogFields = {}): void => {
  // One line, one shape, no free text
  console.info("feedback", { outcome, ...fields });
};

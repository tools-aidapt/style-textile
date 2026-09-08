/**
 * Logging, on the one page in this app where logging is dangerous.
 *
 * `lib/telemetry.ts` raises a DOM event so that an analytics snippet in
 * index.html can pick a failure up. This app deliberately does not use it. A
 * session recorder or an error reporter that captures DOM or input values on
 * this form is a bank-detail breach with a subscription fee, and an event bus
 * is the doorway to one — so there is no bus here, only the console.
 *
 * What may be logged: `submissionId`, `documentKey`, byte counts, outcomes.
 * What may never be logged: a filename (it contains a surname and a given
 * name), a field value, or anything derived from a photo. The employee id is
 * in the URL and in the logs either way, so it is not the thing at risk here.
 */

import type { DocumentKey } from "./documents";

export type OnboardingOutcome =
  | "prepared"
  | "prepare-refused"
  | "uploaded"
  | "upload-retry"
  | "upload-failed"
  | "submitted"
  | "submit-failed";

export interface OnboardingLogFields {
  submissionId: string;
  documentKey?: DocumentKey;
  bytes?: number;
  originalBytes?: number;
  attempt?: number;
  status?: number;
  /** A short machine code — never a message written about a person's file. */
  code?: string;
}

export const logOnboarding = (outcome: OnboardingOutcome, fields: OnboardingLogFields): void => {
  // One line, one shape, no free text
  console.info("onboarding", { outcome, ...fields });
};

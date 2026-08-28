/**
 * Failure reporting for the one flow that must not fail silently.
 *
 * A dropped application is invisible to us and looks like rejection to the
 * candidate, so every failed submission is logged with its shape and raised as
 * a DOM event that any analytics snippet in index.html can listen for. No
 * analytics dependency, and — deliberately — no candidate data in the payload.
 */

export type SubmissionFailure = "http" | "network" | "timeout";

export interface SubmissionFailureDetail {
  kind: SubmissionFailure;
  /** ClickUp task id of the role. Not personal data. */
  position?: string;
  status?: number;
  message?: string;
}

export const SUBMISSION_FAILURE_EVENT = "careers:submission-failed";

export const reportSubmissionFailure = (
  kind: SubmissionFailure,
  detail: Omit<SubmissionFailureDetail, "kind"> = {},
): void => {
  const payload: SubmissionFailureDetail = { kind, ...detail };
  console.error("Application submission failed", payload);
  window.dispatchEvent(new CustomEvent(SUBMISSION_FAILURE_EVENT, { detail: payload }));
};

import { useCallback, useRef, useState } from "react";
import { basicAuthFor, config } from "@/lib/config";
import { APP_VERSION, CLIENT_APP } from "@/feedback/contract";
import type {
  FeedbackReceipt,
  FeedbackSubmission,
  SubmissionIssue,
} from "@/feedback/contract";
import { logFeedback } from "@/feedback/log";

/**
 * A few kilobytes of JSON. `fetch` is enough — there is no upload to report
 * progress on, which is the only reason the onboarding submit uses XHR.
 */
const SUBMIT_TIMEOUT_MS = 30_000;

export type FeedbackSubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  /** WF-21 rejected the content. Answers stay on screen, marked. */
  | { status: "rejected"; issues: SubmissionIssue[] }
  | { status: "failed"; message: string; retryable: boolean }
  | { status: "succeeded"; receipt: FeedbackReceipt };

const issuesFrom = (body: unknown): SubmissionIssue[] => {
  const raw = (body as { issues?: unknown })?.issues;
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((entry) => {
    const item = entry as { field?: unknown; message?: unknown };
    const message = typeof item.message === "string" ? item.message.trim() : "";
    if (!message) return [];
    return [
      {
        field: typeof item.field === "string" ? item.field : undefined,
        message,
      },
    ];
  });
};

/**
 * The submit.
 *
 * One JSON POST, and the token is the idempotency key: WF-21 refuses a
 * `Response Token` already present on the list. That is what makes an n8n
 * retry harmless, and it is also why a **409 is a success** here — it means
 * this response is already filed, which is exactly what the person wanted.
 * Showing them a failure would have them reply to HR about a survey that went
 * through.
 */
export const useFeedbackSubmit = () => {
  const [state, setState] = useState<FeedbackSubmitState>({ status: "idle" });
  const inFlight = useRef(false);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  const submit = useCallback(async (payload: FeedbackSubmission) => {
    // The token is single-use, so a double submit is not just wasteful
    if (inFlight.current) return;

    if (!config.feedbackSubmitUrl) {
      setState({
        status: "failed",
        message:
          "This form is not connected yet, so it cannot be sent. Please reply to the email we sent you.",
        retryable: false,
      });
      logFeedback("submit-failed", { formType: payload.formType, code: "unconfigured" });
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      // Said before the attempt rather than after a timeout: they already
      // know they are offline and want to hear that their answers are safe
      setState({
        status: "failed",
        message: "You are offline. Your answers are still here — try again once you have a connection.",
        retryable: true,
      });
      return;
    }

    inFlight.current = true;
    setState({ status: "submitting" });

    const auth = basicAuthFor(config.feedbackWebhookUser, config.feedbackWebhookPassword);
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), SUBMIT_TIMEOUT_MS);

    try {
      const response = await fetch(config.feedbackSubmitUrl, {
        method: "POST",
        signal: timeout.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Aidapt-Client": `${CLIENT_APP}/${APP_VERSION}`,
          ...(auth
            ? { Authorization: `Basic ${btoa(`${auth.username}:${auth.password}`)}` }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      let body: unknown = {};
      try {
        body = await response.json();
      } catch {
        /* a 2xx with no body is still a success */
      }

      // Already filed. The candidate's answers are in ClickUp; this is a
      // success with a different status code on it.
      if (response.status === 409) {
        setState({ status: "succeeded", receipt: { ok: true } });
        logFeedback("submitted", { formType: payload.formType, code: "duplicate" });
        return;
      }

      if (response.status === 422 || response.status === 400) {
        const issues = issuesFrom(body);
        setState({
          status: "rejected",
          issues: issues.length
            ? issues
            : [{ message: "Some answers were not accepted. Please check them and send again." }],
        });
        logFeedback("submit-rejected", { formType: payload.formType, status: response.status });
        return;
      }

      if (!response.ok) {
        // A 4xx will not fix itself; a 5xx or a timeout usually does
        const retryable = response.status >= 500;
        setState({
          status: "failed",
          message: retryable
            ? "Your answers are still on this page. Try again — if it keeps failing, reply to the email we sent you."
            : "Your answers are still on this page, but we cannot send them from here. Please reply to the email we sent you.",
          retryable,
        });
        logFeedback("submit-failed", { formType: payload.formType, status: response.status });
        return;
      }

      const taskId = (body as { taskId?: unknown })?.taskId;
      setState({
        status: "succeeded",
        receipt: { ok: true, taskId: typeof taskId === "string" ? taskId : undefined },
      });
      logFeedback("submitted", {
        formType: payload.formType,
        answered: Object.keys(payload.answers).length,
      });
    } catch (error) {
      const aborted = timeout.signal.aborted;
      setState({
        status: "failed",
        message: aborted
          ? "That took too long. Your answers are still on this page — try again."
          : "Your answers are still on this page. Try again — if it keeps failing, reply to the email we sent you.",
        retryable: true,
      });
      logFeedback("submit-failed", {
        formType: payload.formType,
        code: aborted ? "timeout" : "network",
      });
      // Swallowed on purpose: `error` can carry a request URL, and the URL
      // carries the token. Nothing about it reaches a console here.
      void error;
    } finally {
      clearTimeout(timer);
      inFlight.current = false;
    }
  }, []);

  return { state, submit, reset };
};

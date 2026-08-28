import { useCallback, useRef, useState } from "react";
import { basicAuthFor, config, reportMissingConfig } from "@/lib/config";
import { reportSubmissionFailure } from "@/lib/telemetry";
import { CLIENT_APP, APP_VERSION } from "@/requisition/contract";
import type {
  RequisitionSubmission,
  SubmissionIssue,
  SubmissionSuccess,
} from "@/requisition/contract";

/** A requisition takes a moment to create in ClickUp; be patient before giving up. */
const SUBMIT_TIMEOUT_MS = 30_000;

/** `409 in_progress` — the same submissionId is mid-flight. Look again after this. */
const IN_FLIGHT_WAIT_MS = 3_000;

/** Cap on an auto-retry the server asked for, so a bad Retry-After cannot hang the form. */
const MAX_RETRY_AFTER_MS = 30_000;

export type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  /** A 422. Every issue maps to a field by dot-path; messages are shown verbatim. */
  | { status: "rejected"; issues: SubmissionIssue[] }
  | { status: "failed"; message: string; retryable: boolean }
  | { status: "succeeded"; receipt: SubmissionSuccess };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** `Retry-After` is either seconds or an HTTP date. Both are worth honouring. */
const retryAfterMs = (header: string | null): number => {
  if (!header) return 1_000;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.min(seconds * 1_000, MAX_RETRY_AFTER_MS);
  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.min(Math.max(date - Date.now(), 0), MAX_RETRY_AFTER_MS);
  return 1_000;
};

/**
 * Submits a requisition to the n8n webhook that holds the ClickUp credential.
 *
 * Every attempt carries the same `submissionId`, so nothing here can create a
 * second requisition: n8n keeps a 24-hour store keyed on it and replays the
 * original receipt. That is what makes the automatic retries below safe.
 *
 * On every failure the form keeps every value and the draft stays in
 * localStorage. A manager must never lose four essay fields to a network blip.
 */
export const useRequisitionSubmit = () => {
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  /** Guards against a second submit while one is in flight. */
  const inFlight = useRef(false);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  const submit = useCallback(async (payload: RequisitionSubmission) => {
    if (inFlight.current) return;

    if (!config.requisitionWebhookUrl) {
      reportMissingConfig("VITE_REQUISITION_WEBHOOK_URL");
      setState({
        status: "failed",
        message: "Requisitions are temporarily unavailable. Your answers are saved.",
        retryable: false,
      });
      return;
    }

    inFlight.current = true;
    setState({ status: "submitting" });

    const auth = basicAuthFor(config.requisitionWebhookUser, config.requisitionWebhookPassword);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      // Identifies the client implementing the contract, and ties every attempt
      // of one requisition together in the n8n logs
      "X-Aidapt-Client": `${CLIENT_APP}/${APP_VERSION}`,
      "X-Request-Id": payload.submissionId,
      ...(auth ? { Authorization: `Basic ${btoa(`${auth.username}:${auth.password}`)}` } : {}),
    };

    const attempt = () =>
      fetch(config.requisitionWebhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
      });

    /** `retriesLeft` bounds the automatic ones; a manual Retry starts over. */
    const run = async (retriesLeft: number): Promise<void> => {
      let response: Response;
      try {
        response = await attempt();
      } catch (error) {
        const timedOut = error instanceof DOMException && error.name === "TimeoutError";
        reportSubmissionFailure(timedOut ? "timeout" : "network", {
          message: error instanceof Error ? error.message : undefined,
        });
        setState({
          status: "failed",
          message: "Couldn't reach the server. Your answers are saved. Try again.",
          retryable: true,
        });
        return;
      }

      const body = (await response.json().catch(() => ({}))) as
        | SubmissionSuccess
        | { ok?: false; error?: string; issues?: SubmissionIssue[] };

      if (response.ok) {
        // `duplicate: true` is the idempotent replay. It is a success, and the
        // manager sees the same confirmation — never an error.
        setState({ status: "succeeded", receipt: body as SubmissionSuccess });
        return;
      }

      reportSubmissionFailure("http", { status: response.status });
      const error = "error" in body ? body.error : undefined;

      switch (response.status) {
        case 422:
          setState({
            status: "rejected",
            issues: ("issues" in body && body.issues?.length ? body.issues : null) ?? [
              {
                path: "",
                code: error ?? "validation_failed",
                message: "The requisition was rejected. Check the fields above and try again.",
              },
            ],
          });
          return;

        case 409:
          // The same submissionId is already being processed. Asking again is
          // safe, and returns the original receipt.
          if (retriesLeft > 0) {
            await wait(IN_FLIGHT_WAIT_MS);
            return run(retriesLeft - 1);
          }
          setState({
            status: "failed",
            message: "This requisition is still being filed. Give it a moment, then try again.",
            retryable: true,
          });
          return;

        case 429:
          if (retriesLeft > 0) {
            await wait(retryAfterMs(response.headers.get("Retry-After")));
            return run(retriesLeft - 1);
          }
          setState({
            status: "failed",
            message: "The server is busy. Your answers are saved. Try again in a moment.",
            retryable: true,
          });
          return;

        case 502:
          // A ClickUp field is missing. Retrying cannot fix it, and n8n has
          // already alerted HR.
          setState({
            status: "failed",
            message:
              "This form isn't ready yet — a field it writes to is missing from ClickUp. HR has been notified. Your answers are saved.",
            retryable: false,
          });
          return;

        case 401:
          setState({
            status: "failed",
            message: "Your session has expired. Sign in again — your draft is safe.",
            retryable: false,
          });
          return;

        case 500:
          if (retriesLeft > 0) return run(retriesLeft - 1);
          setState({
            status: "failed",
            message: "The server couldn't take the requisition. Your answers are saved. Try again.",
            retryable: true,
          });
          return;

        default:
          setState({
            status: "failed",
            message: "The requisition couldn't be filed. Your answers are saved. Try again.",
            retryable: true,
          });
      }
    };

    try {
      await run(1);
    } finally {
      inFlight.current = false;
    }
  }, []);

  return { state, submit, reset };
};

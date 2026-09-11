import { useCallback, useRef, useState } from "react";
import { basicAuthFor, config } from "@/lib/config";
import { APP_VERSION, CLIENT_APP } from "@/kpi/contract";
import type { KpiReceipt, KpiSubmission, SubmissionIssue } from "@/kpi/contract";
import { logKpi } from "@/kpi/log";

/**
 * A few kilobytes of JSON. `fetch` is enough — there is no upload to report
 * progress on, which is the only reason the onboarding submit uses XHR.
 */
const SUBMIT_TIMEOUT_MS = 30_000;

export type KpiSubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  /** The workflow rejected the content. Answers stay on screen, marked. */
  | { status: "rejected"; issues: SubmissionIssue[] }
  | { status: "failed"; message: string; retryable: boolean }
  | { status: "succeeded"; receipt: KpiReceipt };

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
 * One JSON POST, and the token is the idempotency key: WF-18b refuses a
 * `KPI Set Token` already present on the list, and WF-26b refuses a review
 * whose marker is already on the record. That is what makes an n8n retry
 * harmless, and it is also why a **409 is a success** here — it means this
 * work is already filed, which is exactly what the manager wanted. Showing
 * them a failure would have them email HR about a review that went through.
 *
 * ---
 * **A sample submission never leaves the browser.** `sample` is set only by
 * the mock context, and it short-circuits everything below: no POST, no
 * endpoint, just the success screen. Posting invented KPI content to WF-18b
 * would create real ClickUp tasks against a real employee record.
 * ---
 */
export const useKpiSubmit = () => {
  const [state, setState] = useState<KpiSubmitState>({ status: "idle" });
  const inFlight = useRef(false);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  const submit = useCallback(
    async (payload: KpiSubmission, options: { url: string; sample?: boolean }) => {
      // The token is single-use, so a double submit is not just wasteful
      if (inFlight.current) return;

      const mode = payload.formType === "KPIR" ? payload.mode : null;

      if (options.sample) {
        setState({ status: "succeeded", receipt: { ok: true } });
        logKpi("submitted", { formType: payload.formType, mode, code: "sample" });
        return;
      }

      if (!options.url) {
        setState({
          status: "failed",
          message:
            "This form is not connected yet, so it cannot be sent. Please reply to the email we sent you.",
          retryable: false,
        });
        logKpi("submit-failed", { formType: payload.formType, mode, code: "unconfigured" });
        return;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        // Said before the attempt rather than after a timeout: they already
        // know they are offline and want to hear that their answers are safe
        setState({
          status: "failed",
          message:
            "You are offline. Everything you have filled in is still here — try again once you have a connection.",
          retryable: true,
        });
        return;
      }

      inFlight.current = true;
      setState({ status: "submitting" });

      const auth = basicAuthFor(config.kpiWebhookUser, config.kpiWebhookPassword);
      const timeout = new AbortController();
      const timer = setTimeout(() => timeout.abort(), SUBMIT_TIMEOUT_MS);

      try {
        const response = await fetch(options.url, {
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

        // Already filed. This is a success with a different status code on it.
        if (response.status === 409) {
          setState({ status: "succeeded", receipt: { ok: true } });
          logKpi("submitted", { formType: payload.formType, mode, code: "duplicate" });
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
          logKpi("submit-rejected", { formType: payload.formType, mode, status: response.status });
          return;
        }

        if (!response.ok) {
          // A 4xx will not fix itself; a 5xx or a timeout usually does
          const retryable = response.status >= 500;
          setState({
            status: "failed",
            message: retryable
              ? "Everything you filled in is still on this page. Try again — if it keeps failing, reply to the email we sent you."
              : "Everything you filled in is still on this page, but we cannot send it from here. Please reply to the email we sent you.",
            retryable,
          });
          logKpi("submit-failed", { formType: payload.formType, mode, status: response.status });
          return;
        }

        const taskId = (body as { taskId?: unknown })?.taskId;
        setState({
          status: "succeeded",
          receipt: { ok: true, taskId: typeof taskId === "string" ? taskId : undefined },
        });
        logKpi("submitted", {
          formType: payload.formType,
          mode,
          kpis: payload.kpis.length,
        });
      } catch (error) {
        const aborted = timeout.signal.aborted;
        setState({
          status: "failed",
          message: aborted
            ? "That took too long. Everything you filled in is still on this page — try again."
            : "Everything you filled in is still on this page. Try again — if it keeps failing, reply to the email we sent you.",
          retryable: true,
        });
        logKpi("submit-failed", {
          formType: payload.formType,
          mode,
          code: aborted ? "timeout" : "network",
        });
        // Swallowed on purpose: `error` can carry a request URL, and the URL
        // carries the token. Nothing about it reaches a console here.
        void error;
      } finally {
        clearTimeout(timer);
        inFlight.current = false;
      }
    },
    [],
  );

  return { state, submit, reset };
};

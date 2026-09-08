import { useCallback, useRef, useState } from "react";
import { basicAuthFor, config } from "@/lib/config";
import { APP_VERSION, CLIENT_APP } from "@/onboarding/contract";
import type {
  OnboardingSubmission,
  SubmissionIssue,
  SubmissionSuccess,
} from "@/onboarding/contract";
import { logOnboarding } from "@/onboarding/log";
import type { PreparedFile } from "./useOnboardingUploads";

/**
 * Long, because this is the whole submission — up to sixteen megabytes of
 * documents over a mobile connection, not a metadata call.
 */
const SUBMIT_TIMEOUT_MS = 10 * 60 * 1000;
/** `409 in_progress` — the same submissionId is mid-flight. Look again after this. */
const IN_FLIGHT_WAIT_MS = 3_000;

export type OnboardingSubmitState =
  | { status: "idle" }
  /** `progress` is 0 to 1 — real, taken from the upload itself. */
  | { status: "submitting"; progress: number }
  | { status: "rejected"; issues: SubmissionIssue[] }
  | { status: "failed"; message: string; retryable: boolean }
  | { status: "succeeded"; receipt: SubmissionSuccess };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The submit: the metadata and every document, in one `multipart/form-data`
 * request.
 *
 * A `payload` part carries the JSON, and each document is its own part named
 * `file0`, `file1`… with the mapping in `documents[].field`. n8n receives one
 * item with one JSON string and N binaries.
 *
 * The consequence worth being honest about: **there is no partial success.** A
 * drop at 95% re-sends everything. So this needs a real progress figure — a
 * spinner on a four-minute upload gets reloaded, and a reload mid-request is
 * how somebody submits twice.
 *
 * The idempotency key makes that harmless anyway. Every attempt carries the
 * same `submissionId`, n8n rejects the duplicate and replays the receipt, and
 * nothing here can create two submissions.
 */
export const useOnboardingSubmit = () => {
  const [state, setState] = useState<OnboardingSubmitState>({ status: "idle" });
  const inFlight = useRef(false);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  const submit = useCallback(async (payload: OnboardingSubmission, files: PreparedFile[]) => {
    if (inFlight.current) return;

    if (!config.onboardingSubmitUrl) {
      setState({
        status: "failed",
        message:
          "This form isn't connected yet, so it can't be sent. Your answers and documents are saved. Please tell HR.",
        retryable: false,
      });
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      // Said before the attempt rather than after a timeout: the employee
      // already knows they are offline and wants to hear that it is fine
      setState({
        status: "failed",
        message: "You're offline. Everything is saved — try again once you have a connection.",
        retryable: true,
      });
      return;
    }

    inFlight.current = true;
    setState({ status: "submitting", progress: 0 });

    const build = () => {
      const form = new FormData();
      form.set("payload", JSON.stringify(payload));
      files.forEach((file) => form.set(file.field, file.blob, file.output.filename));
      return form;
    };

    const auth = basicAuthFor(config.onboardingWebhookUser, config.onboardingWebhookPassword);

    /**
     * XHR rather than fetch, for one reason: upload progress. `fetch` cannot
     * report it, and this request can run for minutes.
     */
    const attempt = () =>
      new Promise<{ status: number; body: unknown }>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", config.onboardingSubmitUrl);
        request.timeout = SUBMIT_TIMEOUT_MS;
        request.setRequestHeader("Accept", "application/json");
        request.setRequestHeader("X-Aidapt-Client", `${CLIENT_APP}/${APP_VERSION}`);
        request.setRequestHeader("X-Request-Id", payload.submissionId);
        if (auth) {
          request.setRequestHeader(
            "Authorization",
            `Basic ${btoa(`${auth.username}:${auth.password}`)}`,
          );
        }

        request.upload.addEventListener("progress", (event) => {
          if (!event.lengthComputable) return;
          // Capped just under 1 until the server answers. The bytes leaving is
          // not the submission being filed, and sitting at 100% while ClickUp
          // is still being written reads as a hang.
          setState({
            status: "submitting",
            progress: Math.min(0.99, event.loaded / event.total),
          });
        });

        request.addEventListener("load", () => {
          let body: unknown = {};
          try {
            body = JSON.parse(request.responseText);
          } catch {
            /* a 2xx with no body is still a success */
          }
          resolve({ status: request.status, body });
        });
        request.addEventListener("error", () => reject(new Error("network")));
        request.addEventListener("timeout", () => reject(new Error("timeout")));
        request.addEventListener("abort", () => reject(new Error("aborted")));

        request.send(build());
      });

    const run = async (retriesLeft: number): Promise<void> => {
      let response: { status: number; body: unknown };
      try {
        response = await attempt();
      } catch (error) {
        const code = error instanceof Error ? error.message : "network";
        logOnboarding("submit-failed", { submissionId: payload.submissionId, code });
        setState({
          status: "failed",
          message:
            code === "timeout"
              ? "That took too long to send. Everything is saved — try again, ideally on a stronger connection."
              : "We couldn't reach the server. Everything is saved. Try again.",
          retryable: true,
        });
        return;
      }

      const body = response.body as
        | SubmissionSuccess
        | { ok?: false; error?: string; issues?: SubmissionIssue[] };

      if (response.status >= 200 && response.status < 300) {
        // `duplicate: true` is the idempotent replay. It is a success, and the
        // employee sees the same confirmation — never an error.
        logOnboarding("submitted", {
          submissionId: payload.submissionId,
          bytes: files.reduce((total, file) => total + file.output.bytes, 0),
        });
        setState({ status: "succeeded", receipt: body as SubmissionSuccess });
        return;
      }

      logOnboarding("submit-failed", {
        submissionId: payload.submissionId,
        status: response.status,
      });

      switch (response.status) {
        case 413:
          // The webhook refused the size. Another attempt sends the same bytes,
          // so it cannot help — and LIMITS.totalBytes is what to look at.
          setState({
            status: "failed",
            message:
              "Your documents are too large to send in one go. Remove the largest one, submit, and send that one to HR by email.",
            retryable: false,
          });
          return;

        case 422:
          setState({
            status: "rejected",
            issues: ("issues" in body && body.issues?.length ? body.issues : null) ?? [
              {
                path: "",
                code: "validation_failed",
                message: "Something above wasn't accepted. Check your answers and try again.",
              },
            ],
          });
          return;

        case 401:
        case 403:
        case 410:
          setState({
            status: "failed",
            message:
              "This link no longer works. Ask HR to send a new one — nothing you've filled in is lost.",
            retryable: false,
          });
          return;

        case 404:
          // The webhook is not there. Not the employee's link, and not
          // something another attempt will fix.
          setState({
            status: "failed",
            message: "We couldn't find where this gets filed. Everything is saved — please tell HR.",
            retryable: false,
          });
          return;

        case 409:
          if (retriesLeft > 0) {
            await wait(IN_FLIGHT_WAIT_MS);
            return run(retriesLeft - 1);
          }
          setState({
            status: "failed",
            message: "This is still being filed. Give it a moment, then try again.",
            retryable: true,
          });
          return;

        case 429:
          // Not retried automatically: re-sending sixteen megabytes at a busy
          // server is the wrong instinct, and the employee can press the button
          setState({
            status: "failed",
            message: "The server is busy. Everything is saved. Try again in a moment.",
            retryable: true,
          });
          return;

        default:
          setState({
            status: "failed",
            message: "We couldn't finish submitting. Everything is saved. Try again.",
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

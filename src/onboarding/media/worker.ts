/// <reference lib="webworker" />

/**
 * The compression worker.
 *
 * Everything expensive happens here: decoding a 12 MP photo, the quality
 * ladder, and building the merged PDF. On the main thread, four photos is
 * about ten seconds of a frozen phone — during which the employee taps the
 * button again, because a frozen phone is indistinguishable from a broken
 * form. This is the whole reason for the worker.
 *
 * It holds no state between jobs, so a failed job cannot poison the next one.
 */

import { runPipeline } from "./pipeline";
import type { WorkerRequest, WorkerResponse } from "./types";

const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const { id, job } = event.data;

  void runPipeline(job)
    .then((result) => {
      const response: WorkerResponse = { id, result };
      scope.postMessage(response);
    })
    .catch((error: unknown) => {
      // Any throw that got past the pipeline's own handling is still an answer
      // the tile has to be able to show
      const response: WorkerResponse = {
        id,
        result: {
          ok: false,
          code: "decode-failed",
          message: "This file couldn't be processed. Try a different one.",
        },
      };
      // Logged without the filename — no PII in any log line
      console.error("onboarding compression failed", {
        documentKey: job.documentKey,
        reason: error instanceof Error ? error.name : "unknown",
      });
      scope.postMessage(response);
    });
});

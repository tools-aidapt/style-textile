import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { routeFetch } from "@/test/fetchRouter";
import { useFeedbackContext } from "./useFeedbackContext";

/**
 * How often the context endpoint is called, and it must be once.
 *
 * This is a cost test, not a correctness one, which is why it is pinned
 * rather than left to the hook's options. Each context call is three ClickUp
 * API reads against a 100-per-minute limit shared with the whole HR system.
 * A one-minute poll across twenty open tabs is sixty calls a minute spent on
 * data that cannot change: the token is single-use and the prefill is a
 * snapshot of a task nobody is editing while the form is open.
 *
 * The hook is already written not to poll — no `refetchInterval`, and
 * `staleTime`/`gcTime` are Infinity with every refetch trigger off. There was
 * nothing to remove. This file is what stops the next person adding one, and
 * what makes the guarantee checkable instead of a claim in a comment.
 */

const TOKEN = "eyJmdCI6Ik1SUiIsInBpZCI6Ijg2OWV0YzA4NSJ9.dGVzdC1zaWduYXR1cmUtbm90LXJlYWw";
const CONTEXT = "kenafric-feedback-context";

const body = {
  ok: true,
  formType: "MRR",
  alreadySubmitted: false,
  prefill: { fullName: "Peter Njoroge", email: "peter.njoroge.sample@example.com" },
};

/**
 * A fresh client per test, with retries off.
 *
 * The app's own client is configured in `App.tsx`; this mirrors only what
 * matters here. `retry: false` so a deliberate failure counts as one call
 * rather than three.
 */
const wrap = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const callsTo = (mock: ReturnType<typeof routeFetch>, fragment: string) =>
  mock.mock.calls.filter(([url]) => String(url).includes(fragment)).length;

describe("useFeedbackContext", () => {
  beforeEach(() => {
    // `shouldAdvanceTime` keeps React Query's own scheduling working while
    // letting the test jump forward; without it the library stalls
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("asks the endpoint once, and not again two minutes later", async () => {
    const mock = routeFetch([{ match: CONTEXT, body }]);
    const { result } = renderHook(() => useFeedbackContext(TOKEN), { wrapper: wrap() });

    await waitFor(() => expect(result.current.context).not.toBeNull());
    expect(callsTo(mock, CONTEXT)).toBe(1);

    // Well past any plausible poll interval
    await vi.advanceTimersByTimeAsync(120_000);
    expect(callsTo(mock, CONTEXT)).toBe(1);
  });

  it("sends the token as ?t=, which is what the n8n Webhook node reads", async () => {
    const mock = routeFetch([{ match: CONTEXT, body }]);
    renderHook(() => useFeedbackContext(TOKEN), { wrapper: wrap() });

    await waitFor(() => expect(callsTo(mock, CONTEXT)).toBe(1));
    const url = String(mock.mock.calls[0][0]);
    expect(url).toContain(`?t=${encodeURIComponent(TOKEN)}`);
  });

  it("asks for nothing at all without a token", () => {
    const mock = routeFetch([{ match: CONTEXT, body }]);
    const { result } = renderHook(() => useFeedbackContext(""), { wrapper: wrap() });

    expect(callsTo(mock, CONTEXT)).toBe(0);
    expect(result.current.fault).toBe("no-token");
  });

  it("carries the endpoint's own refusal wording through", async () => {
    /**
     * A 200 with `ok: false` is a refusal the server chose to explain. The
     * explanation is written where the secret is, so it is preferred over the
     * generic dead end — and the endpoint owns the rule that it must not name
     * a person, since whoever holds the link reads it.
     */
    routeFetch([{ match: CONTEXT, body: { ok: false, reason: "This review has been cancelled." } }]);
    const { result } = renderHook(() => useFeedbackContext(TOKEN), { wrapper: wrap() });

    await waitFor(() => expect(result.current.fault).toBe("link-dead"));
    expect(result.current.context).toBeNull();
    expect(result.current.reason).toBe("This review has been cancelled.");
  });

  it("has no reason to offer when the refusal was an HTTP status", async () => {
    // 410 is a spent or expired token. There is no body worth reading, and
    // the generic screen is deliberately the same for every failure.
    routeFetch([{ match: CONTEXT, status: 410, body: {} }]);
    const { result } = renderHook(() => useFeedbackContext(TOKEN), { wrapper: wrap() });

    await waitFor(() => expect(result.current.fault).toBe("link-dead"));
    expect(result.current.reason).toBeNull();
  });
});

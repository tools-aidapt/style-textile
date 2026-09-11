import { useMemo } from "react";
import { basicAuthFor, config } from "@/lib/config";
import { mockContextFor } from "@/kpi/mock";
import {
  parseContext,
  refusalReason,
  type KpiContext,
  type KpiFault,
  type KpiFormType,
} from "@/kpi/session";
import { ApiError, useApi } from "./useApi";

/**
 * Who this form is for.
 *
 * The token from the link goes to n8n as `?t=`, n8n verifies the signature
 * and the expiry against a secret this bundle does not hold, and answers
 * with that one employee's details — or refuses. A token that does not
 * verify gets a dead end and nothing else: no form, no KPI list, no name.
 *
 * **`?t=` is the parameter name.** It is the one thing that has to match on
 * the n8n Webhook node, so it is stated here rather than buried in a
 * template.
 *
 * The context is not refetched on focus or on an interval. A manager fills a
 * review in with the tab in the background while they look something up, and
 * a background refetch that failed would replace a part-written review with
 * an error screen.
 */

/**
 * Whether `?mock=` is honoured at all.
 *
 * Development always, and a preview deployment that sets
 * `VITE_ALLOW_PREFILL=true` — the same switch the requisition form's sample
 * content uses, for the same reason. On the deployment HR uses it is off,
 * and `?mock=` is ignored entirely: sample content is invented, and a KPI
 * set raised from it would arrive in ClickUp looking like a real one.
 */
export const mockAllowed = (): boolean => import.meta.env.DEV || config.allowPrefill;

/** `?mock=<variant>`, when the build allows one. */
export const readMockVariant = (): string => {
  if (!mockAllowed()) return "";
  try {
    return (new URLSearchParams(window.location.search).get("mock") ?? "").trim();
  } catch {
    return "";
  }
};

export const useKpiContext = (token: string, route: KpiFormType) => {
  const mock = readMockVariant();
  const mockBody = mock ? mockContextFor(mock) : null;

  const url = token ? `${config.kpiContextUrl}?t=${encodeURIComponent(token)}` : "";

  const query = useApi<unknown>({
    url,
    // The token identifies the employee, so it is the identity of this data.
    // React Query keys stay in memory only; nothing here reaches a log.
    queryKey: ["kpi-context", token, route],
    basicAuth: basicAuthFor(config.kpiWebhookUser, config.kpiWebhookPassword),
    // A mock is served from memory, so the request is never made
    enabled: !mockBody && !!token && !!config.kpiContextUrl,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const body = mockBody ?? query.data;

  const context: KpiContext | null = useMemo(
    () => (body ? parseContext(body, !!mockBody) : null),
    [body, mockBody],
  );

  const fault: KpiFault | null = useMemo(() => {
    // A mock stands in for the whole endpoint, token included: a variant
    // that parses opens the form, and one that does not is the dead end it
    // was written to demonstrate.
    if (mockBody) return context ? null : "link-dead";
    if (mock) return "link-dead";

    if (!token) return "no-token";
    if (!config.kpiContextUrl) return "unconfigured";

    if (query.isError) {
      const status = query.error instanceof ApiError ? query.error.status : undefined;
      // 400 malformed, 401/403 bad signature, 404 no such record, 410 spent
      // or expired. All the same thing to the person reading it: this link
      // does not work. Distinguishing them on screen would also tell
      // somebody holding a guessed token which part of their guess was wrong.
      if (status === 400 || status === 401 || status === 403 || status === 404 || status === 410) {
        return "link-dead";
      }
      return "unreachable";
    }

    // A 200 whose body has no usable form type — or a review with no mode —
    // is a server fault, not an empty form. `parseContext` also lands here
    // on an `ok: false` payload.
    if (query.data && !context) return "link-dead";
    return null;
  }, [mock, mockBody, context, token, query.isError, query.error, query.data]);

  /**
   * The endpoint's own words for a refusal it chose to explain, which the
   * dead end prefers over the generic wording. Only ever present on a `200`
   * carrying `ok: false`; an HTTP error status carries no body worth reading.
   */
  const reason = useMemo(() => refusalReason(body), [body]);

  return {
    context,
    fault,
    reason,
    isLoading: !mockBody && !!token && !!config.kpiContextUrl && query.isLoading,
    refetch: query.refetch,
  };
};

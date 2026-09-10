import { useMemo } from "react";
import { basicAuthFor, config } from "@/lib/config";
import {
  parseContext,
  refusalReason,
  type ContextFault,
  type FeedbackContext,
} from "@/feedback/session";
import { ApiError, useApi } from "./useApi";

/**
 * Who is filling this in.
 *
 * The token from the link goes to n8n as `?t=`, n8n verifies the signature
 * and the expiry against a secret this bundle does not hold, and answers with
 * that one person's prefilled details — or refuses. A token that does not
 * verify gets a dead end and nothing else: no form, no question list, no name.
 *
 * **`?t=` is the parameter name.** It is the one thing that has to match on
 * the n8n Webhook node, so it is stated here rather than buried in a template.
 *
 * The context is not refetched on focus or on an interval. Somebody fills a
 * survey in with the tab in the background while they think about question
 * nine, and a background refetch that failed would replace a part-answered
 * form with an error screen.
 */
export const useFeedbackContext = (token: string) => {
  const url = token
    ? `${config.feedbackContextUrl}?t=${encodeURIComponent(token)}`
    : "";

  const query = useApi<unknown>({
    url,
    // The token identifies the person, so it is the identity of this data.
    // React Query keys stay in memory only; nothing here reaches a log.
    queryKey: ["feedback-context", token],
    basicAuth: basicAuthFor(config.feedbackWebhookUser, config.feedbackWebhookPassword),
    enabled: !!token && !!config.feedbackContextUrl,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const context: FeedbackContext | null = useMemo(
    () => (query.data ? parseContext(query.data) : null),
    [query.data],
  );

  const fault: ContextFault | null = useMemo(() => {
    if (!token) return "no-token";
    if (!config.feedbackContextUrl) return "unconfigured";

    if (query.isError) {
      const status = query.error instanceof ApiError ? query.error.status : undefined;
      // 400 malformed, 401/403 bad signature, 404 no such response, 410 spent
      // or expired. All the same thing to the person reading it: this link
      // does not work. Distinguishing them on screen would also tell somebody
      // holding a guessed token which part of their guess was wrong.
      if (status === 400 || status === 401 || status === 403 || status === 404 || status === 410) {
        return "link-dead";
      }
      return "unreachable";
    }

    // A 200 whose body has no usable form type is a server fault, not an
    // empty form. `parseContext` also lands here on an `ok: false` payload.
    if (query.data && !context) return "link-dead";
    return null;
  }, [token, query.isError, query.error, query.data, context]);

  /**
   * The endpoint's own words for a refusal it chose to explain, which the
   * dead end prefers over the generic wording. Only ever present on a `200`
   * carrying `ok: false`; an HTTP error status carries no body worth reading.
   */
  const reason = useMemo(() => refusalReason(query.data), [query.data]);

  return {
    context,
    fault,
    reason,
    isLoading: !!token && !!config.feedbackContextUrl && query.isLoading,
    refetch: query.refetch,
  };
};

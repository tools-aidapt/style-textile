import { useMemo } from "react";
import { basicAuthFor, config } from "@/lib/config";
import { parseSession, type OnboardingSession, type SessionFault } from "@/onboarding/session";
import { ApiError, useApi } from "./useApi";

/**
 * Who is filling this in.
 *
 * The employee's ClickUp task id goes to n8n as `?id=`, and n8n answers with
 * that one employee's details — or refuses. An id no record answers to gets a
 * dead end and nothing else: no form, no field list, no name.
 *
 * **`?id=` is the parameter name.** It is the one thing that has to match on
 * the n8n Webhook node, so it is stated here rather than buried in a template.
 *
 * The session is not refetched on focus or on an interval. A new hire leaves
 * this page open while they photograph an ID card, and a background refetch
 * that failed would replace a part-filled form with an error screen.
 */
export const useOnboardingSession = (employeeId: string) => {
  const url = employeeId
    ? `${config.onboardingSessionUrl}?id=${encodeURIComponent(employeeId)}`
    : "";

  const query = useApi<unknown>({
    url,
    queryKey: ["onboarding-session", employeeId],
    basicAuth: basicAuthFor(config.onboardingWebhookUser, config.onboardingWebhookPassword),
    enabled: !!employeeId && !!config.onboardingSessionUrl,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const session: OnboardingSession | null = useMemo(
    () => (query.data ? parseSession(query.data) : null),
    [query.data],
  );

  const fault: SessionFault | null = useMemo(() => {
    if (!employeeId) return "no-id";
    if (!config.onboardingSessionUrl) return "unconfigured";
    if (query.isError) {
      const status = query.error instanceof ApiError ? query.error.status : undefined;
      // 404 no such employee, 403 not one that is onboarding, 410 already
      // processed and swept. All the same thing to the person reading it:
      // this link does not work, ask HR.
      if (status === 404 || status === 403 || status === 410 || status === 401) return "unknown";
      return "unreachable";
    }
    // A 200 whose body has no task id is a server fault, not an empty form
    if (query.data && !session) return "unreachable";
    return null;
  }, [employeeId, query.isError, query.error, query.data, session]);

  return {
    session,
    fault,
    isLoading: !!employeeId && !!config.onboardingSessionUrl && query.isLoading,
    refetch: query.refetch,
  };
};

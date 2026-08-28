import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

/** Requests that outlive this are a failure the user should be told about. */
const DEFAULT_TIMEOUT_MS = 15_000;

export interface UseApiOptions<T> extends Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn"> {
  url: string;
  /** Scoped by `url` internally, so two callers cannot collide on a shared key. */
  queryKey: readonly unknown[];
  headers?: Record<string, string>;
  basicAuth?: {
    username: string;
    password: string;
  };
  timeoutMs?: number;
}

/**
 * An HTTP failure carrying the status, so callers can tell "misconfigured"
 * (4xx — retrying will not help) from "the service is down" (5xx, network).
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** `statusText` is empty over HTTP/2, so never build a message from it alone. */
const describe = (response: Response): string =>
  response.statusText
    ? `Request failed: ${response.status} ${response.statusText}`
    : `Request failed with status ${response.status}`;

/**
 * A 4xx is a configuration fault — a wrong URL, a rejected credential — and
 * retrying it only delays the error the operator needs to see. Everything else
 * gets two more attempts.
 */
export const shouldRetry = (failureCount: number, error: Error): boolean => {
  const status = error instanceof ApiError ? error.status : undefined;
  if (status !== undefined && status >= 400 && status < 500) return false;
  return failureCount < 2;
};

export const useApi = <T,>({
  url,
  queryKey,
  headers = {},
  basicAuth,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  ...options
}: UseApiOptions<T>) => {
  return useQuery<T, Error>({
    // The URL is part of the identity of the data, not just of the request
    queryKey: [...queryKey, url],
    queryFn: async ({ signal }) => {
      const fetchHeaders: Record<string, string> = {
        Accept: "application/json",
        ...headers,
      };

      if (basicAuth) {
        fetchHeaders.Authorization = `Basic ${btoa(`${basicAuth.username}:${basicAuth.password}`)}`;
      }

      // React Query aborts on unmount; this adds a ceiling on top of that
      const timeout = new AbortController();
      const timer = setTimeout(() => timeout.abort(), timeoutMs);
      signal.addEventListener("abort", () => timeout.abort(), { once: true });

      try {
        const response = await fetch(url, { headers: fetchHeaders, signal: timeout.signal });
        if (!response.ok) throw new ApiError(describe(response), response.status);
        return (await response.json()) as T;
      } catch (error) {
        if (timeout.signal.aborted && !signal.aborted) {
          throw new ApiError(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
        }
        throw error;
      } finally {
        clearTimeout(timer);
      }
    },
    retry: shouldRetry,
    ...options,
  });
};

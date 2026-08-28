import { vi } from "vitest";

/**
 * A `fetch` stub that answers by URL.
 *
 * The requisition form now talks to four endpoints — the form schema, the two
 * people directories and the submit webhook — so a single blanket mock would
 * hand the manager picker a copy of the schema and quietly leave it empty.
 */

export interface Route {
  /** Matched against the request URL with `includes`. */
  match: string;
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  /** Rejects instead of answering, for the network-failure paths. */
  fail?: Error;
  /** Full control, for a route that has to answer differently each attempt. */
  handler?: (init?: RequestInit) => Response;
}

export const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => body,
  }) as Response;

/**
 * Routes in order, first match wins. An unmatched URL rejects loudly rather
 * than returning an empty body, because a silent `{}` is the hardest kind of
 * test failure to read.
 */
export const routeFetch = (routes: Route[]) => {
  const mock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const route = routes.find((candidate) => url.includes(candidate.match));

    if (!route) throw new Error(`No test route for ${url}`);
    if (route.handler) return route.handler(init);
    if (route.fail) throw route.fail;
    return jsonResponse(route.status ?? 200, route.body ?? {}, route.headers);
  });

  vi.stubGlobal("fetch", mock);
  return mock;
};

/**
 * The two directory endpoints, each answered in its own real shape. They differ
 * — the register carries task ids and designations, the user list does not — so
 * serving one payload to both would hide exactly the bugs worth catching.
 */
export const directoryRoutes = (employees: unknown, users: unknown): Route[] => [
  { match: "employees-with-avatars", body: employees },
  { match: "kenafric/users", body: users },
];

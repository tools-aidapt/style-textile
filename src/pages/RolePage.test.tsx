import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RolePage from "./RolePage";
import CareersBoardPage from "./CareersBoardPage";

const task = (id: string, name: string) => ({
  id,
  name,
  description: "Runs the operations pod.",
  custom_fields: [{ name: "Department", type: "short_text", value: "Operations" }],
});

const respondWith = (body: unknown, status = 200) =>
  vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    statusText: "",
    json: async () => body,
  });

/** Mounts the real routes at a real URL, which is the thing under test. */
const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [
      { path: "/", element: <CareersBoardPage /> },
      { path: "/roles/:positionId", element: <RolePage /> },
    ],
    { initialEntries: [path] },
  );

  // Retries would turn a deliberate failure into a slow test
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

describe("deep-linking to a role", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      respondWith({ tasks: [task("abc123", "AI Operations Lead"), task("def456", "Data Engineer")] }),
    );
  });

  it("renders the role named in the URL, with no click from the board", async () => {
    renderAt("/roles/def456");

    expect(await screen.findByRole("heading", { name: "Data Engineer", level: 1 })).toBeInTheDocument();
  });

  it("puts the role in the document title, so a bookmark is recognisable", async () => {
    renderAt("/roles/abc123");

    await screen.findByRole("heading", { name: "AI Operations Lead", level: 1 });
    expect(document.title).toBe("AI Operations Lead — Careers at Aidapt");
  });

  it("publishes JobPosting structured data for the role", async () => {
    renderAt("/roles/abc123");
    await screen.findByRole("heading", { name: "AI Operations Lead", level: 1 });

    const script = document.head.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.textContent ?? "{}");
    expect(data["@type"]).toBe("JobPosting");
    expect(data.title).toBe("AI Operations Lead");
    expect(data.url).toBe("https://careers.test/roles/abc123");
  });

  it("says the role has closed when the link outlives the requisition", async () => {
    renderAt("/roles/gone999");

    expect(await screen.findByText(/no longer open/i)).toBeInTheDocument();
  });

  it("distinguishes a failed fetch from a closed role, and offers a retry", async () => {
    // A 401 rather than a 500: shouldRetry declines to retry a 4xx, so the
    // error state is reached at once instead of after the backoff
    vi.stubGlobal("fetch", respondWith(null, 401));
    renderAt("/roles/abc123");

    expect(await screen.findByText(/couldn't load this role/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});

describe("the board", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", respondWith({ tasks: [task("abc123", "AI Operations Lead")] }));
  });

  it("links each role to its own URL, so the link can be copied and shared", async () => {
    renderAt("/");

    const link = await screen.findByRole("link", { name: /AI Operations Lead/i });
    expect(link).toHaveAttribute("href", "/roles/abc123");
  });
});

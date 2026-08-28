import { readFileSync } from "node:fs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { testEmployeesPayload, testUsersPayload } from "@/test/requisitionSchema";
import { directoryRoutes, routeFetch } from "@/test/fetchRouter";
import NewRequisitionPage from "./NewRequisitionPage";

/**
 * The page's own job: fetch the schema, and refuse to open the form if the
 * workspace cannot supply every field it writes to.
 */

const fixture = JSON.parse(readFileSync("public/requisition-schema.sample.json", "utf8"));

/** The schema endpoint answers with `body`; the directories always answer. */
const serve = (body: unknown) =>
  routeFetch([
    ...directoryRoutes(testEmployeesPayload(), testUsersPayload()),
    { match: "requisition-schema", body },
  ]);

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // The shared page chrome links home from the wordmark, so the page needs
  // router context the way it has it in the app.
  return render(
    <MemoryRouter initialEntries={["/requisitions/new"]}>
      <QueryClientProvider client={client}>
        <NewRequisitionPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

describe("NewRequisitionPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("opens the form once the workspace serves a complete schema", async () => {
    serve(fixture);
    renderPage();

    expect(
      await screen.findByRole("heading", { level: 2, name: /Position identity/i }),
    ).toBeInTheDocument();
    // The people pickers are fetched on mount but stay closed: a few hundred
    // names on screen before anyone asks for them is what buried section B
    expect(screen.queryByRole("option", { name: /Asha Wanjiru/i })).not.toBeInTheDocument();

    // Opening one proves the directory arrived and reached the picker — it
    // came from the served payload, not from the component
    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox", { name: /Requesting manager/i }));
    expect(await screen.findByRole("option", { name: /Asha Wanjiru/i })).toBeInTheDocument();

    // As did the company list
    expect(screen.getByRole("combobox", { name: /Company/i })).toBeInTheDocument();
  });

  it("refuses to open, and names the fields, when the workspace is short one", async () => {
    // Nine fields are still being built in ClickUp. A smaller form would drop
    // whatever a manager typed into the missing one without telling anybody.
    serve({ ...fixture, missingKeys: ["section", "jobOverview"] });
    renderPage();

    expect(await screen.findByText(/can't open yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Job overview/)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: /Position identity/i }),
    ).not.toBeInTheDocument();
  });

  it("says so plainly when the schema service cannot be reached", async () => {
    routeFetch([
      ...directoryRoutes(testEmployeesPayload(), testUsersPayload()),
      { match: "requisition-schema", fail: new TypeError("network down") },
    ]);
    renderPage();

    expect(
      await screen.findByText(/can't reach the workspace/i, undefined, { timeout: 10_000 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Your draft is safe/i)).toBeInTheDocument();
  }, 15_000);

  it("keeps an internal page out of the search index", async () => {
    serve(fixture);
    renderPage();
    await screen.findByRole("heading", { level: 2, name: /Position identity/i });

    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
  });
});

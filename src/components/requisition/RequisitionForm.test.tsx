import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { testEmployeesPayload, testSchema, testUsersPayload } from "@/test/requisitionSchema";
import { directoryRoutes, jsonResponse, routeFetch } from "@/test/fetchRouter";
import { RequisitionForm } from "./RequisitionForm";

/** The two directories are fetched through React Query, so the form needs one. */
const renderForm = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RequisitionForm schema={testSchema()} />
    </QueryClientProvider>,
  );
};

/** Directories always answer; the submit route is what each test varies. */
const routes = (submit: Parameters<typeof routeFetch>[0][number]) =>
  routeFetch([...directoryRoutes(testEmployeesPayload(), testUsersPayload()), submit]);

const SUBMIT = "requisition-submit";

type User = ReturnType<typeof userEvent.setup>;

const choose = async (user: User, field: RegExp, option: string) => {
  await user.click(screen.getByRole("combobox", { name: field }));
  await user.click(await screen.findByRole("option", { name: new RegExp(option, "i") }));
};

/**
 * Pastes rather than types. Four long-text fields typed a character at a time
 * is most of this file's runtime, and nothing here is testing keystrokes.
 */
const type = async (user: User, field: RegExp, value: string) => {
  const input = screen.getByLabelText(field);
  await user.clear(input);
  await user.click(input);
  await user.paste(value);
};

/** Fills a requisition that passes every blocking rule. */
const fillEverything = async (user: User) => {
  await type(user, /Job title/i, "Depot Supervisor");
  await choose(user, /Company/i, "Kenafric Manufacturing Limited");
  await choose(user, /Department/i, "Sales & Distribution");
  await choose(user, /Cost centre/i, "Sales & Distribution");
  await choose(user, /Work location/i, "Nairobi, Kenya");
  await choose(user, /Position type/i, "Permanent");
  await user.click(screen.getByRole("radio", { name: /^New/i }));
  await type(user, /How many people/i, "2");
  await user.click(screen.getByRole("checkbox", { name: /External Recruitment/i }));

  // B1 and B2 are comboboxes over the served directories: the list opens on
  // click, so only one is ever on screen and no scoping is needed.
  await choose(user, /Requesting manager/i, "Asha Wanjiru");
  await choose(user, /Line manager/i, "Brian Otieno");

  await type(user, /Job overview/i, "A".repeat(160));

  const responsibilities = screen.getAllByLabelText(/^Key responsibility, row/i);
  const outcomes = screen.getAllByLabelText(/^Outcome, row/i);
  await user.type(responsibilities[0], "Manage the depot stock ledger");
  await user.type(outcomes[0], "Zero unexplained variance at month end");
  await user.type(responsibilities[1], "Lead the dispatch team");
  await user.type(outcomes[1], "Same-day dispatch on 95% of orders");
  await user.type(responsibilities[2], "Run the weekly stock count");
  await user.type(outcomes[2], "Signed off every Friday");

  // C3 and C4's skills half are lists; C4's experience half is prose
  await type(user, /^Qualification 1$/i, "Degree in supply chain");
  await type(user, /Relevant experience/i, "Five years in depot operations");
  await type(user, /^Skill 1$/i, "Stock reconciliation");

  await type(user, /What has worked or failed/i, "The last holder left after six months");
  await type(user, /Why would a strong candidate/i, "Ownership of a whole region");
  await type(user, /What must this person achieve in six months/i, "B".repeat(210));
  await type(user, /Where could this role lead/i, "Regional manager");

  await user.click(screen.getByRole("checkbox", { name: /Laptop/i }));
  await user.click(screen.getByRole("checkbox", { name: /Telephone/i }));
};

const submit = (user: User) =>
  user.click(screen.getByRole("button", { name: /submit requisition/i }));

/** The §8 success body. */
const successBody = (extra: Record<string, unknown> = {}) => ({
  ok: true,
  submissionId: "3f7c1b62-4d0a-4a1e-9b55-2c8e0a1d9f34",
  taskId: "86abc123",
  taskUrl: "https://app.clickup.test/t/86abc123",
  reference: "REQ-2026-0184",
  duplicate: false,
  ...extra,
});

/** Only the submit attempts — the directory fetches are noise here. */
const submitCalls = (mock: ReturnType<typeof routeFetch>) =>
  mock.mock.calls.filter(([url]) => String(url).includes(SUBMIT));

const bodyOf = (call: unknown[]) => JSON.parse((call[1] as RequestInit).body as string);

/** Filling twenty-odd fields through the real controls outruns the 5s default. */
const TIMEOUT = 30_000;

describe("RequisitionForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("submits a complete requisition and confirms what happens next", async () => {
    const user = userEvent.setup();
    const fetchMock = routes({ match: SUBMIT, status: 201, body: successBody() });

    renderForm();
    await fillEverything(user);
    await submit(user);

    await waitFor(() => expect(submitCalls(fetchMock)).toHaveLength(1));

    const [url, init] = submitCalls(fetchMock)[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://webhook.test/requisition-submit");
    expect((init.headers as Record<string, string>)["X-Aidapt-Client"]).toBe("kenafric-requisition-web/1.0.0");
    const payload = JSON.parse(init.body as string);

    expect(payload.position.jobTitle).toBe("Depot Supervisor");
    expect(payload.position.company).toBe("Kenafric Manufacturing Limited");
    expect(payload.position.totalSubPositions).toBe(2);
    expect(payload.position.agencyName).toBeNull();
    expect(payload.reporting.requestingManager).toEqual({
      clickupUserId: 1001,
      email: "asha@kenafric.test",
      displayName: "Asha Wanjiru",
    });
    expect(payload.schemaVersion).toBe("1.1");
    expect(payload.client.app).toBe("kenafric-requisition-web");
    // A UUID v4, because the wire schema pins the format
    expect(payload.submissionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(payload.jobDescription.keyResponsibilitiesRows).toHaveLength(3);
    expect(payload.jobDescription.keyResponsibilitiesMarkdown).toContain(
      "| Manage the depot stock ledger | Zero unexplained variance at month end |",
    );
    expect(payload.provisioning.positionRequirements).toEqual(["Laptop/Computer/Connectivity"]);
    expect(payload.hiringProcess.assessmentStagesRequired).toEqual(["Telephone"]);
    expect(payload.submissionId).toBeTruthy();

    // The manager's next question is always "what happens now"
    expect(await screen.findByText(/Requisition submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/HR reviews it/i)).toBeInTheDocument();
    expect(screen.getByText(/The HR Head approves/i)).toBeInTheDocument();
    expect(screen.getByText(/The Director approves/i)).toBeInTheDocument();
    expect(screen.getByText("REQ-2026-0184")).toBeInTheDocument();
  }, TIMEOUT);

  it("reuses the same submissionId on a retry, so a requisition cannot be raised twice", async () => {
    const user = userEvent.setup();
    // The first submit fails at the network, the second succeeds
    let attempts = 0;
    const fetchMock = routeFetch([
      ...directoryRoutes(testEmployeesPayload(), testUsersPayload()),
      {
        match: SUBMIT,
        handler: () => {
          attempts += 1;
          if (attempts === 1) throw new TypeError("network down");
          return jsonResponse(201, successBody());
        },
      },
    ]);

    renderForm();
    await fillEverything(user);
    await submit(user);

    expect(await screen.findByText(/Your answers are saved/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /try again/i }));

    await waitFor(() => expect(submitCalls(fetchMock)).toHaveLength(2));
    const [first, second] = submitCalls(fetchMock).map((call) => bodyOf(call).submissionId);
    expect(second).toBe(first);
  }, TIMEOUT);

  it("names the fields that need attention rather than failing silently", async () => {
    const user = userEvent.setup();
    const fetchMock = routes({ match: SUBMIT, status: 201, body: successBody() });

    renderForm();
    await submit(user);

    expect(await screen.findByText(/fields need attention/i)).toBeInTheDocument();
    expect(submitCalls(fetchMock)).toHaveLength(0);
    // The summary offers a way to each one
    const summary = screen.getByRole("status");
    expect(within(summary).getByRole("button", { name: /^Job title$/ })).toBeInTheDocument();
  }, TIMEOUT);

  it("holds a submission back until an advisory is acknowledged", async () => {
    const user = userEvent.setup();
    const fetchMock = routes({ match: SUBMIT, status: 201, body: successBody() });

    renderForm();
    await fillEverything(user);
    // A-1 · the cost centre now differs from the department
    await choose(user, /Cost centre/i, "ICT");
    await submit(user);

    expect(await screen.findByText(/Cost centre differs from department/i)).toBeInTheDocument();
    expect(submitCalls(fetchMock)).toHaveLength(0);

    await user.click(screen.getByLabelText(/I've checked this and it's right/i));
    await submit(user);

    await waitFor(() => expect(submitCalls(fetchMock)).toHaveLength(1));
    expect(bodyOf(submitCalls(fetchMock)[0]).advisoriesAcknowledged).toContain("A-1");
  }, TIMEOUT);

  it("puts a 422's issues on the fields they name, in the server's own words", async () => {
    const user = userEvent.setup();
    routes({
      match: SUBMIT,
      status: 422,
      body: {
        ok: false,
        error: "validation_failed",
        issues: [
          {
            path: "position.location",
            code: "unknown_option",
            message: "Not a valid work location.",
          },
        ],
      },
    });

    renderForm();
    await fillEverything(user);
    await submit(user);

    // Shown verbatim — the app never rewords something written for the manager
    expect(await screen.findByText("Not a valid work location.")).toBeInTheDocument();
    // And it clears the moment that answer changes
    await choose(user, /Work location/i, "Thika, Kenya");
    await waitFor(() =>
      expect(screen.queryByText("Not a valid work location.")).not.toBeInTheDocument(),
    );
  }, TIMEOUT);

  it("does not offer a retry when retrying cannot help", async () => {
    const user = userEvent.setup();
    // 502 · a ClickUp field is missing. n8n has already alerted HR.
    const fetchMock = routes({
      match: SUBMIT,
      status: 502,
      body: { ok: false, error: "field_schema_unresolved" },
    });

    renderForm();
    await fillEverything(user);
    await submit(user);

    expect(await screen.findByText(/isn't ready yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
    expect(submitCalls(fetchMock)).toHaveLength(1);
  }, TIMEOUT);

  it("treats an idempotent replay as the success it is", async () => {
    const user = userEvent.setup();
    routes({ match: SUBMIT, status: 201, body: successBody({ duplicate: true }) });

    renderForm();
    await fillEverything(user);
    await submit(user);

    expect(await screen.findByText(/Requisition submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/nothing was raised twice/i)).toBeInTheDocument();
  }, TIMEOUT);

  it("reports a server advisory on the confirmation rather than blocking the submit", async () => {
    const user = userEvent.setup();
    // A-6 arrives alongside the 201: the requisition is filed, and said so
    routes({
      match: SUBMIT,
      status: 201,
      body: successBody({
        advisories: [
          {
            code: "A-6",
            message: "A similar requisition is already open.",
            taskUrl: "https://app.clickup.test/t/86aaa1111",
          },
        ],
      }),
    });

    renderForm();
    await fillEverything(user);
    await submit(user);

    expect(await screen.findByText(/Requisition submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/A similar requisition is already open/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see the requisition/i })).toHaveAttribute(
      "href",
      "https://app.clickup.test/t/86aaa1111",
    );
  }, TIMEOUT);

  it("links a replacement to an employee record, not to a typed name", async () => {
    const user = userEvent.setup();
    const fetchMock = routes({ match: SUBMIT, status: 201, body: successBody() });
    renderForm();
    await fillEverything(user);

    await user.click(screen.getByRole("radio", { name: /^Replacement/i }));
    await choose(user, /Who is being replaced/i, "Brian Otieno");

    await submit(user);
    await waitFor(() => expect(submitCalls(fetchMock)).toHaveLength(1));

    // The wire wants a link to a record; the register supplies the task id
    expect(bodyOf(submitCalls(fetchMock)[0]).position.replacingEmployee).toEqual({
      clickupTaskId: "869e00001",
      displayName: "Brian Otieno",
    });
  }, TIMEOUT);

  it("reveals the agency name only once an agency is involved, and clears it again", async () => {
    const user = userEvent.setup();
    routes({ match: SUBMIT, status: 201, body: successBody() });
    renderForm();

    const reveal = () => screen.getByLabelText(/Agency name/i).closest("[data-reveal]");
    expect(reveal()).toHaveAttribute("data-reveal", "closed");
    // Collapsed means out of the tab order, not merely invisible
    expect(reveal()).toHaveAttribute("inert");

    await user.click(screen.getByRole("checkbox", { name: /Recruitment Agency/i }));
    expect(reveal()).toHaveAttribute("data-reveal", "open");
    const agency = screen.getByLabelText(/Agency name/i);
    await user.type(agency, "Talent Ltd");
    expect(agency).toHaveValue("Talent Ltd");

    // Clearing the condition clears the value — orphaned data never reaches HR
    await user.click(screen.getByRole("checkbox", { name: /Recruitment Agency/i }));
    await waitFor(() => expect(screen.getByLabelText(/Agency name/i)).toHaveValue(""));
  });
});

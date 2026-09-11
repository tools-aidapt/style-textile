import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { routeFetch } from "@/test/fetchRouter";
import { parseContext, type KpiContext } from "@/kpi/session";
import { DefineForm } from "./DefineForm";

/**
 * Build E, as a line manager meets it.
 *
 * The model layer is tested in `src/kpi/*.test.ts`; this covers the things
 * only the rendered form can be wrong about — that it never asks for
 * something Kenafric already holds, that the measurement type really does
 * decide whether the target fields exist, that a set which does not total
 * 100 cannot be sent, and that what reaches the wire is what was typed.
 */

const TOKEN = "eyJmdCI6IktQSUQiLCJlaWQiOiI4NjlleGFtcGxlIn0.dGVzdC1zaWduYXR1cmUtbm90LXJlYWw";
const SUBMIT = "kenafric-wf18b";

const context = (overrides: Record<string, unknown> = {}): KpiContext =>
  parseContext({
    ok: true,
    formType: "KPID",
    alreadySubmitted: false,
    prefill: {
      employeeName: "Faith Mutiso",
      positionTitle: "Shift Quality Analyst",
      department: "Production",
      company: "Kenafric Manufacturing Limited",
      lineManager: "Daniel Omondi",
      joiningDate: "2026-09-10",
      probationEndDate: "2027-03-10",
      reviewCycle: "Probation",
      mode: null,
      kpis: [],
      ...overrides,
    },
  })!;

const renderForm = () => render(<DefineForm token={TOKEN} context={context()} />);

type User = ReturnType<typeof userEvent.setup>;

/** The KPI rows are the only list on this form, so position is enough. */
const rowPanel = (index: number) => screen.getAllByRole("listitem")[index];

/**
 * A whole label, asterisk and all.
 *
 * A required field's label reads "Target *" in the DOM — the marker is a
 * sibling span, aria-hidden for the screen reader but still part of the
 * label's text. `/^target$/` therefore matches nothing, and `/^target/`
 * matches "Target figure" as well.
 */
const exactly = (text: string) => new RegExp(`^${text}\\s*\\*?$`, "i");

/** Fill one row completely. `weight` is the only thing callers vary. */
const fillRow = async (user: User, index: number, weight: string, qualitative = false) => {
  const row = within(rowPanel(index));

  await user.type(row.getByLabelText(/key result area/i), "Operational Efficiency");
  await user.type(row.getByLabelText(/key performance indicator/i), `Reduce waste ${index}`);
  await user.click(row.getByRole("radio", { name: qualitative ? "Qualitative" : "Quantitative" }));
  await user.type(row.getByLabelText(/where does the measurement come from/i), "SAP report");

  if (!qualitative) {
    await user.type(row.getByLabelText(/target figure/i), "45");
    await user.type(row.getByLabelText(/unit of measure/i), "minutes");
  }

  await user.type(row.getByLabelText(exactly("target")), "Under 45 minutes");
  await user.type(row.getByLabelText(exactly("weight")), weight);
};

const bodyOf = (mock: ReturnType<typeof routeFetch>) => {
  const call = mock.mock.calls.find(([url]) => String(url).includes(SUBMIT));
  return JSON.parse(String((call?.[1] as RequestInit).body));
};

describe("the header", () => {
  /**
   * The whole reason this layer is being rebuilt. A KPI sheet with a typed
   * employee name is attached to nothing and cannot be scored, reported on,
   * or found when the confirmation decision is due.
   */
  it("shows what Kenafric already holds, and asks for none of it", () => {
    renderForm();

    expect(screen.getByText("Faith Mutiso")).toBeInTheDocument();
    expect(screen.getByText("Shift Quality Analyst")).toBeInTheDocument();
    expect(screen.getByText("Daniel Omondi")).toBeInTheDocument();

    expect(screen.queryByLabelText(/employee name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/line manager/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/joining date/i)).not.toBeInTheDocument();
  });

  it("renders the probation end date as the deadline it is", () => {
    renderForm();
    expect(screen.getByText(/reviewed on or before/i)).toHaveTextContent("10 March 2027");
  });
});

describe("the rows", () => {
  it("opens at three and will not go below it", () => {
    renderForm();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    // Removal is absent rather than disabled: a rule that cannot be broken
    // does not need explaining
    expect(screen.queryByRole("button", { name: /remove kpi/i })).not.toBeInTheDocument();
  });

  it("adds up to five, then stops", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /add a kpi/i }));
    await user.click(screen.getByRole("button", { name: /add a kpi/i }));
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("button", { name: /add a kpi/i })).toBeDisabled();
  });

  /**
   * Measurement type sits ahead of the targets because it decides whether
   * they exist. This is the check that stops `Improve communication, target
   * 100, unit %`.
   */
  it("hides the target figure and unit on a qualitative KPI", async () => {
    const user = userEvent.setup();
    renderForm();
    const row = within(rowPanel(0));

    await user.click(row.getByRole("radio", { name: "Quantitative" }));
    expect(row.getByLabelText(/target figure/i)).toBeInTheDocument();

    await user.click(row.getByRole("radio", { name: "Qualitative" }));
    expect(row.queryByLabelText(/target figure/i)).not.toBeInTheDocument();
    expect(row.queryByLabelText(/unit of measure/i)).not.toBeInTheDocument();
  });
});

describe("the weight total", () => {
  it("shows the running figure and what is left, and keeps submit shut", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillRow(user, 0, "45");
    await fillRow(user, 1, "25");
    await fillRow(user, 2, "25");

    expect(screen.getByText(/5% still to allocate/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send these kpis/i })).toBeDisabled();
  });

  it("opens submit at exactly 100", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillRow(user, 0, "50");
    await fillRow(user, 1, "25");
    await fillRow(user, 2, "25");

    expect(screen.getByText(/weights add up/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send these kpis/i })).toBeEnabled();
  });
});

describe("the submit", () => {
  it("sends the shape WF-18b was specified to take", async () => {
    const user = userEvent.setup();
    const fetchMock = routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    renderForm();

    await fillRow(user, 0, "50");
    await fillRow(user, 1, "25");
    await fillRow(user, 2, "25", true);
    await user.click(screen.getByRole("button", { name: /send these kpis/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = bodyOf(fetchMock);

    expect(body.t).toBe(TOKEN);
    expect(body.formType).toBe("KPID");
    expect(body.kpis).toHaveLength(3);
    expect(body.kpis[0].weight).toBe(50);
    expect(body.kpis[0].targetFigure).toBe(45);
    // The qualitative row carries neither, and not as empty strings
    expect(body.kpis[2]).not.toHaveProperty("targetFigure");
    expect(body.kpis[2]).not.toHaveProperty("unitOfMeasure");
  });

  it("shows the thank-you once it lands, and nothing to send twice", async () => {
    const user = userEvent.setup();
    routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    renderForm();

    await fillRow(user, 0, "50");
    await fillRow(user, 1, "25");
    await fillRow(user, 2, "25");
    await user.click(screen.getByRole("button", { name: /send these kpis/i }));

    await waitFor(() => expect(screen.getByText(/kpis sent/i)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /send these kpis/i })).not.toBeInTheDocument();
  });

  /**
   * A sample page is for looking at, and a POST from one would create real
   * ClickUp tasks against a real employee record out of invented content.
   */
  it("sends nothing at all from a sample context", async () => {
    const user = userEvent.setup();
    const fetchMock = routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    render(
      <DefineForm token={TOKEN} context={{ ...context(), sample: true }} />,
    );

    await fillRow(user, 0, "50");
    await fillRow(user, 1, "25");
    await fillRow(user, 2, "25");
    await user.click(screen.getByRole("button", { name: /send these kpis/i }));

    await waitFor(() => expect(screen.getByText(/kpis sent/i)).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

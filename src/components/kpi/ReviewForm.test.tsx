import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { routeFetch } from "@/test/fetchRouter";
import { MOCK_CONTEXTS } from "@/kpi/mock";
import { parseContext, type KpiContext } from "@/kpi/session";
import { ReviewForm } from "./ReviewForm";

/**
 * Build F, as a line manager meets it.
 *
 * The two things worth guarding here are the two that cannot be seen in a
 * screenshot: that a **mid review asks for no score of any kind** — a mid
 * review that asks for a rating is a final review held early, and managers
 * then anchor the real one to it — and that the live score on the final
 * review is the arithmetic the plan specified, on screen before the rating
 * is given.
 */

const TOKEN = "eyJmdCI6IktQSVIiLCJlaWQiOiI4NjlleGFtcGxlIn0.dGVzdC1zaWduYXR1cmUtbm90LXJlYWw";
const SUBMIT = "kenafric-wf26b";

/** The mock contexts are the fixtures: one shape, exercised by both. */
const contextFor = (variant: keyof typeof MOCK_CONTEXTS): KpiContext =>
  parseContext(MOCK_CONTEXTS[variant])!;

const renderForm = (variant: "mid" | "final" | "final-hr" | "final-void" = "final") =>
  render(<ReviewForm token={TOKEN} context={contextFor(variant)} />);

/** The answer rows, which are the second list on the page below `lg`. */
const answerRows = () => {
  const lists = screen.getAllByRole("list");
  return within(lists[lists.length - 1]).getAllByRole("listitem");
};

const bodyOf = (mock: ReturnType<typeof routeFetch>) => {
  const call = mock.mock.calls.find(([url]) => String(url).includes(SUBMIT));
  return JSON.parse(String((call?.[1] as RequestInit).body));
};

describe("the agreed set", () => {
  /** A manager reviewing from memory reviews the last fortnight. */
  it("is rendered read-only above the answers", () => {
    renderForm("final");

    expect(screen.getAllByText("Reduce line changeover time").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SAP changeover log/i).length).toBeGreaterThan(0);
    // Nothing about the agreed set is editable here — the set is frozen at
    // HR approval, and K-5 says an edit path is HR's job, not a form's
    expect(screen.queryByLabelText(/key result area/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^weight/i)).not.toBeInTheDocument();
  });
});

describe("the mid review", () => {
  it("asks for progress and notes, and for no rating at all", () => {
    renderForm("mid");

    expect(screen.getAllByRole("radio", { name: "On Track" })).toHaveLength(4);
    expect(screen.getAllByLabelText(/mid-review notes/i)).toHaveLength(4);

    // The whole point of a separate mid review
    expect(screen.queryByLabelText(/actual achieved/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /did not meet/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/score as it stands/i)).not.toBeInTheDocument();
  });

  it("will not send an Off Track KPI with no note", async () => {
    const user = userEvent.setup();
    const fetchMock = routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    renderForm("mid");

    const rows = answerRows();
    for (const row of rows) {
      await user.click(within(row).getByRole("radio", { name: "On Track" }));
    }
    await user.click(within(rows[0]).getByRole("radio", { name: "Off Track" }));
    await user.click(screen.getByRole("button", { name: /send the mid-review/i }));

    expect(await screen.findByText(/still needed/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends progress per KPI and nothing else", async () => {
    const user = userEvent.setup();
    const fetchMock = routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    renderForm("mid");

    for (const row of answerRows()) {
      await user.click(within(row).getByRole("radio", { name: "On Track" }));
    }
    await user.click(screen.getByRole("button", { name: /send the mid-review/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = bodyOf(fetchMock);

    expect(body.mode).toBe("mid");
    expect(body.kpis).toHaveLength(4);
    expect(body.kpis[0]).toEqual({ taskId: "86a1kpi01", progress: "On Track" });
    expect(body.talent).toBeUndefined();
  });
});

describe("the final review", () => {
  /**
   * The reason the score is on screen at all: a manager who enters 30
   * against a target of 45 sees 67% before they rate it a 4.
   */
  it("shows the score live, before the rating is given", async () => {
    const user = userEvent.setup();
    renderForm("final");

    const row = within(answerRows()[0]);
    await user.type(row.getByLabelText(/actual achieved/i), "30");

    expect(await within(answerRows()[0]).findByText("67%")).toBeInTheDocument();
  });

  it("says when the cap bit rather than leaving 120% looking like 100%", async () => {
    const user = userEvent.setup();
    renderForm("final");

    // Target 45, so 90 is 200% of target
    await user.type(within(answerRows()[0]).getByLabelText(/actual achieved/i), "90");

    expect(await screen.findByText(/capped at 100%/i)).toBeInTheDocument();
  });

  it("asks for no actual on the qualitative KPI, but still for its rating", () => {
    renderForm("final");

    // The fourth KPI in the sample set is the qualitative one
    const qualitative = within(answerRows()[3]);
    expect(qualitative.queryByLabelText(/actual achieved/i)).not.toBeInTheDocument();
    expect(
      qualitative.getByRole("radio", { name: /5 — significantly exceeded/i }),
    ).toBeInTheDocument();
  });

  it("shows what the mid review said, read-only", () => {
    renderForm("final");
    expect(screen.getByText(/at the mid review: at risk/i)).toBeInTheDocument();
    expect(screen.getByText(/short-staffed/i)).toBeInTheDocument();
  });

  /**
   * HR-only, and absent rather than disabled: a manager who can see a
   * control that moves somebody's final score will ask why they cannot use
   * it.
   */
  it("hides the panel adjustment from a line manager and shows it to HR", () => {
    const { unmount } = renderForm("final");
    expect(screen.queryByLabelText(/panel adjustment/i)).not.toBeInTheDocument();
    unmount();

    renderForm("final-hr");
    expect(screen.getByLabelText(/panel adjustment/i)).toBeInTheDocument();
  });

  /**
   * A voided KPI drops out of the numerator and the denominator both, and
   * the form says so — nobody should read 62 as out of 100 when it is out
   * of 75.
   */
  it("says what the score is out of when a KPI has been voided", () => {
    renderForm("final-void");
    expect(screen.getByText(/out of 75, not 100/i)).toBeInTheDocument();
  });

  it("refuses a partial review, which WF-26b would refuse anyway", async () => {
    const user = userEvent.setup();
    const fetchMock = routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    renderForm("final");

    await user.type(within(answerRows()[0]).getByLabelText(/actual achieved/i), "40");
    await user.click(screen.getByRole("button", { name: /send the final review/i }));

    expect(await screen.findByText(/still needed/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends actuals, ratings and the talent block, and no scores", async () => {
    const user = userEvent.setup();
    const fetchMock = routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    renderForm("final");

    const rows = answerRows();
    for (const [index, row] of rows.entries()) {
      const cell = within(row);
      const actual = cell.queryByLabelText(/actual achieved/i);
      if (actual) await user.type(actual, "45");
      await user.click(cell.getByRole("radio", { name: `4 — Exceeded` }));
      void index;
    }

    await user.type(screen.getByLabelText(/manager's comments/i), "Ready for confirmation.");
    await user.click(screen.getByRole("button", { name: /send the final review/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = bodyOf(fetchMock);

    expect(body.mode).toBe("final");
    expect(body.kpis).toHaveLength(4);
    expect(body.kpis[0].rating).toBe(4);
    expect(body.kpis[3]).not.toHaveProperty("actual");
    expect(body.talent.managerComments).toBe("Ready for confirmation.");
    // WF-26b computes every figure; the ones on screen are for the manager
    expect(JSON.stringify(body)).not.toContain("score");
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { routeFetch } from "@/test/fetchRouter";
import KpiDefinePage from "./KpiDefinePage";
import KpiReviewPage from "./KpiReviewPage";

/**
 * What each KPI route does with a token that is not its own.
 *
 * The two forms look nothing alike, so a swapped import would be obvious.
 * What would not be obvious is the refusals: a define link opened at the
 * review address, a review token with no mode, a review for an employee who
 * has no KPIs. Each of those must render a dead end and NOTHING else — no
 * employee name, no position, no KPI list — because a link that does not
 * work is opened by whoever happens to hold it.
 */

const TOKEN = "eyJmdCI6IktQSUQiLCJlaWQiOiI4NjlleGFtcGxlIn0.dGVzdC1zaWduYXR1cmUtbm90LXJlYWw";
const CONTEXT = "kenafric-kpi-context";

const EMPLOYEE = {
  employeeName: "Faith Mutiso",
  positionTitle: "Shift Quality Analyst",
  department: "Production",
  company: "Kenafric Manufacturing Limited",
  lineManager: "Daniel Omondi",
  joiningDate: "2026-09-10",
  probationEndDate: "2027-03-10",
  reviewCycle: "Probation",
};

const KPI = {
  taskId: "86a1kpi01",
  keyResultArea: "Operational Efficiency",
  kpi: "Reduce line changeover time",
  measurementType: "Quantitative",
  howMeasured: "SAP changeover log",
  targetFigure: 45,
  unitOfMeasure: "minutes",
  target: "Average changeover under 45 minutes",
  weight: 100,
  status: "in progress",
};

const renderRoute = (path: string, element: React.ReactNode, search = `?t=${TOKEN}`) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // `readToken` reads window.location, not the router
  window.history.replaceState({}, "", `${path}${search}`);
  return render(
    <MemoryRouter initialEntries={[`${path}${search}`]}>
      <QueryClientProvider client={client}>
        <Routes>
          <Route path={path} element={element} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

afterEach(() => window.history.replaceState({}, "", "/"));

/** Nothing about the employee may appear on a refusal. */
const namesNobody = () => {
  expect(screen.queryByText(EMPLOYEE.employeeName)).not.toBeInTheDocument();
  expect(screen.queryByText(EMPLOYEE.positionTitle)).not.toBeInTheDocument();
  expect(screen.queryByText(KPI.kpi)).not.toBeInTheDocument();
};

describe("/kpi/define", () => {
  it("opens the definition form for a KPID token", async () => {
    routeFetch([
      {
        match: CONTEXT,
        body: { ok: true, formType: "KPID", prefill: { ...EMPLOYEE, mode: null, kpis: [] } },
      },
    ]);
    renderRoute("/kpi/define", <KpiDefinePage />);

    expect(await screen.findByRole("button", { name: /send these kpis/i })).toBeInTheDocument();
    expect(screen.getByText(EMPLOYEE.employeeName)).toBeInTheDocument();
  });

  /**
   * A verified review token at the define address. Not a mistyped URL —
   * a token that does not verify never gets this far — but a send workflow
   * that built the wrong link, which must fail visibly the first time
   * rather than quietly produce mislabelled data.
   */
  it("refuses a review token, and names nobody in doing so", async () => {
    routeFetch([
      {
        match: CONTEXT,
        body: { ok: true, formType: "KPIR", prefill: { ...EMPLOYEE, mode: "mid", kpis: [KPI] } },
      },
    ]);
    renderRoute("/kpi/define", <KpiDefinePage />);

    expect(await screen.findByText(/opens a different form/i)).toBeInTheDocument();
    namesNobody();
  });

  it("renders the already-sent screen rather than a second form", async () => {
    routeFetch([
      {
        match: CONTEXT,
        body: {
          ok: true,
          formType: "KPID",
          alreadySubmitted: true,
          prefill: { ...EMPLOYEE, mode: null, kpis: [] },
        },
      },
    ]);
    renderRoute("/kpi/define", <KpiDefinePage />);

    expect(await screen.findByText(/already been sent/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /send these kpis/i })).not.toBeInTheDocument();
  });

  it("opens the define mock without a token and without n8n", async () => {
    const fetchMock = routeFetch([{ match: CONTEXT, body: {} }]);
    renderRoute("/kpi/define", <KpiDefinePage />, "?mock=1");

    expect(await screen.findByRole("button", { name: /send these kpis/i })).toBeInTheDocument();
    expect(screen.getByText(/sample data/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("says the link is incomplete when there is no token, without asking n8n", async () => {
    const fetchMock = routeFetch([{ match: CONTEXT, body: {} }]);
    renderRoute("/kpi/define", <KpiDefinePage />, "");

    expect(await screen.findByText(/link is incomplete/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  /**
   * 401, 403, 404 and 410 all read the same on screen. Distinguishing them
   * would tell somebody holding a guessed token which part of the guess was
   * wrong.
   */
  it("reads a refused token as one dead end, whatever the status", async () => {
    routeFetch([{ match: CONTEXT, status: 410, body: {} }]);
    renderRoute("/kpi/define", <KpiDefinePage />);

    expect(await screen.findByText(/link has expired/i)).toBeInTheDocument();
    namesNobody();
  });
});

describe("/kpi/review", () => {
  it("opens the mid review for a mid token", async () => {
    routeFetch([
      {
        match: CONTEXT,
        body: { ok: true, formType: "KPIR", prefill: { ...EMPLOYEE, mode: "mid", kpis: [KPI] } },
      },
    ]);
    renderRoute("/kpi/review", <KpiReviewPage />);

    expect(await screen.findByRole("button", { name: /send the mid-review/i })).toBeInTheDocument();
    // The mid review scores nothing
    expect(screen.queryByLabelText(/actual achieved/i)).not.toBeInTheDocument();
  });

  it("opens the final review for a final token", async () => {
    routeFetch([
      {
        match: CONTEXT,
        body: { ok: true, formType: "KPIR", prefill: { ...EMPLOYEE, mode: "final", kpis: [KPI] } },
      },
    ]);
    renderRoute("/kpi/review", <KpiReviewPage />);

    expect(
      await screen.findByRole("button", { name: /send the final review/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/actual achieved/i)).toBeInTheDocument();
  });

  /**
   * Guessing `mid` would hide the scoring block on a final review; guessing
   * `final` would ask for ratings at six weeks. Both are worse than
   * refusing.
   */
  it("refuses a review context with no mode rather than guessing one", async () => {
    routeFetch([
      {
        match: CONTEXT,
        body: { ok: true, formType: "KPIR", prefill: { ...EMPLOYEE, kpis: [KPI] } },
      },
    ]);
    renderRoute("/kpi/review", <KpiReviewPage />);

    expect(await screen.findByText(/link has expired/i)).toBeInTheDocument();
    namesNobody();
  });

  /** WF-26a should make this unreachable; if it happens, refuse it. */
  it("refuses a review for an employee with no KPIs", async () => {
    routeFetch([
      {
        match: CONTEXT,
        body: { ok: true, formType: "KPIR", prefill: { ...EMPLOYEE, mode: "final", kpis: [] } },
      },
    ]);
    renderRoute("/kpi/review", <KpiReviewPage />);

    expect(await screen.findByText(/no KPIs to review yet/i)).toBeInTheDocument();
    namesNobody();
  });

  /**
   * A voided KPI drops out before the form ever sees it, so it cannot be
   * answered about and its weight cannot land in the denominator.
   */
  it("drops a voided KPI from the set it renders", async () => {
    routeFetch([
      {
        match: CONTEXT,
        body: {
          ok: true,
          formType: "KPIR",
          prefill: {
            ...EMPLOYEE,
            mode: "final",
            kpis: [KPI, { ...KPI, taskId: "86a1kpi02", kpi: "Cancelled KPI", status: "void" }],
          },
        },
      },
    ]);
    renderRoute("/kpi/review", <KpiReviewPage />);

    await waitFor(() => expect(screen.getAllByText(KPI.kpi).length).toBeGreaterThan(0));
    expect(screen.queryByText("Cancelled KPI")).not.toBeInTheDocument();
  });

  it("opens every review mock variant without a token and without n8n", async () => {
    const fetchMock = routeFetch([{ match: CONTEXT, body: {} }]);

    for (const [variant, expected] of [
      ["mid", /send the mid-review/i],
      ["final", /send the final review/i],
      ["final-hr", /send the final review/i],
      ["final-void", /send the final review/i],
    ] as const) {
      const { unmount } = renderRoute("/kpi/review", <KpiReviewPage />, `?mock=${variant}`);
      expect(await screen.findByRole("button", { name: expected })).toBeInTheDocument();
      // Loud, because a demo that quietly looked real is how invented
      // content reaches a manager's inbox
      expect(screen.getByText(/sample data/i)).toBeInTheDocument();
      unmount();
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a define token at the review address", async () => {
    routeFetch([
      {
        match: CONTEXT,
        body: { ok: true, formType: "KPID", prefill: { ...EMPLOYEE, mode: null, kpis: [] } },
      },
    ]);
    renderRoute("/kpi/review", <KpiReviewPage />);

    expect(await screen.findByText(/opens a different form/i)).toBeInTheDocument();
    namesNobody();
  });
});

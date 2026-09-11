/**
 * Sample contexts, so both forms can be built and demoed before a single n8n
 * node exists.
 *
 * K1 and K2 build the forms against this; K3 points them at the real
 * `kenafric-kpi-context` endpoint and deletes nothing — the mock stays, as
 * the way to look at every state of both forms without minting a token.
 *
 * ---
 * **Nothing here is a real person.** The plan's own mock names Allan Kisua
 * and his line manager, who are live records in workspace 9012912728. Real
 * names are not put in a public JavaScript bundle attached to invented
 * performance data, so these are invented the way the feedback fixtures are:
 * there is no employee called Faith Mutiso and no manager called Daniel
 * Omondi. The SHAPE is the plan's, field for field, because that is what
 * WF-18a and WF-26a will be built to serve.
 *
 * **A mock submission never leaves the browser.** `sample: true` reaches
 * `useKpiSubmit`, which renders the success screen without a POST. A mock
 * that posted to WF-18b would create real KPI tasks on a real employee
 * record out of this invented content.
 * ---
 *
 * Reached with `?mock=<variant>` on either route, and only where the build
 * allows it — development, or a preview deployment with
 * `VITE_ALLOW_PREFILL=true`. See `useKpiContext`.
 */

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

/**
 * Four agreed KPIs at 25% each, in the §6.4 shape plus the two things the
 * review form needs: the ClickUp task id it answers against, and what the
 * mid review left behind.
 *
 * Deliberately mixed: three quantitative and one qualitative, so the final
 * form's two scoring paths — actual over target, and rating over five — are
 * both exercised by opening one page. One KES figure, one percentage and one
 * count, because a unit rendered beside an input is easy to get right with
 * "%" and easy to get wrong with "KES".
 */
const AGREED = [
  {
    taskId: "86a1kpi01",
    keyResultArea: "Operational Efficiency",
    kpi: "Reduce line changeover time",
    measurementType: "Quantitative",
    howMeasured: "SAP changeover log, weekly average across all shifts",
    targetFigure: 45,
    unitOfMeasure: "minutes",
    target: "Average changeover under 45 minutes by the end of probation",
    weight: 25,
    status: "in progress",
  },
  {
    taskId: "86a1kpi02",
    keyResultArea: "Compliance & Safety",
    kpi: "Close out quality non-conformances within SLA",
    measurementType: "Quantitative",
    howMeasured: "QA register — non-conformances closed within 5 working days, as a percentage",
    targetFigure: 95,
    unitOfMeasure: "%",
    target: "95% of non-conformances closed inside the 5-day SLA",
    weight: 25,
    status: "in progress",
  },
  {
    taskId: "86a1kpi03",
    keyResultArea: "Financial",
    kpi: "Reduce packaging material wastage",
    measurementType: "Quantitative",
    howMeasured: "Monthly wastage report against production volume, in KES",
    targetFigure: 180000,
    unitOfMeasure: "KES",
    target: "Monthly wastage held under KES 180,000",
    weight: 25,
    status: "in progress",
  },
  {
    taskId: "86a1kpi04",
    keyResultArea: "People & Development",
    kpi: "Run shift handover briefings to the agreed standard",
    measurementType: "Qualitative",
    howMeasured: "Supervisor observation against the handover checklist, reviewed monthly",
    targetFigure: null,
    unitOfMeasure: null,
    target: "Handovers consistently complete, on time and understood by the incoming shift",
    weight: 25,
    status: "in progress",
  },
];

/** What the mid review wrote, shown read-only on the final form. */
const AFTER_MID = AGREED.map((kpi, index) => ({
  ...kpi,
  progress: index === 1 ? "At Risk" : "On Track",
  midReviewNotes:
    index === 1
      ? "Two non-conformances slipped past the SLA in November while QA was short-staffed. Cover agreed from December."
      : null,
}));

/** A voided KPI, to exercise the reduced weight basis. */
const WITH_VOID = [
  { ...AFTER_MID[0], status: "void" },
  ...AFTER_MID.slice(1),
];

const define = (extra: Record<string, unknown> = {}) => ({
  ok: true,
  formType: "KPID",
  alreadySubmitted: false,
  prefill: { ...EMPLOYEE, mode: null, kpis: [], ...extra },
});

const review = (
  mode: "mid" | "final",
  kpis: unknown[],
  extra: Record<string, unknown> = {},
) => ({
  ok: true,
  formType: "KPIR",
  alreadySubmitted: false,
  prefill: { ...EMPLOYEE, mode, kpis, ...extra },
});

/**
 * Every state either form can be in, addressable from the URL.
 *
 * The dead ends are here too. They are the states that are hardest to reach
 * on purpose and easiest to get wrong — a refusal screen that names the
 * employee is a personnel leak, and nobody finds that by testing the happy
 * path.
 */
export const MOCK_CONTEXTS: Record<string, unknown> = {
  // --- Build E -------------------------------------------------------------
  "1": define(),
  define: define(),
  "define-submitted": { ...define(), alreadySubmitted: true },
  "define-warn": {
    ...define(),
    warn: "TEST_MODE is on in n8n: token signatures are not being checked, so this link would open any employee's form. Switch it off before sending a real one.",
  },

  // --- Build F -------------------------------------------------------------
  mid: review("mid", AGREED),
  final: review("final", AFTER_MID),
  /** The panel adjustment renders only for an HR token. */
  "final-hr": review("final", AFTER_MID, { hr: true }),
  /** One KPI voided: scored out of 75, and the form says so. */
  "final-void": review("final", WITH_VOID),
  "review-submitted": { ...review("final", AFTER_MID), alreadySubmitted: true },
  /** WF-26a should make this unreachable. If it happens, refuse. */
  "review-empty": review("final", []),
  /** A `KPIR` with no mode is refused rather than guessed at. */
  "review-nomode": { ok: true, formType: "KPIR", prefill: { ...EMPLOYEE, kpis: AGREED } },

  // --- Refusals ------------------------------------------------------------
  dead: { ok: false, reason: "This link has already been used." },
  broken: { ok: true, prefill: EMPLOYEE },
};

/** Is `?mock=<value>` one we serve? */
export const mockContextFor = (variant: string): unknown | null =>
  Object.prototype.hasOwnProperty.call(MOCK_CONTEXTS, variant)
    ? MOCK_CONTEXTS[variant]
    : null;

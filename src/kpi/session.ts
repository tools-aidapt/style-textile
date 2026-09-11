/**
 * Who this form is for, and whether it may open.
 *
 * The link WF-18a emails a line manager carries a signed token:
 * `/kpi/define?t=<token>`. The app reads it out of the URL, sends it to the
 * context endpoint, and renders whatever comes back.
 *
 * ---
 * **The app never decodes the token, and never trusts it.** It could — the
 * payload is only base64url — and that is exactly why it must not. `ft`
 * decides which form this is and `mode` decides whether a manager is asked
 * for ratings; a claim read out of an unverified token is a claim the holder
 * could have rewritten. So the signature is checked in n8n, where the secret
 * is, and `formType`, `mode` and every prefilled value come back from the
 * endpoint. The token is an opaque string here, from the URL to the POST body.
 *
 * Same bargain `feedback/session.ts` strikes, and deliberately the same
 * shape: one reader of both should not have to learn two.
 * ---
 *
 * The response is scoped to one employee and one review cycle. It is never a
 * list, and there is no shape in it for anybody else's KPIs.
 */

import type { MeasurementType, ProgressValue, ReviewMode } from "./contract";

/** The token's `ft`, as the SERVER reports it. Never read from the token. */
export type KpiFormType = "KPID" | "KPIR";

const FORM_TYPES: readonly string[] = ["KPID", "KPIR"];

export const isKpiFormType = (value: unknown): value is KpiFormType =>
  typeof value === "string" && FORM_TYPES.includes(value);

/**
 * What Kenafric already holds, shown back rather than asked for.
 *
 * If a manager has to type any of these, we have rebuilt the V1 problem in
 * React: a KPI sheet with a typed employee name is not attached to an
 * employee record and cannot be scored, reported, or carried into an
 * appraisal.
 */
export interface KpiPrefill {
  /** The employee whose KPIs these are. Not the person filling the form in. */
  employeeName: string;
  positionTitle: string | null;
  department: string | null;
  company: string | null;
  /** The line manager, who is normally the reader. Shown, never asked for. */
  lineManager: string | null;
  /** ISO dates. Rendered by the app, never a pre-formatted string. */
  joiningDate: string | null;
  probationEndDate: string | null;
  reviewCycle: string | null;
}

/**
 * One KPI as it already stands in ClickUp.
 *
 * Empty on the definition form. On the review form it is the agreed set,
 * rendered read-only above the answers, so a manager reviews against what
 * was agreed rather than against memory.
 */
export interface AgreedKpi {
  /** The ClickUp task id. Opaque: matched on, never parsed or rendered. */
  taskId: string;
  keyResultArea: string;
  kpi: string;
  measurementType: MeasurementType;
  howMeasured: string;
  targetFigure: number | null;
  unitOfMeasure: string | null;
  target: string;
  weight: number;
  /**
   * What the mid review left behind, shown on the final form.
   *
   * A final review held without the mid note in front of the manager is a
   * review of the last fortnight. Read-only here; the final form appends to
   * the note rather than overwriting it.
   */
  progress: ProgressValue | null;
  midReviewNotes: string | null;
}

export interface KpiContext {
  /** The server's word on which form this is. Never the token's, never the URL's. */
  formType: KpiFormType;
  /**
   * Which review. `null` on a definition context.
   *
   * A `KPIR` context with no usable mode is refused outright by
   * `parseContext` — see there for why guessing either way is worse.
   */
  mode: ReviewMode | null;
  /** Already submitted. Renders the thank-you, not the form. */
  alreadySubmitted: boolean;
  /**
   * The token belongs to HR, so the panel adjustment renders.
   *
   * Defaults to false, and the field is absent rather than disabled when it
   * is: a line manager who can see a control that adjusts somebody's final
   * score will ask why they cannot use it.
   */
  hr: boolean;
  prefill: KpiPrefill;
  /** The agreed set. Empty on `KPID`. */
  kpis: AgreedKpi[];
  /**
   * An operational warning from the endpoint, shown as a banner.
   *
   * The one that exists means n8n is in `TEST_MODE`: token signatures are
   * not being enforced, so a hand-made link opens any employee's KPI set.
   * That needs to be on the page, not in a log, and gone before a real link
   * is sent.
   */
  warning: string | null;
  /**
   * This page is running on checked-in sample data, not on a real record.
   *
   * Set only by the mock, never by the endpoint. It drives the banner and,
   * more importantly, the submit: a mock submission never reaches n8n.
   */
  sample: boolean;
}

/** Why the form will not open. Each renders a different dead end. */
export type KpiFault =
  /** No token in the URL — the tail of the link was lost in an email client. */
  | "no-token"
  /**
   * The endpoint refused it: bad signature, expired, or no record answers to
   * it. All one thing to the person reading it — this link does not work.
   */
  | "link-dead"
  | "unreachable"
  /**
   * A verified token for the other form — a define link opened at the review
   * address. Its own fault because retrying can never fix it, and because it
   * is our bug rather than theirs: a send workflow built the wrong link.
   */
  | "wrong-form"
  /**
   * A review link for an employee with no KPIs on the list.
   *
   * WF-26a is supposed to make this impossible — an event due but not ready
   * is neither fired nor marked. If it happens anyway, the form must refuse
   * rather than collect a set of answers about nothing.
   */
  | "empty-set"
  /** Deployed without its endpoints. A fault of ours, said as one. */
  | "unconfigured";

const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const nullable = (value: unknown): string | null => str(value) || null;

/**
 * A finite number, or `null`.
 *
 * `Number("")` is 0 and `Number(" ")` is 0, so a blank target figure would
 * arrive as a real zero — and a zero target figure is a division by zero in
 * the score. Anything that is not already a number, or a string that is
 * wholly numeric, is nothing.
 */
const num = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
};

/** `base64url.base64url` — a payload and its HMAC, as WF-18a mints it. */
const TOKEN = /^[A-Za-z0-9_-]{16,1024}\.[A-Za-z0-9_-]{16,512}$/;

/**
 * The token, from `?t=`.
 *
 * Query string only. Returns "" for anything that is not token-shaped, which
 * the page renders as `no-token` — that check saves the endpoint a
 * verification and keeps a URL nobody typed on purpose out of the logs. The
 * only thing that can actually judge this token is the secret in n8n.
 */
export const readToken = (): string => {
  let raw = "";
  try {
    raw = str(new URLSearchParams(window.location.search).get("t"));
  } catch {
    return "";
  }
  return TOKEN.test(raw) ? raw : "";
};

/**
 * Why the endpoint refused, in its own words, when it says so.
 *
 * A `200` carrying `ok: false` is a refusal the server chose to explain, and
 * the explanation is written server-side where the secret is, so it is shown
 * verbatim. **The wording is the endpoint's responsibility**: whoever holds
 * the link reads it, and that is not necessarily the person it was sent to,
 * so a reason must never name an employee or a position, and must not say
 * which part of a bad token was wrong.
 */
export const refusalReason = (raw: unknown): string | null => {
  const body = raw as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || body.ok !== false) return null;
  return str(body.reason) || null;
};

const parseMode = (value: unknown): ReviewMode | null =>
  value === "mid" || value === "final" ? value : null;

const parseMeasurement = (value: unknown): MeasurementType =>
  value === "Qualitative" ? "Qualitative" : "Quantitative";

const parseProgress = (value: unknown): ProgressValue | null =>
  value === "On Track" || value === "At Risk" || value === "Off Track" ? value : null;

/**
 * The agreed set, cleaned.
 *
 * A row with no task id is dropped: it cannot be answered about, because the
 * answer would have nowhere to go. So is a `void` one — a KPI voided because
 * the role changed drops out of the numerator and the denominator both, and
 * the cleanest way to guarantee that is for it never to reach the form.
 */
export const parseKpis = (raw: unknown): AgreedKpi[] => {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((entry) => {
    const row = (entry ?? {}) as Record<string, unknown>;
    const taskId = str(row.taskId);
    if (!taskId) return [];
    if (str(row.status).toLowerCase() === "void") return [];

    return [
      {
        taskId,
        keyResultArea: str(row.keyResultArea),
        kpi: str(row.kpi),
        measurementType: parseMeasurement(row.measurementType),
        howMeasured: str(row.howMeasured),
        targetFigure: num(row.targetFigure),
        unitOfMeasure: nullable(row.unitOfMeasure),
        target: str(row.target),
        weight: num(row.weight) ?? 0,
        progress: parseProgress(row.progress),
        midReviewNotes: nullable(row.midReviewNotes),
      },
    ];
  });
};

/**
 * The context endpoint's answer, or `null` for anything unusable.
 *
 * `null` renders as the dead end, so every refusal here is a decision to
 * show nothing rather than to guess:
 *
 * - **No form type.** The app would not know which form to render, and
 *   guessing would file a KPI set against the wrong instrument.
 * - **A `KPIR` with no mode.** Guessing `mid` would hide the scoring block
 *   on a final review and mark `KFIN` against a set with no scores in it;
 *   guessing `final` would ask for ratings at six weeks, which is the one
 *   thing the mid review exists not to do.
 */
export const parseContext = (raw: unknown, sample = false): KpiContext | null => {
  const body = raw as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return null;

  // An explicit `ok: false` is a refusal with a 200 on it. n8n Respond nodes
  // do that more often than anyone would like.
  if (body.ok === false) return null;

  const formType = body.formType;
  if (!isKpiFormType(formType)) return null;

  // `mode` and `kpis` sit inside `prefill` in the shape the plan specified
  // for the mock, and the endpoint is being built to that shape. Read from
  // either level, so a later tidy-up at the n8n end does not blank the form.
  const prefill = (body.prefill ?? {}) as Record<string, unknown>;
  const mode = parseMode(prefill.mode ?? body.mode);
  if (formType === "KPIR" && !mode) return null;

  return {
    formType,
    mode: formType === "KPIR" ? mode : null,
    alreadySubmitted: body.alreadySubmitted === true,
    hr: (prefill.hr ?? body.hr) === true,
    kpis: parseKpis(prefill.kpis ?? body.kpis),
    warning: str(body.warn) || null,
    sample,
    prefill: {
      employeeName: str(prefill.employeeName),
      positionTitle: nullable(prefill.positionTitle),
      department: nullable(prefill.department),
      company: nullable(prefill.company),
      lineManager: nullable(prefill.lineManager),
      joiningDate: nullable(prefill.joiningDate),
      probationEndDate: nullable(prefill.probationEndDate),
      reviewCycle: nullable(prefill.reviewCycle),
    },
  };
};

/** Does this route render that instrument? See `feedback/schema.ts`'s twin. */
export const servesFormType = (route: KpiFormType, context: KpiContext): boolean =>
  context.formType === route;

/**
 * An ISO date as a person reads it.
 *
 * `2026-03-10` is parsed as UTC by `new Date`, and rendering that in a
 * timezone behind UTC shows the day before — which on a probation end date
 * is a real error, not a cosmetic one. So the parts are read off the string
 * and never put through a timezone at all. Anything that is not an ISO date
 * is shown verbatim: an endpoint that sends "March 2027" is better rendered
 * than blanked.
 */
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const readableDate = (value: string | null): string | null => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;

  const [, year, month, day] = match;
  const name = MONTHS[Number(month) - 1];
  return name ? `${Number(day)} ${name} ${year}` : value;
};

/**
 * The wire contract with n8n for the two KPI forms — v1.0.
 *
 * Build E posts a KPI set to WF-18b; Build F posts a mid or final review to
 * WF-26b. Both are one `application/json` POST carrying the token verbatim.
 *
 * ```json
 * {
 *   "t": "<the token from the link>",
 *   "formType": "KPID",
 *   "submittedAt": "2026-09-18T14:20:00+03:00",
 *   "kpis": [ { "keyResultArea": "Operational Efficiency", "…": "…" } ]
 * }
 * ```
 *
 * ---
 * **Keyed by MEANING, not by ClickUp field id.** This is the one place the
 * KPI layer deliberately departs from the feedback layer, whose `answers`
 * object is keyed by field id. There the question set is fixed and the ids
 * are the stable contract; here the *rows* vary and the fields are few, so a
 * named schema is clearer and WF-18b resolves eight ids once. No ClickUp
 * field id, option UUID or list id appears in this bundle at all.
 * ---
 *
 * The rest of the rules are the feedback layer's, and hold for the same
 * reasons:
 *
 * - **Option NAMES, never option UUIDs** — `"Quantitative"`, `"On Track"`.
 *   The workflow resolves a name against the live field schema, so a rebuilt
 *   field does not silently start dropping answers.
 * - **An unset optional value is OMITTED**, not sent as `null` or `""`. A
 *   qualitative KPI has no target figure and no unit; sending empty ones
 *   writes two blank values to ClickUp, and "not applicable" and "left
 *   blank" report differently.
 * - **The token is the idempotency key.** WF-18b dedupes on `KPI Set Token`
 *   and WF-26b on the `KMID`/`KFIN` marker, which is what makes an n8n retry
 *   harmless — and why a 409 is treated as a success here.
 *
 * What the app deliberately does NOT send:
 *
 * - **`Score`, `Weighted Score`, `Weighted KPI Score` and `Final Individual
 *   Score`.** WF-26b computes them and the ClickUp formula recomputes
 *   `Weighted Score` per row. The figures on screen are for the manager to
 *   see what they are about to submit; two computations of one number is one
 *   too many.
 * - **The employee, the line manager, the position, the review cycle or the
 *   subtask id.** All of them are in the signed token or on the record. A
 *   browser that cannot be trusted to say who it is must not be the source
 *   of who this KPI set belongs to.
 */

export const SCHEMA_VERSION = "1.0" as const;
export const CLIENT_APP = "kenafric-kpi-web" as const;

/** This client's implementation of the contract, not the npm package. */
export const APP_VERSION = "1.0.0";

/**
 * Which instrument this is, matching the token's `ft` claim so a log line, a
 * token and a form all say the same word.
 *
 * `KPID` — the definition form, Build E, one per employee per review cycle.
 * `KPIR` — the review form, Build F, mid and final. One code for both,
 * because it is one instrument: the mid review is the final review with the
 * scoring block hidden, and two codes would invite two codebases.
 */
export type KpiFormType = "KPID" | "KPIR";

/** Which review this is. The server's word, from the token's `mode` claim. */
export type ReviewMode = "mid" | "final";

/** ClickUp `Measurement Type` option names. */
export type MeasurementType = "Quantitative" | "Qualitative";

/** ClickUp `Progress` option names. */
export type ProgressValue = "On Track" | "At Risk" | "Off Track";

/** One KPI as the line manager defined it. Build E. */
export interface DefinedKpi {
  keyResultArea: string;
  /** The KPI statement. Becomes the ClickUp task name, so it is capped. */
  kpi: string;
  measurementType: MeasurementType;
  howMeasured: string;
  /** Quantitative only, and never zero — the score is a division by it. */
  targetFigure?: number;
  /** Quantitative only. */
  unitOfMeasure?: string;
  /** The target as a sentence, which is what the review is read against. */
  target: string;
  weight: number;
}

export interface KpiDefinitionSubmission {
  t: string;
  formType: "KPID";
  submittedAt: string;
  kpis: DefinedKpi[];
}

/**
 * A review answer, addressed by the KPI's ClickUp task id.
 *
 * The task id is the only ClickUp identifier that crosses the wire, and it
 * has to: the review form is answering about tasks the context endpoint
 * served, and matching them back by name would break the first time a KPI
 * statement was edited. It is an opaque string to this app — never parsed,
 * never rendered, never logged.
 */
export interface MidReviewKpi {
  taskId: string;
  progress: ProgressValue;
  /** Required at At Risk and Off Track, optional at On Track. */
  midReviewNotes?: string;
}

export interface FinalReviewKpi {
  taskId: string;
  /** Quantitative only. */
  actual?: number;
  /** 1-5, captured for every KPI regardless of measurement type. */
  rating: number;
  /** Required at a rating of 2 or below. */
  comment?: string;
}

/**
 * The KIL sheet's talent block, rows 20-42. Final review only.
 *
 * Two arrays rather than two joined strings: the sheet asks for up to three
 * training areas and up to two aspirations as separate lines, and WF-26b
 * joins them with newlines for the ClickUp text field. Joining here would
 * make an empty middle line indistinguishable from a blank one.
 */
export interface TalentBlock {
  capacityBuilding: string[];
  careerAspirations: string[];
  employeeComments?: string;
  managerComments: string;
  /**
   * Signed, and HR-only — the field is not rendered unless the context says
   * the token belongs to HR, so a line manager cannot send one at all.
   */
  panelAdjustment?: number;
}

export interface KpiReviewSubmission {
  t: string;
  formType: "KPIR";
  /** The server's word, carried back so WF-26b branches without re-decoding. */
  mode: ReviewMode;
  submittedAt: string;
  kpis: MidReviewKpi[] | FinalReviewKpi[];
  /** Final only. */
  talent?: TalentBlock;
}

export type KpiSubmission = KpiDefinitionSubmission | KpiReviewSubmission;

/** The workflow answers before it touches ClickUp, so this is thin on purpose. */
export interface KpiReceipt {
  ok: true;
  /** Present once the work exists. Never shown to a line manager. */
  taskId?: string;
}

/**
 * Why a submit was refused, per answer, so the form can point at it.
 *
 * `field` is one of this app's own error keys — `<rowId>.weight` on Build E,
 * `<taskId>.rating` on Build F — and not a ClickUp field id, because the
 * payload is not keyed by one. A workflow that cannot attribute its
 * objection to a row omits it and the message shows above Submit.
 */
export interface SubmissionIssue {
  field?: string;
  message: string;
}

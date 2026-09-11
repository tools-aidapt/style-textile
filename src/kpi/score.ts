/**
 * The arithmetic of a final review.
 *
 * **WF-26b computes the figures that get stored.** Everything here exists so
 * the manager can see what they are about to submit — a manager who enters
 * 30 against a target of 45 should see 67% before they rate it a 4 — and so
 * the tests can pin the rules. Nothing in this file reaches the wire.
 *
 * ---
 * ### A contradiction in the plan, and what this implements
 *
 * Rev 3 states the weighted figure two different ways:
 *
 * - §3.1, the ClickUp formula: `field("Score") * field("Weight %") / 100`,
 *   which for Score 0.89 and Weight 40 gives **0.356**.
 * - §8.3, UAT 36 and UAT 51: "Weighted KPI Score = Σ(Weight% × Score)",
 *   "`Weighted Score` must read **35.6**", and a worked total of "82.4 / 100".
 *
 * They cannot both be right — `0.89 × 40 ÷ 100` is 0.356, not 35.6.
 *
 * This implements **Score × Weight%**, out of 100, because that is the one
 * the rest of the document depends on: it is the only reading under which a
 * set of weights totalling 100 produces a score out of 100, which is what
 * the probation decision, the KIL sheet and the `82.4 / 100` log line all
 * assume. The ClickUp formula therefore needs its `/ 100` removed, and UAT
 * step 36 will read 0.356 until it is. Raised as a finding, not patched
 * around: a form that silently multiplied by 100 to agree with ClickUp would
 * hide the defect rather than surface it.
 * ---
 */

import type { AgreedKpi } from "./session";

/**
 * The ceiling on a single KPI's score. **K-3 is open.**
 *
 * 1 means 100% of target is full marks and beating it earns nothing extra.
 * The plan recommends this for probation — a probation review is pass/fail,
 * not a bonus calculation — and the KIL template is uncapped, which is the
 * defect being corrected. One constant, so the annual cycle can differ by
 * changing this line rather than by finding every division.
 */
export const SCORE_CAP = 1;

/** Two places, and never for display — display rounds separately. */
const round = (value: number, places: number): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

/**
 * A quantitative KPI's score: actual over target, capped.
 *
 * `null` when the target figure is missing or zero. **A zero target is a
 * division by zero**, which is exactly why the form refuses one outright at
 * definition time — this is the second line of defence, for a set that
 * arrived some other way.
 */
export const quantitativeScore = (
  actual: number | null,
  targetFigure: number | null,
): number | null => {
  if (actual === null || !Number.isFinite(actual)) return null;
  if (targetFigure === null || !Number.isFinite(targetFigure) || targetFigure === 0) return null;
  return Math.min(actual / targetFigure, SCORE_CAP);
};

/**
 * A qualitative KPI's score: the 1-5 rating over 5.
 *
 * The KIL sheet has no way to score one of these at all — every row divides
 * by Target Figure, so a qualitative KPI shows `#DIV/0!`. The Measurement
 * Type switch is the fix, and this is the other half of it.
 */
export const qualitativeScore = (rating: number | null): number | null => {
  if (rating === null || !Number.isFinite(rating)) return null;
  if (rating < 1 || rating > 5) return null;
  return rating / 5;
};

/** One row's inputs, as the form holds them once parsed. */
export interface ScoredRowInput {
  taskId: string;
  actual: number | null;
  rating: number | null;
}

export interface ScoredRow {
  taskId: string;
  weight: number;
  /** 0-1, or `null` while the row is unanswered. */
  score: number | null;
  /** `score × weight`. Out of the row's own weight — see the header. */
  weighted: number | null;
  /**
   * The uncapped ratio, when the cap actually bit.
   *
   * Shown beside the score so a manager who hit 120% of target is told the
   * figure was capped rather than left to wonder why 120% scored the same as
   * 100%. Only ever set for a quantitative row.
   */
  uncapped: number | null;
}

/**
 * Score one row against the KPI as agreed.
 *
 * The measurement type decides which formula applies, not which fields
 * happen to be filled in: a manager who types an actual into a qualitative
 * row is not thereby scoring it on a ratio.
 */
export const scoreRow = (kpi: AgreedKpi, input: ScoredRowInput): ScoredRow => {
  const quantitative = kpi.measurementType === "Quantitative";
  const raw = quantitative
    ? input.actual !== null && kpi.targetFigure
      ? input.actual / kpi.targetFigure
      : null
    : null;

  const score = quantitative
    ? quantitativeScore(input.actual, kpi.targetFigure)
    : qualitativeScore(input.rating);

  return {
    taskId: kpi.taskId,
    weight: kpi.weight,
    score,
    weighted: score === null ? null : round(score * kpi.weight, 2),
    uncapped: raw !== null && raw > SCORE_CAP ? raw : null,
  };
};

export interface ReviewTotals {
  rows: ScoredRow[];
  /**
   * The sum of the live KPIs' weights.
   *
   * **Not assumed to be 100.** A voided KPI drops out of the numerator and
   * the denominator both, so a set that was agreed at 100 and lost a 20%
   * KPI is scored out of 80 — and the form says so, because nobody should
   * read 62 as out of 100 when it is out of 80.
   */
  weightBasis: number;
  /** `Σ (score × weight)` over the answered rows, to one decimal. */
  weighted: number | null;
  /** True once every row has a score, which is when the total means anything. */
  complete: boolean;
}

/**
 * The set total.
 *
 * `weighted` is `null` until every row is scored. A running subtotal of
 * three rows out of five is not a partial score, it is a wrong one — it
 * looks like a low score rather than an incomplete review, and a manager who
 * reads 41 and stops has just failed somebody's probation with two blanks.
 */
export const totalsFor = (kpis: AgreedKpi[], inputs: ScoredRowInput[]): ReviewTotals => {
  const byTask = new Map(inputs.map((input) => [input.taskId, input]));

  const rows = kpis.map((kpi) =>
    scoreRow(kpi, byTask.get(kpi.taskId) ?? { taskId: kpi.taskId, actual: null, rating: null }),
  );

  const weightBasis = kpis.reduce((total, kpi) => total + kpi.weight, 0);
  const complete = rows.length > 0 && rows.every((row) => row.score !== null);
  const sum = rows.reduce((total, row) => total + (row.weighted ?? 0), 0);

  return {
    rows,
    weightBasis,
    weighted: complete ? round(sum, 1) : null,
    complete,
  };
};

/**
 * `Final Individual Score` = the weighted total plus the panel adjustment.
 *
 * The adjustment is signed and HR-only. It is added, never clamped: a panel
 * that decided to take five points off an 82 means 77, and silently flooring
 * it at some boundary would misreport what the panel actually decided.
 */
export const finalIndividualScore = (
  weighted: number | null,
  panelAdjustment: number | null,
): number | null => {
  if (weighted === null) return null;
  return round(weighted + (panelAdjustment ?? 0), 1);
};

/** A score as a percentage, for display beside the input. */
export const asPercent = (score: number | null): string | null =>
  score === null ? null : `${round(score * 100, 0)}%`;

/** One decimal, for the running totals. */
export const oneDecimal = (value: number): number => round(value, 1);

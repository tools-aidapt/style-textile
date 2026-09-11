/**
 * Building the two submissions.
 *
 * Small, pure, and tested against `docs/kpi-definition-1.0.schema.json` and
 * `docs/kpi-review-1.0.schema.json` with Ajv rather than against this
 * module's own opinion of those files.
 */

import { localIsoTimestamp } from "@/lib/isoTimestamp";
import type {
  DefinedKpi,
  FinalReviewKpi,
  KpiDefinitionSubmission,
  KpiReviewSubmission,
  MeasurementType,
  MidReviewKpi,
  ProgressValue,
  ReviewMode,
  TalentBlock,
} from "./contract";
import { filledLines, isQuantitative, parseNumber } from "./form";
import type { FinalRowState, KpiRow, MidRowState, TalentState } from "./form";
import type { AgreedKpi } from "./session";

export { localIsoTimestamp };

/**
 * The KPI set, cleaned for the wire.
 *
 * - **Text is trimmed.** A field holding one newline is not an answer.
 * - **A qualitative row sends no target figure and no unit.** Not `null`,
 *   not `""` — absent. ClickUp will write an empty string, and "does not
 *   apply" and "left blank" report differently.
 * - **The row id never leaves the browser.** It exists so React and the
 *   error keys can address a row that has no ClickUp task yet.
 */
export const cleanRow = (row: KpiRow): DefinedKpi => {
  const quantitative = isQuantitative(row);
  const figure = parseNumber(row.targetFigure);

  const base: DefinedKpi = {
    keyResultArea: row.keyResultArea.trim(),
    kpi: row.kpi.trim(),
    // Validation has already refused a blank; the cast is the last step of a
    // narrowing the form guarantees, not an assumption about the input
    measurementType: (row.measurementType || "Quantitative") as MeasurementType,
    howMeasured: row.howMeasured.trim(),
    target: row.target.trim(),
    weight: parseNumber(row.weight) ?? 0,
  };

  if (!quantitative) return base;

  return {
    ...base,
    ...(figure === null ? {} : { targetFigure: figure }),
    ...(row.unitOfMeasure.trim() ? { unitOfMeasure: row.unitOfMeasure.trim() } : {}),
  };
};

export const buildDefinition = ({
  token,
  rows,
  now,
}: {
  token: string;
  rows: KpiRow[];
  now?: Date;
}): KpiDefinitionSubmission => ({
  t: token,
  formType: "KPID",
  submittedAt: localIsoTimestamp(now),
  kpis: rows.map(cleanRow),
});

/**
 * The mid review.
 *
 * A note is sent only when one was written. WF-26b **appends** it to
 * `Mid-Review Notes` under a dated heading rather than overwriting, so an
 * empty string posted here would append a dated heading with nothing under
 * it — a note in the audit trail that says a manager wrote nothing, which is
 * not the same as a manager who had nothing to add.
 */
export const buildMidReview = ({
  token,
  kpis,
  rows,
  now,
}: {
  token: string;
  kpis: AgreedKpi[];
  rows: Record<string, MidRowState>;
  now?: Date;
}): KpiReviewSubmission => ({
  t: token,
  formType: "KPIR",
  mode: "mid",
  submittedAt: localIsoTimestamp(now),
  kpis: kpis.map((kpi): MidReviewKpi => {
    const row = rows[kpi.taskId] ?? { progress: "", notes: "" };
    const notes = row.notes.trim();
    return {
      taskId: kpi.taskId,
      progress: (row.progress || "On Track") as ProgressValue,
      ...(notes ? { midReviewNotes: notes } : {}),
    };
  }),
});

/**
 * The talent block.
 *
 * Blank lines are dropped, so three empty capacity-building boxes send an
 * empty array rather than three empty strings. The panel adjustment is sent
 * only when HR is the one filling this in **and** they typed something: a
 * zero adjustment and no adjustment are the same outcome, but only one of
 * them is a decision somebody made, and `0` posted by a manager who never
 * saw the control would be a decision nobody made.
 */
export const cleanTalent = (talent: TalentState, hr: boolean): TalentBlock => {
  const adjustment = hr ? parseNumber(talent.panelAdjustment) : null;

  return {
    capacityBuilding: filledLines(talent.capacityBuilding),
    careerAspirations: filledLines(talent.careerAspirations),
    ...(talent.employeeComments.trim()
      ? { employeeComments: talent.employeeComments.trim() }
      : {}),
    managerComments: talent.managerComments.trim(),
    ...(adjustment === null ? {} : { panelAdjustment: adjustment }),
  };
};

/**
 * The final review.
 *
 * **No scores.** `Score`, `Weighted Score`, `Weighted KPI Score` and `Final
 * Individual Score` are all WF-26b's, and `Weighted Score` is a ClickUp
 * formula that recomputes itself. The figures on screen are so the manager
 * can see what they are submitting; sending them would make this browser a
 * second source of truth for a number a probation decision rests on.
 *
 * An actual is sent on quantitative rows only. The rating goes on every row
 * regardless of measurement type — it is what WF-19 gates on.
 */
export const buildFinalReview = ({
  token,
  kpis,
  rows,
  talent,
  hr,
  now,
}: {
  token: string;
  kpis: AgreedKpi[];
  rows: Record<string, FinalRowState>;
  talent: TalentState;
  hr: boolean;
  now?: Date;
}): KpiReviewSubmission => ({
  t: token,
  formType: "KPIR",
  mode: "final",
  submittedAt: localIsoTimestamp(now),
  kpis: kpis.map((kpi): FinalReviewKpi => {
    const row = rows[kpi.taskId] ?? { actual: "", rating: "", comment: "" };
    const actual = parseNumber(row.actual);
    const comment = row.comment.trim();

    return {
      taskId: kpi.taskId,
      ...(kpi.measurementType === "Quantitative" && actual !== null ? { actual } : {}),
      rating: parseNumber(row.rating) ?? 0,
      ...(comment ? { comment } : {}),
    };
  }),
  talent: cleanTalent(talent, hr),
});

/** The two review branches, chosen by the server's word on the mode. */
export const buildReview = (args: {
  mode: ReviewMode;
  token: string;
  kpis: AgreedKpi[];
  midRows: Record<string, MidRowState>;
  finalRows: Record<string, FinalRowState>;
  talent: TalentState;
  hr: boolean;
  now?: Date;
}): KpiReviewSubmission =>
  args.mode === "mid"
    ? buildMidReview({ token: args.token, kpis: args.kpis, rows: args.midRows, now: args.now })
    : buildFinalReview({
        token: args.token,
        kpis: args.kpis,
        rows: args.finalRows,
        talent: args.talent,
        hr: args.hr,
        now: args.now,
      });

/**
 * What stops a submit, and what the manager is told about it.
 *
 * One tier, like the feedback layer's: every rule here is either an answer
 * that has to be given or an answer that cannot be stored, and neither is
 * negotiable by a checkbox.
 *
 * Errors show on **blur, never on keystroke** — a manager typing `4` on the
 * way to `45` must not be told 4 is below the minimum weight. A choice is
 * complete the moment it is made, so those touch immediately. A submit
 * attempt reveals everything at once.
 *
 * ---
 * **The weight total is not an error.** It is a live figure in the footer
 * with its delta to 100, and Submit is disabled until it reads exactly 100.
 * A manager distributing five weights is mid-calculation for the whole
 * exercise; an error message that appears and disappears on every keystroke
 * is noise, and the plan says to show the running figure rather than shout.
 * ---
 */

import type { AgreedKpi } from "./session";
import {
  filledLines,
  isQuantitative,
  parseNumber,
  weightTotal,
  type FinalRowState,
  type KpiRow,
  type MidRowState,
  type TalentState,
} from "./form";
import {
  MAX_KPI_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_WEIGHT,
  MIN_WEIGHT,
  PROGRESS_NEEDS_NOTE,
  RATING_NEEDS_COMMENT,
  WEIGHT_TOTAL,
  errorKey,
} from "./schema";

/** Keyed by `<row>.<control>` — see `errorKey`. */
export type FieldErrors = Record<string, string>;

export interface ValidationResult {
  errors: FieldErrors;
  /** Error keys in reading order, so "go to the first problem" is unambiguous. */
  missing: string[];
}

const REQUIRED = "Please fill this in";

const collect = (
  entries: [key: string, error: string | null][],
): ValidationResult => {
  const errors: FieldErrors = {};
  const missing: string[] = [];

  entries.forEach(([key, error]) => {
    if (!error) return;
    errors[key] = error;
    missing.push(key);
  });

  return { errors, missing };
};

const tooLong = (value: string, max: number): string | null =>
  value.trim().length > max
    ? `Please keep this under ${max.toLocaleString()} characters`
    : null;

// --- Build E, the definition form -------------------------------------------

/**
 * One row of the definition form.
 *
 * The order of the checks is the order the fields render, so the first
 * problem the jump button lands on is the first one on screen rather than
 * the first one this function happened to test.
 */
export const validateRow = (row: KpiRow): [string, string | null][] => {
  const quantitative = isQuantitative(row);
  const figure = parseNumber(row.targetFigure);
  const weight = parseNumber(row.weight);
  const kpi = row.kpi.trim();

  return [
    [errorKey(row.id, "keyResultArea"), row.keyResultArea.trim() ? null : REQUIRED],
    [
      errorKey(row.id, "kpi"),
      !kpi
        ? REQUIRED
        : kpi.length > MAX_KPI_LENGTH
          ? // ClickUp task names cap at 100. A KPI statement that arrives
            // truncated is a KPI nobody agreed to.
            `Please keep the KPI under ${MAX_KPI_LENGTH} characters`
          : null,
    ],
    [errorKey(row.id, "measurementType"), row.measurementType ? null : "Please choose one"],
    [errorKey(row.id, "howMeasured"), row.howMeasured.trim() ? null : REQUIRED],
    [
      errorKey(row.id, "targetFigure"),
      !quantitative
        ? null
        : figure === null
          ? REQUIRED
          : figure === 0
            ? // The score is a division by this. A zero target is refused
              // outright rather than carried to a review that cannot score it.
              "A target of zero cannot be scored — please give the figure to be reached"
            : figure < 0
              ? "Please give a positive figure"
              : null,
    ],
    [
      errorKey(row.id, "unitOfMeasure"),
      quantitative && !row.unitOfMeasure.trim()
        ? "Please say what the figure is measured in"
        : null,
    ],
    [errorKey(row.id, "target"), row.target.trim() ? null : REQUIRED],
    [
      errorKey(row.id, "weight"),
      weight === null
        ? REQUIRED
        : weight < MIN_WEIGHT
          ? `Please use at least ${MIN_WEIGHT}%`
          : weight > MAX_WEIGHT
            ? // One KPI carrying the whole review is not a review
              `No single KPI may carry more than ${MAX_WEIGHT}%`
            : null,
    ],
  ];
};

export const validateDefinition = (rows: KpiRow[]): ValidationResult =>
  collect(rows.flatMap(validateRow));

/**
 * Whether Submit may be pressed at all.
 *
 * Separate from the errors because the weight total is not attributable to
 * any one row: it is a property of the set, it is already on screen as a
 * live figure, and marking five rows red because they add up to 95 would
 * blame each of them for the arithmetic of all of them.
 */
export const definitionReady = (rows: KpiRow[]): boolean =>
  weightTotal(rows) === WEIGHT_TOTAL && validateDefinition(rows).missing.length === 0;

/** The signed distance to 100, for the footer. Negative means short. */
export const weightDelta = (rows: KpiRow[]): number => weightTotal(rows) - WEIGHT_TOTAL;

// --- Build F, the review form -----------------------------------------------

/**
 * Mid review.
 *
 * Progress on every KPI, and a note wherever the answer is At Risk or Off
 * Track. A KPI marked Off Track with no note is a shrug: HR reads it a
 * fortnight later with no idea what went wrong.
 */
export const validateMid = (
  kpis: AgreedKpi[],
  rows: Record<string, MidRowState>,
): ValidationResult =>
  collect(
    kpis.flatMap((kpi) => {
      const row = rows[kpi.taskId] ?? { progress: "", notes: "" };
      const needsNote =
        row.progress !== "" && PROGRESS_NEEDS_NOTE.includes(row.progress);

      return [
        [errorKey(kpi.taskId, "progress"), row.progress ? null : "Please choose one"] as [
          string,
          string | null,
        ],
        [
          errorKey(kpi.taskId, "notes"),
          needsNote && !row.notes.trim()
            ? `Please say what is behind "${row.progress}" and what happens next`
            : tooLong(row.notes, MAX_NOTES_LENGTH),
        ] as [string, string | null],
      ];
    }),
  );

/**
 * Final review.
 *
 * **Every KPI, every time.** WF-26b refuses a partial final review outright,
 * because a partial one produces a wrong weighted score and a wrong score is
 * worse than none — so the form must not let one be built. An actual is
 * required on quantitative rows only; the rating is required on all of them,
 * because it is what WF-19 gates on and what HR reads.
 */
export const validateFinal = (
  kpis: AgreedKpi[],
  rows: Record<string, FinalRowState>,
  talent: TalentState,
  hr: boolean,
): ValidationResult => {
  const perKpi = kpis.flatMap((kpi) => {
    const row = rows[kpi.taskId] ?? { actual: "", rating: "", comment: "" };
    const actual = parseNumber(row.actual);
    const rating = parseNumber(row.rating);
    const quantitative = kpi.measurementType === "Quantitative";

    return [
      [
        errorKey(kpi.taskId, "actual"),
        !quantitative
          ? null
          : actual === null
            ? "Please give what was actually achieved"
            : actual < 0
              ? "Please give a positive figure"
              : null,
      ] as [string, string | null],
      [
        errorKey(kpi.taskId, "rating"),
        rating === null ? "Please rate this KPI from 1 to 5" : null,
      ] as [string, string | null],
      [
        errorKey(kpi.taskId, "comment"),
        rating !== null && rating <= RATING_NEEDS_COMMENT && !row.comment.trim()
          ? // A 1 or a 2 is part of what a probation decision rests on, and
            // an unexplained one cannot be put to the employee
            "A rating of 2 or below needs a comment"
          : tooLong(row.comment, MAX_NOTES_LENGTH),
      ] as [string, string | null],
    ];
  });

  const adjustment = parseNumber(talent.panelAdjustment);

  return collect([
    ...perKpi,
    [
      errorKey("talent", "managerComments"),
      talent.managerComments.trim()
        ? tooLong(talent.managerComments, MAX_NOTES_LENGTH)
        : REQUIRED,
    ],
    [errorKey("talent", "employeeComments"), tooLong(talent.employeeComments, MAX_NOTES_LENGTH)],
    [
      errorKey("talent", "panelAdjustment"),
      // Only reachable when the token says HR, because the control is not
      // rendered otherwise. Checked anyway: a value in state that is not a
      // number would otherwise reach the payload as NaN.
      hr && talent.panelAdjustment.trim() && adjustment === null
        ? "Please give a number, or leave this blank"
        : null,
    ],
  ]);
};

/** Whether anything at all was written in the talent block. Advisory only. */
export const talentAnswered = (talent: TalentState): boolean =>
  filledLines(talent.capacityBuilding).length > 0 ||
  filledLines(talent.careerAspirations).length > 0 ||
  !!talent.employeeComments.trim() ||
  !!talent.managerComments.trim();

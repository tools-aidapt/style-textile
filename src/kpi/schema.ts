/**
 * The rules both KPI forms are built to, in one place.
 *
 * Every figure here came out of the KPI phase plan (rev 3) or out of the KIL
 * sheet itself, and each one is a decision somebody can point at rather than
 * a number a component happened to hardcode. The forms read them; the
 * validation reads them; the tests read them.
 */

import type { MeasurementType, ProgressValue, ReviewMode } from "./contract";

/**
 * Three to five KPIs.
 *
 * Fewer than three is not a scored review, it is an opinion with a number on
 * it; more than five and the weights get so thin that no single KPI can move
 * the outcome. Enforced by the add and remove buttons rather than by a
 * message after the fact — a rule a manager cannot break does not need
 * explaining.
 */
export const MIN_KPIS = 3;
export const MAX_KPIS = 5;

/** Weights must total this exactly before Submit will enable. */
export const WEIGHT_TOTAL = 100;

/**
 * No KPI below 5% or above 60%.
 *
 * The ceiling is the one that matters: one KPI carrying the whole review is
 * not a review, and 60 is the line the plan drew. The floor stops a row that
 * exists only to make the arithmetic work.
 */
export const MIN_WEIGHT = 5;
export const MAX_WEIGHT = 60;

/** ClickUp task names cap at 100 characters, and the KPI statement is one. */
export const MAX_KPI_LENGTH = 100;

/** The long-text answers. Generous, and only there to stop a paste of a book. */
export const MAX_NOTES_LENGTH = 2_000;

/** The talent block's own limits, from the KIL sheet's row count. */
export const MAX_CAPACITY_BUILDING = 3;
export const MAX_CAREER_ASPIRATIONS = 2;

export const MEASUREMENT_TYPES: readonly MeasurementType[] = ["Quantitative", "Qualitative"];

export const PROGRESS_VALUES: readonly ProgressValue[] = ["On Track", "At Risk", "Off Track"];

/**
 * Progress values that oblige the manager to write something.
 *
 * A KPI marked Off Track with no note is the review equivalent of a shrug:
 * HR reads it a fortnight later with no idea what went wrong or what was
 * done about it. On Track needs no defence.
 */
export const PROGRESS_NEEDS_NOTE: readonly ProgressValue[] = ["At Risk", "Off Track"];

/**
 * Suggested Key Result Areas — suggestions, not a list. **K-2 is open.**
 *
 * The ClickUp field is `short_text` today, so free text is what the workspace
 * actually supports and free text is what this offers, with these as a
 * datalist so the common five are one keystroke away. If HR answers K-2 with
 * "fixed list", this becomes the option list and the input becomes a select —
 * one change, here.
 */
export const KRA_SUGGESTIONS: readonly string[] = [
  "Financial",
  "Customer",
  "Operational Efficiency",
  "People & Development",
  "Compliance & Safety",
];

/** Offered under the unit input, for the same reason and with the same status. */
export const UNIT_SUGGESTIONS: readonly string[] = [
  "KES",
  "%",
  "units",
  "days",
  "hours",
  "count",
];

/**
 * What each of the five ratings means, verbatim from the KIL sheet.
 *
 * Under the row rather than in a legend elsewhere: an anchor away from the
 * number it anchors is a cross-reference, and a manager mid-review does not
 * make one. These are also what the accessible name of each radio carries,
 * so "4" is never announced as just a number.
 */
export const RATING_ANCHORS: Readonly<Record<number, string>> = {
  1: "Did not meet",
  2: "Partially met",
  3: "Met",
  4: "Exceeded",
  5: "Significantly exceeded",
};

export const RATINGS: readonly number[] = [1, 2, 3, 4, 5];

/**
 * A rating at or below this obliges a comment.
 *
 * Same reasoning as `PROGRESS_NEEDS_NOTE`, and higher stakes: a 1 or a 2 at
 * final review is part of what a probation decision rests on, and an
 * unexplained one cannot be put to the employee at the confirmation
 * conversation.
 */
export const RATING_NEEDS_COMMENT = 2;

/** Whether the scoring block renders at all. */
export const isFinal = (mode: ReviewMode | null): boolean => mode === "final";

/**
 * A DOM id for a row's control.
 *
 * Rows are addressed by a client-side row id on Build E and by a ClickUp
 * task id on Build F. Neither is guaranteed to start with a letter, and a
 * DOM id may not start with a digit, so every one is prefixed. `k-<row>-<name>`
 * is the control, `k-<row>-<name>-field` the scroll target, and `-help` and
 * `-error` are what describe it — the same shape `feedback/schema.ts` uses.
 */
export const controlDomId = (row: string, name: string): string => `k-${row}-${name}`;

/**
 * An error key: the row and the control, joined.
 *
 * One string so errors, the missing-answer list and the jump-to-first-problem
 * button all address a control the same way, and so a workflow can attribute
 * a refusal to one of them (see `SubmissionIssue`).
 */
export const errorKey = (row: string, name: string): string => `${row}.${name}`;

/** The `<datalist>` a suggestion set is offered through. */
export const datalistId = (name: string): string => `k-suggest-${name}`;

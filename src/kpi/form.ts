/**
 * What the two forms hold while they are being filled in.
 *
 * ---
 * **Every numeric answer is held as a STRING.** A target figure, a weight,
 * an actual and a panel adjustment are all `string` here and are parsed once,
 * at the edge. Holding them as numbers forces a choice between `0` and
 * `NaN` for an empty box, and both lie: `0` is a real answer that scores a
 * division by zero, and `NaN` cannot round-trip through an input. A manager
 * halfway through typing `45` has typed `4`, and a model that cannot hold
 * that is a model that fights the keyboard.
 * ---
 */

import type { MeasurementType, ProgressValue } from "./contract";
import { MAX_CAPACITY_BUILDING, MAX_CAREER_ASPIRATIONS, MIN_KPIS } from "./schema";

/** One row of the definition form. */
export interface KpiRow {
  /**
   * Client-side only, and never sent.
   *
   * React keys, DOM ids and error keys all need a stable handle on a row
   * that has no ClickUp task yet, and the array index is not one: removing
   * row 2 of 4 would slide every id up and move an error onto a different
   * KPI.
   */
  id: string;
  keyResultArea: string;
  kpi: string;
  /** Empty until chosen — it decides whether the target fields render. */
  measurementType: MeasurementType | "";
  howMeasured: string;
  targetFigure: string;
  unitOfMeasure: string;
  target: string;
  weight: string;
}

let rowSeq = 0;

/**
 * A blank row.
 *
 * The id is a counter, not `crypto.randomUUID()`: it never leaves the
 * browser, it has to be readable in a DOM id, and jsdom has no `crypto` in
 * some of the environments this is tested in.
 */
export const emptyRow = (): KpiRow => {
  rowSeq += 1;
  return {
    id: `r${rowSeq}`,
    keyResultArea: "",
    kpi: "",
    measurementType: "",
    howMeasured: "",
    targetFigure: "",
    unitOfMeasure: "",
    target: "",
    weight: "",
  };
};

/** The form opens with the minimum. Three empty rows is the ask, stated. */
export const startingRows = (): KpiRow[] =>
  Array.from({ length: MIN_KPIS }, () => emptyRow());

/** A row is quantitative until somebody says otherwise — and they must. */
export const isQuantitative = (row: Pick<KpiRow, "measurementType">): boolean =>
  row.measurementType === "Quantitative";

/**
 * A number from an input, or `null`.
 *
 * `Number("")` is 0 and `Number(" ")` is 0. Every numeric rule in this layer
 * turns on the difference between "nothing typed" and "zero typed" — a zero
 * target figure is refused outright, a zero weight is not a weight — so the
 * blank case is separated here once rather than guarded at each call site.
 */
export const parseNumber = (value: string): number | null => {
  const text = value.trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * The running weight total.
 *
 * Shown live in the footer with its delta to 100, which is the whole
 * mechanism for getting a manager to 100 without an error message: they
 * watch a number move rather than being told off after pressing Submit.
 */
export const weightTotal = (rows: KpiRow[]): number =>
  rows.reduce((total, row) => total + (parseNumber(row.weight) ?? 0), 0);

/** Mid review, per KPI. */
export interface MidRowState {
  progress: ProgressValue | "";
  notes: string;
}

/** Final review, per KPI. */
export interface FinalRowState {
  actual: string;
  /** "1".."5" as typed by the radio group; parsed where it is scored. */
  rating: string;
  comment: string;
}

export const emptyMidRow = (): MidRowState => ({ progress: "", notes: "" });

export const emptyFinalRow = (): FinalRowState => ({ actual: "", rating: "", comment: "" });

/** The talent block, final review only. Fixed-length arrays, blanks and all. */
export interface TalentState {
  capacityBuilding: string[];
  careerAspirations: string[];
  employeeComments: string;
  managerComments: string;
  panelAdjustment: string;
}

export const emptyTalent = (): TalentState => ({
  // Fixed length so each line keeps its own control and its own DOM id as
  // the others are typed into; the blanks are dropped when the payload is
  // built, not while somebody is still filling them in.
  capacityBuilding: Array.from({ length: MAX_CAPACITY_BUILDING }, () => ""),
  careerAspirations: Array.from({ length: MAX_CAREER_ASPIRATIONS }, () => ""),
  employeeComments: "",
  managerComments: "",
  panelAdjustment: "",
});

/** Non-blank lines, trimmed, in the order they were written. */
export const filledLines = (lines: string[]): string[] =>
  lines.map((line) => line.trim()).filter(Boolean);

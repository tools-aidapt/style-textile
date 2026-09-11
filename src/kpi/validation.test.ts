import { describe, expect, it } from "vitest";
import { emptyRow, emptyTalent, type FinalRowState, type KpiRow, type MidRowState } from "./form";
import { errorKey } from "./schema";
import type { AgreedKpi } from "./session";
import {
  definitionReady,
  validateDefinition,
  validateFinal,
  validateMid,
  weightDelta,
} from "./validation";

const row = (overrides: Partial<KpiRow> = {}): KpiRow => ({
  ...emptyRow(),
  keyResultArea: "Operational Efficiency",
  kpi: "Reduce line changeover time",
  measurementType: "Quantitative",
  howMeasured: "SAP changeover log, weekly average",
  targetFigure: "45",
  unitOfMeasure: "minutes",
  target: "Average changeover under 45 minutes",
  weight: "25",
  ...overrides,
});

const set = (...rows: KpiRow[]) => rows;

describe("validateDefinition", () => {
  it("passes a complete quantitative row", () => {
    expect(validateDefinition(set(row())).missing).toEqual([]);
  });

  /**
   * The rule the whole score rests on. A zero target is a division by zero
   * at the final review, three months after anybody could fix it.
   */
  it("refuses a zero target figure and says why", () => {
    const bad = row({ targetFigure: "0" });
    const { errors } = validateDefinition(set(bad));
    expect(errors[errorKey(bad.id, "targetFigure")]).toMatch(/zero cannot be scored/i);
  });

  it("requires a figure and a unit on a quantitative row", () => {
    const bad = row({ targetFigure: "", unitOfMeasure: "" });
    const { errors } = validateDefinition(set(bad));
    expect(errors[errorKey(bad.id, "targetFigure")]).toBeTruthy();
    expect(errors[errorKey(bad.id, "unitOfMeasure")]).toBeTruthy();
  });

  /**
   * `Improve communication, target 100, unit %` is the failure this
   * prevents: a qualitative KPI is not asked for either, so neither can be
   * wrong.
   */
  it("asks for neither on a qualitative row", () => {
    const qualitative = row({
      measurementType: "Qualitative",
      targetFigure: "",
      unitOfMeasure: "",
    });
    expect(validateDefinition(set(qualitative)).missing).toEqual([]);
  });

  it("caps a single KPI at 60% and floors it at 5%", () => {
    const heavy = row({ weight: "61" });
    const light = row({ weight: "4" });
    expect(validateDefinition(set(heavy)).errors[errorKey(heavy.id, "weight")]).toMatch(/60%/);
    expect(validateDefinition(set(light)).errors[errorKey(light.id, "weight")]).toMatch(/5%/);
  });

  it("refuses a KPI statement over the ClickUp task name limit", () => {
    const long = row({ kpi: "x".repeat(101) });
    expect(validateDefinition(set(long)).errors[errorKey(long.id, "kpi")]).toMatch(/100/);
  });

  it("lists the problems in reading order, so the jump lands on the first one", () => {
    const bad = row({ keyResultArea: "", kpi: "", howMeasured: "" });
    expect(validateDefinition(set(bad)).missing).toEqual([
      errorKey(bad.id, "keyResultArea"),
      errorKey(bad.id, "kpi"),
      errorKey(bad.id, "howMeasured"),
    ]);
  });
});

describe("definitionReady", () => {
  it("opens only at exactly 100%", () => {
    const at95 = set(row({ weight: "45" }), row({ weight: "25" }), row({ weight: "25" }));
    const at100 = set(row({ weight: "50" }), row({ weight: "25" }), row({ weight: "25" }));

    expect(definitionReady(at95)).toBe(false);
    expect(weightDelta(at95)).toBe(-5);
    expect(definitionReady(at100)).toBe(true);
    expect(weightDelta(at100)).toBe(0);
  });

  it("stays shut while a row is incomplete, even at 100%", () => {
    const rows = set(row({ weight: "50", target: "" }), row({ weight: "25" }), row({ weight: "25" }));
    expect(definitionReady(rows)).toBe(false);
  });
});

// --- The review -------------------------------------------------------------

const agreed = (overrides: Partial<AgreedKpi> = {}): AgreedKpi => ({
  taskId: "86a1kpi01",
  keyResultArea: "Operational Efficiency",
  kpi: "Reduce line changeover time",
  measurementType: "Quantitative",
  howMeasured: "SAP changeover log",
  targetFigure: 45,
  unitOfMeasure: "minutes",
  target: "Average changeover under 45 minutes",
  weight: 50,
  progress: null,
  midReviewNotes: null,
  ...overrides,
});

const mid = (overrides: Partial<MidRowState> = {}): MidRowState => ({
  progress: "On Track",
  notes: "",
  ...overrides,
});

const final = (overrides: Partial<FinalRowState> = {}): FinalRowState => ({
  actual: "40",
  rating: "4",
  comment: "",
  ...overrides,
});

describe("validateMid", () => {
  it("accepts On Track with no note", () => {
    const kpis = [agreed()];
    expect(validateMid(kpis, { "86a1kpi01": mid() }).missing).toEqual([]);
  });

  /** A KPI marked Off Track with no note is a shrug HR cannot act on. */
  it("requires a note at At Risk and Off Track", () => {
    const kpis = [agreed()];
    const { errors } = validateMid(kpis, { "86a1kpi01": mid({ progress: "Off Track" }) });
    expect(errors[errorKey("86a1kpi01", "notes")]).toMatch(/Off Track/);
  });

  it("requires progress on every KPI", () => {
    const kpis = [agreed(), agreed({ taskId: "b" })];
    const { missing } = validateMid(kpis, { "86a1kpi01": mid() });
    expect(missing).toEqual([errorKey("b", "progress")]);
  });
});

describe("validateFinal", () => {
  const talent = () => ({ ...emptyTalent(), managerComments: "Settled in well." });

  it("passes a complete row", () => {
    expect(
      validateFinal([agreed()], { "86a1kpi01": final() }, talent(), false).missing,
    ).toEqual([]);
  });

  /**
   * WF-26b refuses a partial final review outright, because a partial one
   * produces a wrong weighted score. The form must not be able to build one.
   */
  it("requires every KPI to be answered", () => {
    const { missing } = validateFinal(
      [agreed(), agreed({ taskId: "b" })],
      { "86a1kpi01": final() },
      talent(),
      false,
    );
    expect(missing).toContain(errorKey("b", "actual"));
    expect(missing).toContain(errorKey("b", "rating"));
  });

  it("asks for no actual on a qualitative KPI but still asks for the rating", () => {
    const kpis = [agreed({ measurementType: "Qualitative", targetFigure: null })];
    const { errors } = validateFinal(
      kpis,
      { "86a1kpi01": final({ actual: "" }) },
      talent(),
      false,
    );
    expect(errors[errorKey("86a1kpi01", "actual")]).toBeUndefined();
    expect(errors[errorKey("86a1kpi01", "rating")]).toBeUndefined();
  });

  it("requires a comment at a rating of 2 or below", () => {
    const { errors } = validateFinal(
      [agreed()],
      { "86a1kpi01": final({ rating: "2", comment: "" }) },
      talent(),
      false,
    );
    expect(errors[errorKey("86a1kpi01", "comment")]).toMatch(/2 or below/);
  });

  it("requires the manager's comments", () => {
    const { errors } = validateFinal(
      [agreed()],
      { "86a1kpi01": final() },
      emptyTalent(),
      false,
    );
    expect(errors[errorKey("talent", "managerComments")]).toBeTruthy();
  });

  it("refuses a panel adjustment that is not a number", () => {
    const { errors } = validateFinal(
      [agreed()],
      { "86a1kpi01": final() },
      { ...talent(), panelAdjustment: "a bit" },
      true,
    );
    expect(errors[errorKey("talent", "panelAdjustment")]).toBeTruthy();
  });
});

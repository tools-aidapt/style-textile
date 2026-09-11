import { describe, expect, it } from "vitest";
import {
  SCORE_CAP,
  asPercent,
  finalIndividualScore,
  qualitativeScore,
  quantitativeScore,
  scoreRow,
  totalsFor,
} from "./score";
import type { AgreedKpi } from "./session";

const kpi = (overrides: Partial<AgreedKpi> = {}): AgreedKpi => ({
  taskId: "86a1kpi01",
  keyResultArea: "Operational Efficiency",
  kpi: "Reduce line changeover time",
  measurementType: "Quantitative",
  howMeasured: "SAP changeover log",
  targetFigure: 45,
  unitOfMeasure: "minutes",
  target: "Average changeover under 45 minutes",
  weight: 40,
  progress: null,
  midReviewNotes: null,
  ...overrides,
});

describe("quantitativeScore", () => {
  it("is actual over target", () => {
    expect(quantitativeScore(40, 45)).toBeCloseTo(0.8889, 4);
  });

  it("caps at the cap — K-3, 100% for probation", () => {
    expect(quantitativeScore(54, 45)).toBe(SCORE_CAP);
  });

  /**
   * The defect in the KIL template made concrete. Every row there divides by
   * Target Figure, so the blank sheet shows #DIV/0! on every line — and a
   * KPI agreed with a zero target could never be scored at all.
   */
  it("refuses a zero target rather than dividing by it", () => {
    expect(quantitativeScore(40, 0)).toBeNull();
  });

  it("is null while the actual is unanswered", () => {
    expect(quantitativeScore(null, 45)).toBeNull();
  });
});

describe("qualitativeScore", () => {
  it("is the rating over five", () => {
    expect(qualitativeScore(4)).toBe(0.8);
    expect(qualitativeScore(5)).toBe(1);
  });

  it("refuses a rating outside 1-5", () => {
    expect(qualitativeScore(0)).toBeNull();
    expect(qualitativeScore(6)).toBeNull();
  });
});

describe("scoreRow", () => {
  /**
   * The worked example from the plan: weight 40, actual 40 against a target
   * of 45, score 0.89, weighted 35.6.
   *
   * This is also the figure that shows the plan contradicts itself. The
   * ClickUp formula in §3.1 is `Score * Weight % / 100`, which gives 0.356,
   * not the 35.6 the same document asserts. Score × Weight is implemented
   * here because it is the reading the rest of the plan depends on — see
   * the header of score.ts.
   */
  it("weights a quantitative row the way the plan's worked example does", () => {
    const scored = scoreRow(kpi(), { taskId: "86a1kpi01", actual: 40, rating: null });
    expect(scored.score).toBeCloseTo(0.8889, 4);
    expect(scored.weighted).toBeCloseTo(35.56, 2);
  });

  it("scores a qualitative row from the rating, not from the actual", () => {
    const scored = scoreRow(kpi({ measurementType: "Qualitative", targetFigure: null }), {
      taskId: "86a1kpi01",
      // A stray actual on a qualitative row must not turn into a ratio
      actual: 999,
      rating: 4,
    });
    expect(scored.score).toBe(0.8);
    expect(scored.weighted).toBe(32);
  });

  it("reports the uncapped ratio so a manager is told the cap bit", () => {
    const scored = scoreRow(kpi(), { taskId: "86a1kpi01", actual: 90, rating: null });
    expect(scored.score).toBe(1);
    expect(scored.uncapped).toBe(2);
  });
});

describe("totalsFor", () => {
  const set = [
    kpi({ taskId: "a", weight: 25 }),
    kpi({ taskId: "b", weight: 25 }),
    kpi({ taskId: "c", weight: 25 }),
    kpi({ taskId: "d", weight: 25, measurementType: "Qualitative", targetFigure: null }),
  ];

  const answered = [
    { taskId: "a", actual: 45, rating: null },
    { taskId: "b", actual: 45, rating: null },
    { taskId: "c", actual: 45, rating: null },
    { taskId: "d", actual: null, rating: 4 },
  ];

  it("totals only once every KPI is scored", () => {
    const partial = totalsFor(set, answered.slice(0, 3));
    expect(partial.complete).toBe(false);
    // A running subtotal of three rows out of four looks like a low score
    // rather than an incomplete review
    expect(partial.weighted).toBeNull();

    const whole = totalsFor(set, answered);
    expect(whole.complete).toBe(true);
    expect(whole.weighted).toBe(95);
  });

  /**
   * A voided KPI is dropped by `parseKpis` before it reaches the form, so
   * the basis it is scored out of falls with it — and the form says so.
   */
  it("scores out of the live weights, not out of 100", () => {
    const reduced = totalsFor(set.slice(1), answered.slice(1));
    expect(reduced.weightBasis).toBe(75);
    expect(reduced.weighted).toBe(70);
  });
});

describe("finalIndividualScore", () => {
  it("adds a signed panel adjustment", () => {
    expect(finalIndividualScore(82.4, 5)).toBe(87.4);
    expect(finalIndividualScore(82.4, -5)).toBe(77.4);
  });

  it("is the weighted score when there is no adjustment", () => {
    expect(finalIndividualScore(82.4, null)).toBe(82.4);
  });

  it("is null while the review is incomplete", () => {
    expect(finalIndividualScore(null, 5)).toBeNull();
  });
});

describe("asPercent", () => {
  it("renders a score as the manager reads it", () => {
    expect(asPercent(0.6667)).toBe("67%");
    expect(asPercent(null)).toBeNull();
  });
});

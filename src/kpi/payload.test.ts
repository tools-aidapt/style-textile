import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import { emptyRow, emptyTalent, type FinalRowState, type KpiRow, type MidRowState } from "./form";
import { buildDefinition, buildFinalReview, buildMidReview, localIsoTimestamp } from "./payload";
import type { AgreedKpi } from "./session";

/**
 * Both payloads are checked against the published wire schemas rather than
 * against this file's opinion of them. `additionalProperties: false` at the
 * top level means a key either builder invents is a rejection in production
 * and a failure here.
 */
const load = (path: string) => JSON.parse(readFileSync(path, "utf8")) as object;
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateDefine = ajv.compile(load("docs/kpi-definition-1.0.schema.json"));
const validateReview = ajv.compile(load("docs/kpi-review-1.0.schema.json"));

const conforms = (validate: typeof validateDefine, payload: unknown) => {
  const ok = validate(payload);
  // Surface the actual violations rather than a bare false
  return ok ? [] : (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message}`);
};

const TOKEN = "eyJmdCI6IktQSUQiLCJlaWQiOiI4NjlleGFtcGxlIn0.dGVzdC1zaWduYXR1cmUtbm90LXJlYWw";

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

const threeRows = () => [row({ weight: "50" }), row({ weight: "25" }), row({ weight: "25" })];

describe("localIsoTimestamp", () => {
  it("carries a numeric offset, never Z", () => {
    expect(localIsoTimestamp(new Date(2026, 8, 18, 14, 20, 0))).toMatch(
      /^2026-09-18T14:20:00[+-]\d{2}:\d{2}$/,
    );
  });
});

describe("buildDefinition", () => {
  it("conforms to the wire schema", () => {
    expect(conforms(validateDefine, buildDefinition({ token: TOKEN, rows: threeRows() }))).toEqual(
      [],
    );
  });

  it("sends the shape the plan specified, keyed by meaning", () => {
    const payload = buildDefinition({ token: TOKEN, rows: [row({ weight: "40" })] });
    expect(payload.kpis[0]).toEqual({
      keyResultArea: "Operational Efficiency",
      kpi: "Reduce line changeover time",
      measurementType: "Quantitative",
      howMeasured: "SAP changeover log, weekly average",
      targetFigure: 45,
      unitOfMeasure: "minutes",
      target: "Average changeover under 45 minutes",
      weight: 40,
    });
  });

  /**
   * Absent, not null and not "". ClickUp will write an empty string, and
   * "does not apply" reports differently from "left blank".
   */
  it("omits the target figure and unit on a qualitative KPI", () => {
    const payload = buildDefinition({
      token: TOKEN,
      rows: [
        row({
          measurementType: "Qualitative",
          // Typed, then switched to Qualitative: the stale figures must not
          // survive into the payload
          targetFigure: "45",
          unitOfMeasure: "minutes",
        }),
      ],
    });

    expect(payload.kpis[0]).not.toHaveProperty("targetFigure");
    expect(payload.kpis[0]).not.toHaveProperty("unitOfMeasure");
  });

  it("never sends the client-side row id", () => {
    const payload = buildDefinition({ token: TOKEN, rows: threeRows() });
    expect(JSON.stringify(payload)).not.toContain('"id"');
  });

  it("trims text", () => {
    const payload = buildDefinition({ token: TOKEN, rows: [row({ kpi: "  Reduce waste  " })] });
    expect(payload.kpis[0].kpi).toBe("Reduce waste");
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

const midRow = (overrides: Partial<MidRowState> = {}): MidRowState => ({
  progress: "On Track",
  notes: "",
  ...overrides,
});

const finalRow = (overrides: Partial<FinalRowState> = {}): FinalRowState => ({
  actual: "40",
  rating: "4",
  comment: "",
  ...overrides,
});

describe("buildMidReview", () => {
  const kpis = [agreed(), agreed({ taskId: "86a1kpi02" })];

  it("conforms to the wire schema", () => {
    const payload = buildMidReview({
      token: TOKEN,
      kpis,
      rows: {
        "86a1kpi01": midRow(),
        "86a1kpi02": midRow({ progress: "Off Track", notes: "Two slipped past the SLA." }),
      },
    });
    expect(conforms(validateReview, payload)).toEqual([]);
    expect(payload.mode).toBe("mid");
  });

  /**
   * WF-26b appends the note under a dated heading rather than overwriting,
   * so an empty string would append a heading with nothing under it — a line
   * in the audit trail saying a manager wrote nothing, which is not the same
   * as a manager who had nothing to add.
   */
  it("omits a note nobody wrote", () => {
    const payload = buildMidReview({
      token: TOKEN,
      kpis: [agreed()],
      rows: { "86a1kpi01": midRow({ notes: "   " }) },
    });
    expect(payload.kpis[0]).not.toHaveProperty("midReviewNotes");
  });

  it("carries no scoring of any kind", () => {
    const payload = buildMidReview({
      token: TOKEN,
      kpis: [agreed()],
      rows: { "86a1kpi01": midRow() },
    });
    const body = JSON.stringify(payload);
    expect(body).not.toContain("rating");
    expect(body).not.toContain("actual");
    expect(payload.talent).toBeUndefined();
  });
});

describe("buildFinalReview", () => {
  const kpis = [
    agreed(),
    agreed({ taskId: "86a1kpi02", measurementType: "Qualitative", targetFigure: null }),
  ];

  const rows = {
    "86a1kpi01": finalRow(),
    "86a1kpi02": finalRow({ actual: "", rating: "5" }),
  };

  const talent = () => ({
    ...emptyTalent(),
    capacityBuilding: ["SAP reporting", "", "Coaching on shift handovers"],
    careerAspirations: ["Production Supervisor", ""],
    managerComments: "Ready for confirmation.",
  });

  it("conforms to the wire schema", () => {
    const payload = buildFinalReview({ token: TOKEN, kpis, rows, talent: talent(), hr: false });
    expect(conforms(validateReview, payload)).toEqual([]);
    expect(payload.mode).toBe("final");
  });

  it("sends no actual on a qualitative KPI, and the rating on both", () => {
    const payload = buildFinalReview({ token: TOKEN, kpis, rows, talent: talent(), hr: false });
    const [quantitative, qualitative] = payload.kpis as unknown as Array<Record<string, unknown>>;

    expect(quantitative.actual).toBe(40);
    expect(qualitative).not.toHaveProperty("actual");
    expect(quantitative.rating).toBe(4);
    expect(qualitative.rating).toBe(5);
  });

  /**
   * The figures on screen are for the manager to see what they are
   * submitting. WF-26b computes what is stored, and `Weighted Score` is a
   * ClickUp formula that recomputes itself — two sources of truth for the
   * number a probation decision rests on is one too many.
   */
  it("sends no score, weighted score or final score", () => {
    const body = JSON.stringify(
      buildFinalReview({ token: TOKEN, kpis, rows, talent: talent(), hr: false }),
    );
    expect(body).not.toContain("score");
    expect(body).not.toContain("Score");
  });

  it("drops blank talent lines rather than sending empty strings", () => {
    const payload = buildFinalReview({ token: TOKEN, kpis, rows, talent: talent(), hr: false });
    expect(payload.talent?.capacityBuilding).toEqual([
      "SAP reporting",
      "Coaching on shift handovers",
    ]);
    expect(payload.talent?.careerAspirations).toEqual(["Production Supervisor"]);
  });

  /**
   * A zero adjustment and no adjustment are the same outcome, but only one
   * of them is a decision somebody made — and a manager never sees the
   * control at all.
   */
  it("sends a panel adjustment only for HR, and only when one was typed", () => {
    const withFigure = { ...talent(), panelAdjustment: "-5" };

    expect(
      buildFinalReview({ token: TOKEN, kpis, rows, talent: withFigure, hr: false }).talent,
    ).not.toHaveProperty("panelAdjustment");

    expect(
      buildFinalReview({ token: TOKEN, kpis, rows, talent: withFigure, hr: true }).talent
        ?.panelAdjustment,
    ).toBe(-5);

    expect(
      buildFinalReview({ token: TOKEN, kpis, rows, talent: talent(), hr: true }).talent,
    ).not.toHaveProperty("panelAdjustment");
  });
});

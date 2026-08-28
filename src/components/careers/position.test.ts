import { describe, expect, it } from "vitest";
import {
  getCustomFieldValue,
  matchesQuery,
  parsePositionFromTask,
  parsePositionsResponse,
  splitLabels,
  type ClickUpTask,
} from "./position";

const task = (over: Partial<ClickUpTask> = {}): ClickUpTask => ({
  id: "abc123",
  name: "AI Operations Lead",
  ...over,
});

describe("getCustomFieldValue", () => {
  it("matches a field name through its emoji prefix and punctuation", () => {
    const t = task({
      custom_fields: [{ name: "🎓 Educational Qualification", type: "short_text", value: "BSc" }],
    });
    expect(getCustomFieldValue(t, "Educational Qualification")).toBe("BSc");
  });

  it("resolves a dropdown selected by option id", () => {
    const t = task({
      custom_fields: [
        {
          name: "Position Type",
          type: "drop_down",
          value: "opt-2",
          type_config: {
            options: [
              { id: "opt-1", name: "Part time", orderindex: 0 },
              { id: "opt-2", name: "Full time", orderindex: 1 },
            ],
          },
        },
      ],
    });
    expect(getCustomFieldValue(t, "Position Type")).toBe("Full time");
  });

  it("resolves a dropdown selected by orderindex", () => {
    const t = task({
      custom_fields: [
        {
          name: "Position Type",
          type: "drop_down",
          value: 0,
          type_config: { options: [{ id: "opt-1", name: "Part time", orderindex: 0 }] },
        },
      ],
    });
    expect(getCustomFieldValue(t, "Position Type")).toBe("Part time");
  });

  it("joins label ids into their labels", () => {
    const t = task({
      custom_fields: [
        {
          name: "Benefits",
          type: "labels",
          value: ["l1", "l2"],
          type_config: {
            options: [
              { id: "l1", label: "Medical insurance" },
              { id: "l2", label: "Pension" },
            ],
          },
        },
      ],
    });
    expect(getCustomFieldValue(t, "Benefits")).toBe("Medical insurance, Pension");
  });

  it("returns undefined for a field the task does not carry", () => {
    expect(getCustomFieldValue(task(), "Department")).toBeUndefined();
  });
});

describe("parsePositionFromTask", () => {
  it("turns a ClickUp epoch-millisecond string into an ISO date", () => {
    const parsed = parsePositionFromTask(task({ date_created: "1704067200000" }));
    expect(parsed.datePosted).toBe("2024-01-01");
  });

  it("leaves datePosted unset when the date is missing or unparseable", () => {
    expect(parsePositionFromTask(task()).datePosted).toBeUndefined();
    expect(parsePositionFromTask(task({ date_created: "not a date" })).datePosted).toBeUndefined();
  });

  it("falls back from the Job Description field to the task description", () => {
    const parsed = parsePositionFromTask(task({ description: "From the task body" }));
    expect(parsed.description).toBe("From the task body");
  });

  it("reads location from whichever of the accepted field names exists", () => {
    const parsed = parsePositionFromTask(
      task({ custom_fields: [{ name: "Work Location", type: "short_text", value: "Karachi" }] }),
    );
    expect(parsed.location).toBe("Karachi");
  });
});

describe("parsePositionsResponse", () => {
  it("accepts the ClickUp payload passed straight through", () => {
    expect(parsePositionsResponse({ tasks: [task()] })).toHaveLength(1);
  });

  it("accepts a bare array of tasks", () => {
    expect(parsePositionsResponse([task()])).toHaveLength(1);
  });

  it("drops tasks with no id or no name rather than rendering a blank card", () => {
    const result = parsePositionsResponse([task(), task({ id: undefined }), task({ name: "" })]);
    expect(result).toHaveLength(1);
  });

  it("returns an empty list for anything unexpected", () => {
    expect(parsePositionsResponse(null)).toEqual([]);
    expect(parsePositionsResponse(undefined)).toEqual([]);
    expect(parsePositionsResponse("nope")).toEqual([]);
    expect(parsePositionsResponse({})).toEqual([]);
  });
});

describe("splitLabels", () => {
  it("splits, trims, and drops ClickUp's N/A option", () => {
    expect(splitLabels("Pension, N/A ,  Medical ")).toEqual(["Pension", "Medical"]);
  });

  it("returns an empty array for nothing", () => {
    expect(splitLabels(undefined)).toEqual([]);
    expect(splitLabels("")).toEqual([]);
  });
});

describe("matchesQuery", () => {
  const position = parsePositionFromTask(
    task({
      name: "AI Operations Lead",
      custom_fields: [{ name: "Department", type: "short_text", value: "Operations" }],
    }),
  );

  it("matches on any searchable field, case-insensitively", () => {
    expect(matchesQuery(position, "operations")).toBe(true);
    expect(matchesQuery(position, "AI")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(matchesQuery(position, "welder")).toBe(false);
  });

  it("treats a blank query as matching everything", () => {
    expect(matchesQuery(position, "   ")).toBe(true);
  });
});

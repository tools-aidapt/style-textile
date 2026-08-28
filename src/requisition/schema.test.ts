import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { testSchema } from "@/test/requisitionSchema";
import {
  CHOICE_FIELD_KEYS,
  REQUIRED_FIELD_KEYS,
  describeSchemaFault,
  isKnownOption,
  isSchemaFaulty,
  parseSchemaResponse,
  rendersAsSelect,
} from "./schema";

describe("schema faults", () => {
  it("accepts a schema that carries every key", () => {
    const fault = describeSchemaFault(testSchema());
    expect(isSchemaFaulty(fault)).toBe(false);
  });

  it("names a key the workspace does not carry", () => {
    const schema = testSchema();
    delete schema.fields.location;
    const fault = describeSchemaFault(schema);

    expect(fault.missing).toContain("location");
    expect(isSchemaFaulty(fault)).toBe(true);
  });

  it("names a choice field that carries no options", () => {
    const schema = testSchema();
    schema.fields.company = { key: "company", type: "drop_down", options: [] };

    expect(describeSchemaFault(schema).optionless).toContain("company");
  });

  it("passes through the keys n8n itself could not resolve", () => {
    const fault = describeSchemaFault(testSchema({ missingKeys: ["requisitionRaised"] }));
    expect(fault.missing).toContain("requisitionRaised");
  });

  it("does not fault a text field for having no options", () => {
    // Job grade is free text until the client supplies a grade structure
    expect(describeSchemaFault(testSchema()).optionless).not.toContain("jobGrade");
  });
});

describe("option handling", () => {
  it("renders a field as a select only once the workspace offers options", () => {
    const schema = testSchema();
    expect(rendersAsSelect(schema, "jobGrade")).toBe(false);

    schema.fields.jobGrade = {
      key: "jobGrade",
      type: "drop_down",
      options: [{ label: "G6" }],
    };
    expect(rendersAsSelect(schema, "jobGrade")).toBe(true);
  });

  it("treats an empty value as known, so an untouched field is not an error", () => {
    expect(isKnownOption(testSchema(), "company", "")).toBe(true);
    expect(isKnownOption(testSchema(), "company", "Widget Ltd")).toBe(false);
  });
});

describe("the checked-in development fixture", () => {
  // It stands in for n8n during local work, so a drift here is a broken form
  const fixture = parseSchemaResponse(
    JSON.parse(readFileSync("public/requisition-schema.sample.json", "utf8")),
  );

  it("satisfies the schema contract", () => {
    expect(describeSchemaFault(fixture)).toEqual({ missing: [], optionless: [] });
  });

  it("carries every required key and every option list", () => {
    REQUIRED_FIELD_KEYS.forEach((key) => expect(fixture.fields[key]).toBeDefined());
    CHOICE_FIELD_KEYS.forEach((key) =>
      expect(fixture.fields[key].options?.length).toBeGreaterThan(0),
    );
  });

  it("carries no ClickUp option ids — the app submits labels", () => {
    expect(JSON.stringify(fixture.fields)).not.toMatch(/"id":/);
  });

  it("keeps the Footwear entity's missing space, because the source system has it", () => {
    const labels = fixture.fields.company.options?.map((option) => option.label);
    expect(labels).toContain("Kenafric Manufacturing Limited- Footwear");
  });

  it("shows who owns each provisioning item", () => {
    const items = fixture.fields.positionRequirements.options ?? [];
    expect(items.find((o) => o.label === "Laptop/Computer/Connectivity")?.note).toBe("ICT");
    expect(items.find((o) => o.label === "Pick-up")?.note).toBe("Garage");
  });

  it("carries the two confirmed work locations", () => {
    expect(fixture.fields.location.options?.map((o) => o.label)).toEqual([
      "Nairobi, Kenya",
      "Thika, Kenya",
    ]);
  });

  it("no longer carries the fields the form stopped asking for", () => {
    // HR assigns the grade and the code; the section was noise for managers
    ["section", "jobGrade", "jobCodeNo"].forEach((key) =>
      expect(fixture.fields[key]).toBeUndefined(),
    );
  });
});

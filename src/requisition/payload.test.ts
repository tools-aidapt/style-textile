import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import { testEmployeeRecords, testPeople } from "@/test/requisitionSchema";
import { emptyValues, type RequisitionValues } from "./form";
import { buildPayload, normaliseCell, toResponsibilityMarkdown } from "./payload";
import { SCHEMA_VERSION } from "./contract";

/**
 * The payload is checked against the published wire schema rather than against
 * this file's opinion of it. `additionalProperties: false` throughout means a
 * stray key fails here exactly as it would at the webhook.
 */
const wireSchema = JSON.parse(
  readFileSync("docs/requisition-submission-1.1.schema.json", "utf8"),
);
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateWire = ajv.compile(wireSchema);

const conforms = (payload: unknown) => {
  const ok = validateWire(payload);
  // Surface the actual violations rather than a bare false
  return ok ? [] : (validateWire.errors ?? []).map((e) => `${e.instancePath} ${e.message}`);
};

const people = testPeople();
const records = testEmployeeRecords();

const values = (overrides: Partial<RequisitionValues> = {}): RequisitionValues => ({
  ...emptyValues(),
  jobTitle: "Depot Supervisor",
  company: "Kenafric Manufacturing Limited",
  department: "Sales & Distribution",
  costCentre: "Sales & Distribution",
  location: "Nairobi, Kenya",
  positionType: "Permanent",
  newOrReplacement: "New",
  totalSubPositions: "2",
  recruitmentType: ["External Recruitment"],
  requestingManager: 1001,
  reportingTo: "Regional Sales Manager",
  jobOverview: "The Depot Supervisor runs day-to-day operations at the Central region depot.",
  keyResponsibilitiesRows: [
    { id: "a", responsibility: "Manage the ledger", outcome: "Zero variance" },
    { id: "b", responsibility: "Lead dispatch", outcome: "Same-day on 95% of orders" },
    { id: "c", responsibility: "Own depot safety", outcome: "No reportable incidents" },
    { id: "d", responsibility: "", outcome: "" },
  ],
  qualifications: ["Diploma in supply chain"],
  experience: "Four years in depot operations",
  skills: ["Stock reconciliation", "SAP"],
  previousFailuresSuccesses: "The last two holders came from pure warehousing",
  competitiveAdvantage: "Full ownership of a depot from day one",
  sixMonthsObjectives: "Stock variance under 0.5%",
  potentialCareerPath: "Regional Operations Manager",
  positionRequirements: ["Laptop/Computer/Connectivity", "Pick-up"],
  assessmentStagesRequired: ["Telephone"],
  interviewPanel: [1002],
  ...overrides,
});

const build = (overrides: Partial<RequisitionValues> = {}, acknowledged = ["A-1"]) =>
  buildPayload({
    values: values(overrides),
    employees: people,
    users: people,
    employeeRecords: records,
    submissionId: "3f7c1b62-4d0a-4a1e-9b55-2c8e0a1d9f34",
    submittedAt: "2026-08-25T06:14:22.000Z",
    advisoriesAcknowledged: acknowledged,
  });

describe("wire conformance", () => {
  it("builds a payload that satisfies the v1.1 schema", () => {
    expect(conforms(build())).toEqual([]);
  });

  it("conforms with every optional left empty", () => {
    const payload = build({ othersReportingIndirectly: "", interviewPanel: [] });
    expect(conforms(payload)).toEqual([]);
    expect(payload.reporting.othersReportingIndirectly).toBeNull();
    // Removed from the form in v1.1, still written so nothing downstream meets
    // an absent property
    expect(payload.position.section).toBeNull();
    expect(payload.position.jobGrade).toBeNull();
    expect(payload.position.jobCodeNo).toBeNull();
  });

  it("conforms when an agency is involved", () => {
    const payload = build({
      recruitmentType: ["Recruitment Agency", "External Recruitment"],
      agencyName: "Talent Ltd",
    });
    expect(conforms(payload)).toEqual([]);
    expect(payload.position.agencyName).toBe("Talent Ltd");
  });

  it("conforms on a replacement linked to an employee record", () => {
    // The form stores the record's task id, so this is a lookup, not a name match
    const payload = build({
      newOrReplacement: "Replacement",
      replacingEmployee: "869e00001",
    });

    expect(conforms(payload)).toEqual([]);
    expect(payload.position.replacingEmployee).toEqual({
      clickupTaskId: "869e00001",
      displayName: "Brian Otieno",
    });
  });

  it("sends no replacement for a task id the register does not know", () => {
    const payload = build({ newOrReplacement: "Replacement", replacingEmployee: "869eZZZZZ" });
    expect(payload.position.replacingEmployee).toBeNull();
  });

  it("carries the contract preamble", () => {
    const payload = build();
    expect(payload.schemaVersion).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe("1.1");
    expect(payload.client).toEqual({ app: "kenafric-requisition-web", appVersion: "1.0.0" });
  });

  it("sends labels rather than option ids, so the app stays free of ClickUp ids", () => {
    const payload = build();
    expect(payload.position.company).toBe("Kenafric Manufacturing Limited");
    // No UUID anywhere except the submissionId, which is one by design
    const withoutSubmissionId = { ...payload, submissionId: "" };
    expect(JSON.stringify(withoutSubmissionId)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-/);
  });

  it("sends people as full user refs, not bare ids", () => {
    const payload = build();
    expect(payload.reporting.requestingManager).toEqual({
      clickupUserId: 1001,
      email: "asha@kenafric.test",
      displayName: "Asha Wanjiru",
    });
    expect(payload.hiringProcess.interviewPanel).toEqual([
      { clickupUserId: 1002, email: "brian@kenafric.test", displayName: "Brian Otieno" },
    ]);
  });

  it("takes the submitter from the requesting manager until SSO is wired", () => {
    expect(build().submitter).toEqual({
      email: "asha@kenafric.test",
      clickupUserId: 1001,
      displayName: "Asha Wanjiru",
    });
  });

  it("sends the opening count as a number and drops incomplete rows", () => {
    const payload = build();
    expect(payload.position.totalSubPositions).toBe(2);
    expect(payload.jobDescription.keyResponsibilitiesRows).toHaveLength(3);
  });

  /**
   * The workspace has one text field for each of these, and n8n writes them
   * into the job description verbatim, so how the lists serialise is part of
   * the contract rather than a presentation detail.
   */
  it("serialises the qualification list as bullet lines", () => {
    const payload = build({
      qualifications: ["Degree in supply chain", "  ", "CIPS membership"],
    });
    expect(payload.jobDescription.educationalQualification).toBe(
      "- Degree in supply chain\n- CIPS membership",
    );
  });

  it("recomposes experience and skills into the single C4 field", () => {
    const payload = build({
      experience: "  Five years in depot operations  ",
      skills: ["Stock reconciliation", "SAP"],
    });
    expect(payload.jobDescription.relevantSkillsExperienceAttributes).toBe(
      [
        "Experience",
        "Five years in depot operations",
        "",
        "Skills and attributes",
        "- Stock reconciliation",
        "- SAP",
      ].join("\n"),
    );
  });

  it("leaves out a half of C4 that was not answered", () => {
    expect(
      build({ experience: "", skills: ["SAP"] }).jobDescription
        .relevantSkillsExperienceAttributes,
    ).toBe("Skills and attributes\n- SAP");
  });

  it("drops a conditional answer whose condition is not live", () => {
    const payload = build({ replacingEmployee: "869e00001", agencyName: "Talent Ltd" });
    expect(payload.position.replacingEmployee).toBeNull();
    expect(payload.position.agencyName).toBeNull();
  });

  it("rejects a payload the schema would reject, rather than quietly passing it", () => {
    // Proves the harness has teeth: N/A is exclusive
    const payload = build({ positionRequirements: ["N/A", "Pick-up"] });
    expect(conforms(payload).length).toBeGreaterThan(0);
  });
});

describe("responsibility markdown", () => {
  it("writes the table the JD renderer parses, with the fixed header", () => {
    expect(
      toResponsibilityMarkdown([
        { id: "a", responsibility: "Manage the depot stock ledger", outcome: "Zero variance" },
      ]),
    ).toBe(
      "| Key responsibility | Outcome – indicator of success |\n|---|---|\n" +
        "| Manage the depot stock ledger | Zero variance |",
    );
  });

  it("escapes a pipe a manager types, which would otherwise break the table", () => {
    const markdown = toResponsibilityMarkdown([
      { id: "a", responsibility: "Run stores | depot", outcome: "Nothing lost" },
    ]);
    expect(markdown).toContain("Run stores \\| depot");
    expect(markdown.split("\n")[2].split(/(?<!\\)\|/)).toHaveLength(4);
  });

  it("normalises a newline in the row itself, not only in the markdown", () => {
    // n8n re-derives the table from the rows and compares; if the app flattened
    // only one of the two they would drift and every such submission would 422
    const payload = build({
      keyResponsibilitiesRows: [
        { id: "a", responsibility: "Run stores\nand the depot", outcome: "Nothing lost" },
        { id: "b", responsibility: "Lead dispatch", outcome: "Same-day" },
        { id: "c", responsibility: "Own safety", outcome: "No incidents" },
      ],
    });

    expect(payload.jobDescription.keyResponsibilitiesRows[0].responsibility).toBe(
      "Run stores and the depot",
    );
    expect(payload.jobDescription.keyResponsibilitiesMarkdown).toContain(
      "| Run stores and the depot | Nothing lost |",
    );
    expect(payload.jobDescription.keyResponsibilitiesMarkdown.split("\n")).toHaveLength(5);
    expect(conforms(payload)).toEqual([]);
  });

  it("normaliseCell collapses whitespace without touching the words", () => {
    expect(normaliseCell("  Run   stores\n  and depot  ")).toBe("Run   stores and depot");
  });
});

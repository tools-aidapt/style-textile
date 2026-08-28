import { describe, expect, it } from "vitest";
import { testPeople, testSchema } from "@/test/requisitionSchema";
import { emptyValues, type RequisitionValues } from "./form";
import { advise, unacknowledged, validate } from "./validation";

const schema = testSchema();
const people = testPeople();

/** A requisition that passes every blocking rule, for a test to break one at a time. */
const complete = (overrides: Partial<RequisitionValues> = {}): RequisitionValues => ({
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
  jobOverview: "x".repeat(200),
  keyResponsibilitiesRows: [
    { id: "a", responsibility: "Manage the ledger", outcome: "Zero variance at month end" },
    { id: "b", responsibility: "Lead dispatch", outcome: "Same-day dispatch on 95% of orders" },
    { id: "c", responsibility: "Run stock counts", outcome: "Weekly count signed off" },
  ],
  qualifications: ["Degree in supply chain"],
  experience: "Five years in depot operations",
  skills: ["Stock reconciliation", "SAP"],
  previousFailuresSuccesses: "The last holder left after six months",
  competitiveAdvantage: "Ownership of a whole region",
  sixMonthsObjectives: "y".repeat(250),
  potentialCareerPath: "Regional manager",
  positionRequirements: ["Laptop/Computer/Connectivity"],
  assessmentStagesRequired: ["Telephone", "Stage 1"],
  ...overrides,
});

describe("blocking rules", () => {
  it("passes a complete requisition", () => {
    const { errors, rowErrors } = validate(complete(), schema, people);
    expect(errors).toEqual({});
    expect(rowErrors).toEqual({});
  });

  it("B-1 · marks every missing required field", () => {
    const { errors } = validate(emptyValues(), schema, people);
    expect(errors.jobTitle).toBe("Required");
    expect(errors.company).toBe("Required");
    expect(errors.requestingManager).toBe("Required");
    expect(errors.recruitmentType).toBe("Required");
    // Optional fields are never required
    expect(errors.othersReportingIndirectly).toBeUndefined();
    expect(errors.interviewPanel).toBeUndefined();
  });

  it("B-2 · holds the job title between 3 and 80 characters", () => {
    expect(validate(complete({ jobTitle: "AB" }), schema, people).errors.jobTitle).toMatch(/3 and 80/);
    expect(validate(complete({ jobTitle: "A".repeat(81) }), schema, people).errors.jobTitle).toMatch(
      /3 and 80/,
    );
    expect(validate(complete({ jobTitle: "ABC" }), schema, people).errors.jobTitle).toBeUndefined();
  });

  it("B-3 · takes a whole number of openings between 1 and 10", () => {
    expect(validate(complete({ totalSubPositions: "0" }), schema, people).errors.totalSubPositions).toMatch(
      /between 1 and 10/,
    );
    expect(validate(complete({ totalSubPositions: "11" }), schema, people).errors.totalSubPositions).toMatch(
      /between 1 and 10/,
    );
    expect(validate(complete({ totalSubPositions: "2.5" }), schema, people).errors.totalSubPositions).toMatch(
      /whole number/,
    );
    expect(
      validate(complete({ totalSubPositions: "10" }), schema, people).errors.totalSubPositions,
    ).toBeUndefined();
  });

  it("B-4 · wants three complete responsibilities", () => {
    const rows = complete().keyResponsibilitiesRows.slice(0, 2);
    expect(
      validate(complete({ keyResponsibilitiesRows: rows }), schema, people).errors.keyResponsibilitiesRows,
    ).toMatch(/at least three/);
  });

  it("B-5 · catches a half-filled row on the row itself", () => {
    const rows = [
      ...complete().keyResponsibilitiesRows,
      { id: "d", responsibility: "Run the depot", outcome: "" },
      { id: "e", responsibility: "", outcome: "Nothing lost" },
    ];
    const { rowErrors } = validate(complete({ keyResponsibilitiesRows: rows }), schema, people);
    expect(rowErrors.d.outcome).toBe("Add the matching outcome.");
    expect(rowErrors.e.responsibility).toBe("Add the responsibility.");
    // A blank row is not half-filled, so it is not an error
    expect(rowErrors.a).toBeUndefined();
  });

  it("B-6 · caps the table at twelve rows", () => {
    const rows = Array.from({ length: 13 }, (_, i) => ({
      id: `row${i}`,
      responsibility: `Responsibility ${i}`,
      outcome: `Outcome ${i}`,
    }));
    expect(
      validate(complete({ keyResponsibilitiesRows: rows }), schema, people).errors.keyResponsibilitiesRows,
    ).toMatch(/Twelve responsibilities is the maximum/);
  });

  it("B-7 · needs an answer about what to issue, even if it is nothing", () => {
    expect(validate(complete({ positionRequirements: [] }), schema, people).errors.positionRequirements).toMatch(
      /at least one item, or N\/A/,
    );
    expect(
      validate(complete({ positionRequirements: ["N/A"] }), schema, people).errors.positionRequirements,
    ).toBeUndefined();
  });

  it("B-8 · needs at least one assessment stage", () => {
    expect(
      validate(complete({ assessmentStagesRequired: [] }), schema, people).errors.assessmentStagesRequired,
    ).toMatch(/at least one assessment stage/);
  });

  it("B-9 · requires the agency only while an agency is involved", () => {
    const withAgency = complete({ recruitmentType: ["Recruitment Agency"] });
    expect(validate(withAgency, schema, people).errors.agencyName).toBe("Name the recruitment agency.");
    expect(
      validate({ ...withAgency, agencyName: "Talent Ltd" }, schema, people).errors.agencyName,
    ).toBeUndefined();
    // Without the condition the field is not required, filled or not
    expect(validate(complete(), schema, people).errors.agencyName).toBeUndefined();
  });

  it("B-10 · requires who is being replaced only on a replacement", () => {
    const replacement = complete({ newOrReplacement: "Replacement" });
    expect(validate(replacement, schema, people).errors.replacingEmployee).toBe(
      "Select who is being replaced.",
    );
    expect(validate(complete(), schema, people).errors.replacingEmployee).toBeUndefined();
  });

  it("holds every field to the length the wire schema enforces", () => {
    // Checked here so a manager is told before a submit, not after a 422
    expect(
      validate(complete({ jobOverview: "o".repeat(4001) }), schema, people).errors.jobOverview,
    ).toMatch(/4000/);
    expect(
      validate(complete({ othersReportingIndirectly: "o".repeat(2001) }), schema, people).errors
        .othersReportingIndirectly,
    ).toMatch(/2000/);
  });

  it("holds reports-to between 2 and 120 characters", () => {
    expect(validate(complete({ reportingTo: "A" }), schema, people).errors.reportingTo).toMatch(/2 and 120/);
    expect(
      validate(complete({ reportingTo: "R".repeat(121) }), schema, people).errors.reportingTo,
    ).toMatch(/2 and 120/);
  });

  it("caps a repeater cell at 300 characters", () => {
    const rows = [
      { id: "a", responsibility: "r".repeat(301), outcome: "Fine" },
      { id: "b", responsibility: "Lead dispatch", outcome: "o".repeat(301) },
      { id: "c", responsibility: "Own safety", outcome: "No incidents" },
    ];
    const { rowErrors } = validate(complete({ keyResponsibilitiesRows: rows }), schema, people);
    expect(rowErrors.a.responsibility).toMatch(/300/);
    expect(rowErrors.b.outcome).toMatch(/300/);
  });

  it("caps the interview panel at ten", () => {
    const panel = Array.from({ length: 11 }, (_, i) => 2000 + i);
    expect(validate(complete({ interviewPanel: panel }), schema, people).errors.interviewPanel).toMatch(/10/);
  });

  it("refuses a manager with no email, because the wire requires one", () => {
    // submitter.email is a required string; it comes from the manager's record
    const noEmail = [{ ...testPeople()[0], email: null }];
    expect(validate(complete(), schema, noEmail).errors.requestingManager).toMatch(
      /no email address/i,
    );
  });

  it("B-11 · rejects a select value the workspace no longer offers", () => {
    // A restored draft can outlive the option it names
    const stale = complete({ department: "Widget Division" });
    expect(validate(stale, schema, people).errors.department).toBe("Select a value from the list.");
  });
});

describe("advisory rules", () => {
  it("A-1 · notices a cost centre that differs from the department", () => {
    const ids = advise(complete({ costCentre: "ICT" })).map((a) => a.id);
    expect(ids).toContain("A-1");
    expect(advise(complete()).map((a) => a.id)).not.toContain("A-1");
  });

  it("A-2 · notices a thin job overview", () => {
    expect(advise(complete({ jobOverview: "Runs the depot." })).map((a) => a.id)).toContain("A-2");
  });

  it("A-3 · notices thin six-month objectives", () => {
    expect(advise(complete({ sixMonthsObjectives: "Do well." })).map((a) => a.id)).toContain("A-3");
  });

  it("A-5 · is informational and needs no acknowledgement", () => {
    const advisory = advise(complete({ positionType: "Fixed Term Contract" })).find(
      (a) => a.id === "A-5",
    );
    expect(advisory?.needsAck).toBe(false);
    expect(unacknowledged(advise(complete({ positionType: "Intern" })), [])).toHaveLength(0);
  });

  it("stops standing in the way once acknowledged", () => {
    const advisories = advise(complete({ costCentre: "ICT" }));
    expect(unacknowledged(advisories, [])).toHaveLength(1);
    expect(unacknowledged(advisories, ["A-1"])).toHaveLength(0);
  });
});

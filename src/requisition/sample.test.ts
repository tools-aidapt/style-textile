import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseEmployees, parsePeople } from "./directory";
import { testEmployeesPayload, testSchema, testUsersPayload } from "@/test/requisitionSchema";
import { parseSchemaResponse, type RequisitionSchema } from "./schema";
import { advise, unacknowledged, validate } from "./validation";
import { buildPayload } from "./payload";
import { sampleValues } from "./sample";

/**
 * The sample's whole job is to produce a form a reviewer can look at and
 * submit. Which option each select lands on is what decides that — "Permanent"
 * rather than a fixed term, a cost centre matching its department, "New"
 * rather than a replacement — and every one of those is a rule that would
 * otherwise stop the submit or hold it behind an acknowledgement. Hand-checking
 * that against the rules is exactly the thing that rots.
 */

/**
 * The register serves both shapes: `people` hold a ClickUp seat and can be the
 * requesting manager, `records` are the linkable employee rows.
 */
const employeePeople = parsePeople(testEmployeesPayload());
const employeeRecords = parseEmployees(testEmployeesPayload());
const users = parsePeople(testUsersPayload());

const build = (schema: RequisitionSchema) =>
  sampleValues({ schema, employees: employeePeople, users });

describe("sampleValues", () => {
  const schema = testSchema();
  const values = build(schema);

  it("passes every blocking rule", () => {
    const { errors, rowErrors } = validate(values, schema, employeePeople);
    expect(errors).toEqual({});
    expect(rowErrors).toEqual({});
  });

  it("leaves no advisory standing in the way of a submit", () => {
    expect(unacknowledged(advise(values), [])).toEqual([]);
  });

  it("names people the directory actually returned", () => {
    expect(employeePeople.map((p) => p.clickupUserId)).toContain(values.requestingManager);
    expect(users.map((p) => p.name)).toContain(values.reportingTo);
    values.interviewPanel.forEach((id) => {
      expect(users.map((p) => p.clickupUserId)).toContain(id);
    });
  });

  it("picks a requesting manager who has an email, because the wire requires one", () => {
    const manager = employeePeople.find((p) => p.clickupUserId === values.requestingManager);
    expect(manager?.email).toBeTruthy();
  });

  it("builds a payload, so the sample exercises the real submit path", () => {
    const payload = buildPayload({
      values,
      employees: employeePeople,
      users,
      employeeRecords,
      submissionId: "00000000-0000-4000-8000-000000000000",
      submittedAt: "2026-08-28T00:00:00.000Z",
      advisoriesAcknowledged: [],
    });
    expect(payload.jobDescription.keyResponsibilitiesRows.length).toBeGreaterThanOrEqual(3);
    expect(payload.jobDescription.educationalQualification).toContain("- ");
    expect(payload.jobDescription.relevantSkillsExperienceAttributes).toContain("Experience");
  });

  it("is recognisable as a sample, so one raised by accident is not plausible", () => {
    expect(values.jobTitle).toMatch(/sample/i);
  });

  /**
   * The workspace's real schema, not the test double. HR renames entities and
   * adds departments; the sample reads its choices from whatever was served,
   * so the fixture the app ships has to work too.
   */
  it("passes against the shipped workspace schema fixture", () => {
    const fixture = JSON.parse(
      readFileSync("public/requisition-schema.sample.json", "utf8"),
    ) as unknown;
    const parsed = parseSchemaResponse(fixture);
    expect(Object.keys(parsed.fields).length).toBeGreaterThan(0);

    const real = build(parsed);
    const { errors, rowErrors } = validate(real, parsed, employeePeople);
    expect(errors).toEqual({});
    expect(rowErrors).toEqual({});
    expect(unacknowledged(advise(real), [])).toEqual([]);
  });
});

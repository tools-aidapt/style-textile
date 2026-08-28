/**
 * Turns form state into a submission.
 *
 * The shape is fixed by the published wire schema and validated with
 * `additionalProperties: false`, so this builder writes every property the
 * schema lists — including the ones whose value is `null`. See contract.ts.
 */

import {
  APP_VERSION,
  CLIENT_APP,
  SCHEMA_VERSION,
  type EmployeeRef,
  type RequisitionSubmission,
  type UserRef,
} from "./contract";
import { submittableRows } from "./validation";
import { filledItems, type RequisitionValues, type ResponsibilityRow } from "./form";
import {
  employeeByTaskId,
  personById,
  type DirectoryPerson,
  type EmployeeRecord,
} from "./directory";

/**
 * A pipe would break the table the JD renderer parses, and a newline would
 * split one row across two lines. Both are normalised on the row itself rather
 * than only in the markdown: n8n re-derives the table from the rows and
 * compares, so the two have to agree or the submission is a 422.
 */
export const normaliseCell = (value: string): string =>
  value.replace(/\s*\r?\n\s*/g, " ").trim();

const escapeCell = (value: string): string => normaliseCell(value).replace(/\|/g, "\\|");

/** Fixed text — the JD renderer matches on it. */
export const RESPONSIBILITY_HEADER = "| Key responsibility | Outcome – indicator of success |";

export const toResponsibilityMarkdown = (rows: ResponsibilityRow[]): string => {
  const body = submittableRows(rows).map(
    (row) => `| ${escapeCell(row.responsibility)} | ${escapeCell(row.outcome)} |`,
  );
  return [RESPONSIBILITY_HEADER, "|---|---|", ...body].join("\n");
};

const orNull = (value: string | null | undefined): string | null => {
  const trimmed = String(value ?? "").trim();
  return trimmed === "" ? null : trimmed;
};

/** People come from the two directory endpoints, not from the form schema. */
const userRef = (person: DirectoryPerson): UserRef => ({
  clickupUserId: person.clickupUserId,
  email: person.email,
  displayName: person.name,
});

/**
 * A replacement is a link to an employee record. The form stores the record's
 * task id, so this is a lookup rather than a name match.
 */
const replacementOf = (records: EmployeeRecord[], taskId: string): EmployeeRef | null => {
  const record = employeeByTaskId(records, taskId);
  return record ? { clickupTaskId: record.clickupTaskId, displayName: record.name } : null;
};

/**
 * A list field, as the job description will carry it.
 *
 * Hyphen bullets rather than bare lines: the public role page renders a run of
 * bullet lines as a real list, and a plain newline-joined block as one
 * paragraph. The ClickUp field is a text field either way, so the list has to
 * survive as text.
 */
const toBulletList = (items: string[]): string =>
  filledItems(items)
    .map((item) => `- ${item}`)
    .join("\n");

/**
 * C4, recomposed.
 *
 * The workspace has one field for skills, experience and attributes; the form
 * asks the two questions separately because they were being answered as a
 * single run-on paragraph. The headings are what let a reader tell the answers
 * apart once they are back in one field.
 */
const toSkillsText = (experience: string, skills: string[]): string => {
  const parts: string[] = [];
  const years = experience.trim();
  if (years) parts.push(`Experience\n${years}`);
  const list = toBulletList(skills);
  if (list) parts.push(`Skills and attributes\n${list}`);
  return parts.join("\n\n");
};

export const buildPayload = ({
  values,
  employees,
  users,
  employeeRecords,
  submissionId,
  submittedAt,
  advisoriesAcknowledged,
}: {
  values: RequisitionValues;
  /** The employee register — where the requesting manager comes from. */
  employees: DirectoryPerson[];
  /** The user list — where the interview panel comes from. */
  users: DirectoryPerson[];
  /** The employee register, for the record a replacement links to. */
  employeeRecords: EmployeeRecord[];
  submissionId: string;
  submittedAt: string;
  advisoriesAcknowledged: string[];
}): RequisitionSubmission => {
  // TODO(sso): the submitter is inferred from the requesting manager because
  // the org SSO session is not wired up yet. Once it is, take the identity from
  // the session and verify the manager picker against it server-side.
  const manager = personById(employees, values.requestingManager);
  const managerRef: UserRef = manager
    ? userRef(manager)
    : { clickupUserId: 0, email: null, displayName: null };

  const panel = users
    .filter((person) => values.interviewPanel.includes(person.clickupUserId))
    .map(userRef);

  return {
    schemaVersion: SCHEMA_VERSION,
    submissionId,
    submittedAt,
    client: { app: CLIENT_APP, appVersion: APP_VERSION },
    submitter: {
      email: manager?.email ?? "",
      clickupUserId: manager?.clickupUserId ?? null,
      displayName: manager?.name ?? null,
    },
    position: {
      jobTitle: values.jobTitle.trim(),
      company: values.company,
      department: values.department,
      // Removed from the form in v1.1 — HR fills these in
      section: null,
      costCentre: values.costCentre,
      location: values.location,
      jobGrade: null,
      jobCodeNo: null,
      positionType: values.positionType,
      newOrReplacement: values.newOrReplacement,
      replacingEmployee:
        values.newOrReplacement === "Replacement"
          ? replacementOf(employeeRecords, values.replacingEmployee)
          : null,
      totalSubPositions: Number(values.totalSubPositions),
      recruitmentType: values.recruitmentType,
      agencyName: values.recruitmentType.includes("Recruitment Agency")
        ? orNull(values.agencyName)
        : null,
    },
    reporting: {
      requestingManager: managerRef,
      reportingTo: values.reportingTo.trim(),
      othersReportingIndirectly: orNull(values.othersReportingIndirectly),
    },
    jobDescription: {
      jobOverview: values.jobOverview.trim(),
      keyResponsibilitiesRows: submittableRows(values.keyResponsibilitiesRows).map((row) => ({
        responsibility: normaliseCell(row.responsibility),
        outcome: normaliseCell(row.outcome),
      })),
      keyResponsibilitiesMarkdown: toResponsibilityMarkdown(values.keyResponsibilitiesRows),
      educationalQualification: toBulletList(values.qualifications),
      relevantSkillsExperienceAttributes: toSkillsText(values.experience, values.skills),
    },
    businessCase: {
      previousFailuresSuccesses: values.previousFailuresSuccesses.trim(),
      competitiveAdvantage: values.competitiveAdvantage.trim(),
      sixMonthsObjectives: values.sixMonthsObjectives.trim(),
      potentialCareerPath: values.potentialCareerPath.trim(),
    },
    provisioning: { positionRequirements: values.positionRequirements },
    hiringProcess: {
      assessmentStagesRequired: values.assessmentStagesRequired,
      interviewPanel: panel,
    },
    advisoriesAcknowledged,
  };
};

/**
 * Maps a server issue's dot-path back to the field that produced it, so a 422
 * lands on the control rather than in a banner. Paths the app has no field for
 * fall through to the caller, which shows them whole.
 */
export const FIELD_BY_PATH: Record<string, keyof RequisitionValues> = {
  "position.jobTitle": "jobTitle",
  "position.company": "company",
  "position.department": "department",
  "position.costCentre": "costCentre",
  "position.location": "location",
  "position.positionType": "positionType",
  "position.newOrReplacement": "newOrReplacement",
  "position.replacingEmployee": "replacingEmployee",
  "position.totalSubPositions": "totalSubPositions",
  "position.recruitmentType": "recruitmentType",
  "position.agencyName": "agencyName",
  "reporting.requestingManager": "requestingManager",
  "reporting.reportingTo": "reportingTo",
  "reporting.othersReportingIndirectly": "othersReportingIndirectly",
  "jobDescription.jobOverview": "jobOverview",
  "jobDescription.keyResponsibilitiesRows": "keyResponsibilitiesRows",
  "jobDescription.keyResponsibilitiesMarkdown": "keyResponsibilitiesRows",
  "jobDescription.educationalQualification": "qualifications",
  "jobDescription.relevantSkillsExperienceAttributes": "experience",
  "businessCase.previousFailuresSuccesses": "previousFailuresSuccesses",
  "businessCase.competitiveAdvantage": "competitiveAdvantage",
  "businessCase.sixMonthsObjectives": "sixMonthsObjectives",
  "businessCase.potentialCareerPath": "potentialCareerPath",
  "provisioning.positionRequirements": "positionRequirements",
  "hiringProcess.assessmentStagesRequired": "assessmentStagesRequired",
  "hiringProcess.interviewPanel": "interviewPanel",
};

/** `position.recruitmentType[1]` and `position.recruitmentType` are the same field. */
export const fieldForPath = (path: string): keyof RequisitionValues | undefined =>
  FIELD_BY_PATH[path.replace(/\[\d+\].*$/, "")] ?? FIELD_BY_PATH[path];

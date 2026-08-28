/**
 * Two tiers of validation.
 *
 * **Blocking** stops submission. **Advisory** warns and lets the manager submit
 * anyway — because a rejected submission means retyping four long-text fields,
 * and the next requisition arrives by email instead of through this form.
 */

import { LIMITS } from "./contract";
import {
  MAX_LIST_ITEMS,
  MAX_LIST_ITEM_LENGTH,
  MAX_ROWS,
  MIN_ROWS,
  completeRows,
  filledItems,
  needsAgencyName,
  needsReplacingEmployee,
  type FieldKey,
  type RequisitionValues,
  type ResponsibilityRow,
} from "./form";
import { personById, type DirectoryPerson } from "./directory";
import { isKnownOption, type RequisitionSchema } from "./schema";

export type FieldErrors = Partial<Record<FieldKey, string>>;

/** Keyed by row id, so reordering rows carries their errors with them. */
export type RowErrors = Record<string, { responsibility?: string; outcome?: string }>;

export interface ValidationResult {
  errors: FieldErrors;
  rowErrors: RowErrors;
}

const REQUIRED = "Required";

/** Selects whose value must be one the workspace actually offers (B-11). */
const CHOICE_FIELDS: FieldKey[] = [
  "company",
  "department",
  "costCentre",
  "location",
  "positionType",
  "newOrReplacement",
];

const blank = (value: string | null | undefined) => !String(value ?? "").trim();

export const validate = (
  values: RequisitionValues,
  schema: RequisitionSchema,
  /** The employee register, for the rule that the submitter needs an email. */
  employees: DirectoryPerson[] = [],
): ValidationResult => {
  const errors: FieldErrors = {};
  const rowErrors: RowErrors = {};

  // B-1 · every required field carries a value
  const requiredText: FieldKey[] = [
    "jobTitle",
    "company",
    "department",
    "costCentre",
    "location",
    "positionType",
    "newOrReplacement",
    "totalSubPositions",
    "reportingTo",
    "jobOverview",
    "experience",
    "previousFailuresSuccesses",
    "competitiveAdvantage",
    "sixMonthsObjectives",
    "potentialCareerPath",
  ];
  requiredText.forEach((key) => {
    if (blank(values[key] as string)) errors[key] = REQUIRED;
  });
  if (values.requestingManager === null) errors.requestingManager = REQUIRED;
  if (values.recruitmentType.length === 0) errors.recruitmentType = REQUIRED;

  // B-2 · job title length
  const title = values.jobTitle.trim();
  if (title && (title.length < 3 || title.length > 80)) {
    errors.jobTitle = "Job title must be between 3 and 80 characters.";
  }

  // B-3 · how many people
  const openings = values.totalSubPositions.trim();
  if (openings && (!/^\d+$/.test(openings) || Number(openings) < 1 || Number(openings) > 10)) {
    errors.totalSubPositions = "Enter a whole number between 1 and 10.";
  }

  // B-4 to B-6 · the responsibility repeater
  const rows = values.keyResponsibilitiesRows;
  rows.forEach((row) => {
    const responsibility = row.responsibility.trim();
    const outcome = row.outcome.trim();
    // B-5 · a half-filled row is the most common failure and the one that
    // makes a JD useless, so it is caught per row rather than in the summary
    if (responsibility && !outcome) rowErrors[row.id] = { outcome: "Add the matching outcome." };
    if (!responsibility && outcome) {
      rowErrors[row.id] = { responsibility: "Add the responsibility." };
    }
    // Both cells are capped on the wire
    const cap = LIMITS.responsibilityCell.max;
    if (responsibility.length > cap) {
      rowErrors[row.id] = { ...rowErrors[row.id], responsibility: `Keep this under ${cap} characters.` };
    }
    if (outcome.length > cap) {
      rowErrors[row.id] = { ...rowErrors[row.id], outcome: `Keep this under ${cap} characters.` };
    }
  });
  if (completeRows(rows).length < MIN_ROWS) {
    errors.keyResponsibilitiesRows = "Add at least three responsibilities, each with an outcome.";
  } else if (rows.length > MAX_ROWS) {
    errors.keyResponsibilitiesRows = "Twelve responsibilities is the maximum. Combine the closest two.";
  }

  // B-7 · something has to be issued, even if the answer is nothing
  if (values.positionRequirements.length === 0) {
    errors.positionRequirements = "Select at least one item, or N/A if nothing is needed.";
  }

  // B-8 · assessment stages
  if (values.assessmentStagesRequired.length === 0) {
    errors.assessmentStagesRequired = "Select at least one assessment stage.";
  }

  // B-9 and B-10 · the conditional fields, required only while they are shown
  if (needsAgencyName(values) && blank(values.agencyName)) {
    errors.agencyName = "Name the recruitment agency.";
  }
  if (needsReplacingEmployee(values) && blank(values.replacingEmployee)) {
    errors.replacingEmployee = "Select who is being replaced.";
  }

  // The wire schema enforces every length below. Checking them here means a
  // manager is told before a submit rather than after a 422.
  const tooLong = (key: FieldKey, max: number) => {
    const value = String(values[key] ?? "").trim();
    if (value.length > max) errors[key] = `Please keep this under ${max} characters.`;
  };
  tooLong("location", LIMITS.location.max);
  tooLong("agencyName", LIMITS.agencyName.max);
  tooLong("othersReportingIndirectly", LIMITS.othersReportingIndirectly.max);
  (
    [
      "jobOverview",
      "experience",
      "previousFailuresSuccesses",
      "competitiveAdvantage",
      "sixMonthsObjectives",
      "potentialCareerPath",
    ] as FieldKey[]
  ).forEach((key) => tooLong(key, LIMITS.longText.max));

  /**
   * C3 and the skills half of C4 are lists.
   *
   * An entry longer than a line is a paragraph that has been pasted into the
   * wrong control, and it will read as one in the job description — so the cap
   * is named rather than silently truncated on submit.
   */
  (["qualifications", "skills"] as const).forEach((key) => {
    const items = filledItems(values[key]);
    if (items.length === 0) {
      errors[key] = REQUIRED;
      return;
    }
    if (items.length > MAX_LIST_ITEMS) {
      errors[key] = `${MAX_LIST_ITEMS} is the maximum.`;
      return;
    }
    if (items.some((item) => item.length > MAX_LIST_ITEM_LENGTH)) {
      errors[key] = `Keep each one under ${MAX_LIST_ITEM_LENGTH} characters — one line, not a paragraph.`;
    }
  });

  const reportsTo = values.reportingTo.trim();
  if (reportsTo && (reportsTo.length < LIMITS.reportingTo.min || reportsTo.length > LIMITS.reportingTo.max)) {
    errors.reportingTo = `Line manager must be between ${LIMITS.reportingTo.min} and ${LIMITS.reportingTo.max} characters.`;
  }

  if (values.interviewPanel.length > LIMITS.interviewPanel.max) {
    errors.interviewPanel = `A panel of ${LIMITS.interviewPanel.max} is the maximum.`;
  }

  // The submitter's email is a required string on the wire, and it comes from
  // the manager's ClickUp record until SSO is wired
  const manager = personById(employees, values.requestingManager);
  if (manager && !manager.email) {
    errors.requestingManager =
      "That account has no email address in ClickUp. Pick another manager, or ask HR to add one.";
  }

  // B-11 · a restored draft can outlive the option it names
  CHOICE_FIELDS.forEach((key) => {
    const value = values[key] as string;
    if (value && !isKnownOption(schema, key, value)) {
      errors[key] = "Select a value from the list.";
    }
  });

  return { errors, rowErrors };
};

export interface Advisory {
  id: string;
  message: string;
  field?: FieldKey;
  /** Informational advisories need no acknowledgement — they just say a thing. */
  needsAck: boolean;
  /** A-6 carries a link to the requisition it collided with. */
  href?: string;
}

/**
 * Advisories the app can work out for itself. A-6 comes from the server, and
 * arrives alongside a successful submission rather than blocking one.
 */
export const advise = (values: RequisitionValues): Advisory[] => {
  const advisories: Advisory[] = [];

  // A-1 · the cost may legitimately sit elsewhere, so this is a confirm, not a stop
  if (values.costCentre && values.department && values.costCentre !== values.department) {
    advisories.push({
      id: "A-1",
      field: "costCentre",
      needsAck: true,
      message: "Cost centre differs from department. That's sometimes correct — confirm before submitting.",
    });
  }

  if (values.jobOverview.trim() && values.jobOverview.trim().length < 150) {
    advisories.push({
      id: "A-2",
      field: "jobOverview",
      needsAck: true,
      message: "This is short for a job description. Two or three sentences works better.",
    });
  }

  if (values.sixMonthsObjectives.trim() && values.sixMonthsObjectives.trim().length < 200) {
    advisories.push({
      id: "A-3",
      field: "sixMonthsObjectives",
      needsAck: true,
      message: "The new joiner reads this in week one. A little more detail helps them.",
    });
  }

  if (values.positionType === "Fixed Term Contract" || values.positionType === "Intern") {
    advisories.push({
      id: "A-5",
      field: "positionType",
      needsAck: false,
      message: "HR will need a contract end date at offer stage.",
    });
  }

  return advisories;
};

/** Which advisories still stand in the way of a submit. */
export const unacknowledged = (advisories: Advisory[], acknowledged: string[]): Advisory[] =>
  advisories.filter((advisory) => advisory.needsAck && !acknowledged.includes(advisory.id));

/** Rows that would be submitted — blank rows are dropped, not sent as empties. */
export const submittableRows = (rows: ResponsibilityRow[]): ResponsibilityRow[] => completeRows(rows);

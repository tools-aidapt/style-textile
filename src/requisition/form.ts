/**
 * The requisition's shape, in one place.
 *
 * Labels and help text live here rather than in the components, because four
 * things need them and must agree: the field itself, the sticky rail, the
 * review block, and the submit-time error summary. Section order is the
 * Kenafric job description's own order and is not rearranged for form
 * ergonomics — sections A to C become the official JD verbatim.
 */

export type SectionId =
  | "identity"
  | "reporting"
  | "jobDescription"
  | "businessCase"
  | "provisioning"
  | "hiringProcess";

export interface SectionSpec {
  id: SectionId;
  /** The letter the JD template uses. Managers refer to sections by it. */
  letter: string;
  title: string;
  intro?: string;
}

export const SECTIONS: SectionSpec[] = [
  { id: "identity", letter: "A", title: "Position identity" },
  { id: "reporting", letter: "B", title: "Reporting lines" },
  {
    id: "jobDescription",
    letter: "C",
    title: "Job description",
    intro:
      "This section becomes the official job description, so write it as you would the JD form.",
  },
  { id: "businessCase", letter: "D", title: "Business case" },
  { id: "provisioning", letter: "E", title: "Items to be issued to the new joiner" },
  { id: "hiringProcess", letter: "F", title: "Hiring process" },
];

/** One row of the key-responsibility table. `id` is local, for React keys. */
export interface ResponsibilityRow {
  id: string;
  responsibility: string;
  outcome: string;
}

export interface RequisitionValues {
  // A · Position identity
  jobTitle: string;
  company: string;
  department: string;
  costCentre: string;
  location: string;
  positionType: string;
  newOrReplacement: string;
  totalSubPositions: string;
  recruitmentType: string[];
  agencyName: string;
  replacingEmployee: string;
  // B · Reporting lines
  requestingManager: number | null;
  reportingTo: string;
  othersReportingIndirectly: string;
  // C · Job description
  jobOverview: string;
  keyResponsibilitiesRows: ResponsibilityRow[];
  qualifications: string[];
  experience: string;
  skills: string[];
  // D · Business case
  previousFailuresSuccesses: string;
  competitiveAdvantage: string;
  sixMonthsObjectives: string;
  potentialCareerPath: string;
  // E · Provisioning
  positionRequirements: string[];
  // F · Hiring process
  assessmentStagesRequired: string[];
  interviewPanel: number[];
}

export type FieldKey = keyof RequisitionValues;

export interface FieldSpec {
  key: FieldKey;
  /** The JD template's own reference — A1, C2 — shown beside the label. */
  ref: string;
  label: string;
  help?: string;
  section: SectionId;
  required: boolean;
  /** Conditional fields only count once their condition is live. */
  conditional?: boolean;
}

export const FIELDS: FieldSpec[] = [
  // ---- A · Position identity -------------------------------------------
  {
    key: "jobTitle",
    ref: "A1",
    label: "Job title",
    help: "The title as it should appear on the job description and the advert",
    section: "identity",
    required: true,
  },
  {
    key: "company",
    ref: "A2",
    label: "Company",
    help: "The legal entity that will employ this person",
    section: "identity",
    required: true,
  },
  { key: "department", ref: "A3", label: "Department", section: "identity", required: true },
  {
    key: "costCentre",
    ref: "A5",
    label: "Cost centre",
    help: "Usually the same as department. Change it only if the cost sits elsewhere",
    section: "identity",
    required: true,
  },
  {
    key: "location",
    ref: "A6",
    label: "Work location",
    help: "The site this person reports to",
    section: "identity",
    required: true,
  },
  { key: "positionType", ref: "A9", label: "Position type", section: "identity", required: true },
  {
    key: "newOrReplacement",
    ref: "A10",
    label: "New or replacement",
    section: "identity",
    required: true,
  },
  {
    key: "totalSubPositions",
    ref: "A11",
    label: "How many people",
    help: "One requisition can cover several identical openings",
    section: "identity",
    required: true,
  },
  {
    key: "recruitmentType",
    ref: "A12",
    label: "Recruitment type",
    section: "identity",
    required: true,
  },
  {
    key: "agencyName",
    ref: "A12a",
    label: "Agency name",
    section: "identity",
    required: true,
    conditional: true,
  },
  {
    key: "replacingEmployee",
    ref: "A10a",
    label: "Who is being replaced",
    section: "identity",
    required: true,
    conditional: true,
  },

  // ---- B · Reporting lines ---------------------------------------------
  {
    key: "requestingManager",
    ref: "B1",
    label: "Requesting manager",
    help: "Defaults to you",
    section: "reporting",
    required: true,
  },
  {
    key: "reportingTo",
    ref: "B2",
    label: "Line manager",
    help: "The person this role reports into",
    section: "reporting",
    required: true,
  },
  {
    key: "othersReportingIndirectly",
    ref: "B3",
    label: "Others reporting indirectly",
    help: "Roles that report to this person through someone else",
    section: "reporting",
    required: false,
  },

  // ---- C · Job description ---------------------------------------------
  {
    key: "jobOverview",
    ref: "C1",
    label: "Job overview",
    help: "Two or three sentences on why this role exists and what it owns",
    section: "jobDescription",
    required: true,
  },
  {
    key: "keyResponsibilitiesRows",
    ref: "C2",
    label: "Key responsibilities and outcomes",
    help: "Each responsibility needs an outcome someone could measure",
    section: "jobDescription",
    required: true,
  },
  {
    key: "qualifications",
    ref: "C3",
    label: "Academic and professional qualifications",
    help: "One per line. Minimum qualification first, then any professional membership or certification",
    section: "jobDescription",
    required: true,
  },
  /*
   * C4 is ONE ClickUp field, asked as two.
   *
   * The JD template — and the workspace — carry a single "relevant skills,
   * experience and attributes" text field, and the schema check refuses to
   * open this form if a field it writes to does not exist, so a third ClickUp
   * field cannot be invented here. Experience and skills are therefore asked
   * separately, because they are different questions and were being answered
   * as one run-on paragraph, and `payload.ts` composes the two answers back
   * into the single C4 string. Both carry ref C4 because both are C4.
   */
  {
    key: "experience",
    ref: "C4",
    label: "Relevant experience",
    help: "Years and the kind of environment it has to have been in",
    section: "jobDescription",
    required: true,
  },
  {
    key: "skills",
    ref: "C4",
    label: "Skills and attributes",
    help: "One per line. Technical skills, and the attributes that matter in this team",
    section: "jobDescription",
    required: true,
  },

  // ---- D · Business case -----------------------------------------------
  {
    key: "previousFailuresSuccesses",
    ref: "D1",
    label: "What has worked or failed in this role before",
    help: "Helps us screen for the right profile rather than the obvious one",
    section: "businessCase",
    required: true,
  },
  {
    key: "competitiveAdvantage",
    ref: "D2",
    label: "Why would a strong candidate want this role",
    help: "Used in the advert and the candidate pitch",
    section: "businessCase",
    required: true,
  },
  {
    key: "sixMonthsObjectives",
    ref: "D3",
    label: "What must this person achieve in six months",
    help: "Sent to the new joiner and their manager in week one, so write it for them to read",
    section: "businessCase",
    required: true,
  },
  {
    key: "potentialCareerPath",
    ref: "D4",
    label: "Where could this role lead",
    help: "Also sent to them in week one",
    section: "businessCase",
    required: true,
  },

  // ---- E · Provisioning -------------------------------------------------
  {
    key: "positionRequirements",
    ref: "E1",
    label: "Items to be issued on day one",
    help: "Tick everything this role needs on day one. Only the departments you tick will be asked to prepare anything",
    section: "provisioning",
    required: true,
  },

  // ---- F · Hiring process ----------------------------------------------
  {
    key: "assessmentStagesRequired",
    ref: "F1",
    label: "Assessment stages required",
    help: "Governs which interview stages apply to this role",
    section: "hiringProcess",
    required: true,
  },
  {
    key: "interviewPanel",
    ref: "F2",
    label: "Proposed interview panel",
    help: "Propose who should interview. HR will confirm. Everyone here gets the calendar invites",
    section: "hiringProcess",
    required: false,
  },
];

export const fieldSpec = (key: FieldKey): FieldSpec =>
  FIELDS.find((field) => field.key === key) as FieldSpec;

/** The DOM id a field's control carries, so errors and rail links can find it. */
export const fieldId = (key: FieldKey): string => `req-${key}`;

let rowSeq = 0;
export const emptyRow = (): ResponsibilityRow => ({
  id: `row-${(rowSeq += 1)}`,
  responsibility: "",
  outcome: "",
});

export const MIN_ROWS = 3;
export const MAX_ROWS = 12;

/** N/A is mutually exclusive with every other provisioning item. */
export const NOT_APPLICABLE = "N/A";

export const emptyValues = (): RequisitionValues => ({
  jobTitle: "",
  company: "",
  department: "",
  costCentre: "",
  location: "",
  positionType: "",
  newOrReplacement: "",
  totalSubPositions: "1",
  recruitmentType: [],
  agencyName: "",
  replacingEmployee: "",
  requestingManager: null,
  reportingTo: "",
  othersReportingIndirectly: "",
  jobOverview: "",
  keyResponsibilitiesRows: [emptyRow(), emptyRow(), emptyRow()],
  qualifications: [""],
  experience: "",
  skills: [""],
  previousFailuresSuccesses: "",
  competitiveAdvantage: "",
  sixMonthsObjectives: "",
  potentialCareerPath: "",
  positionRequirements: [],
  assessmentStagesRequired: [],
  interviewPanel: [],
});

/** Conditional rule 2 — an agency has to be named once one is involved. */
export const needsAgencyName = (values: RequisitionValues): boolean =>
  values.recruitmentType.includes("Recruitment Agency");

/** Conditional rule 3 — a replacement has someone it replaces. */
export const needsReplacingEmployee = (values: RequisitionValues): boolean =>
  values.newOrReplacement === "Replacement";

/** Conditional rule 1 — several openings on one requisition. */
export const coversSeveralOpenings = (values: RequisitionValues): boolean =>
  Number(values.totalSubPositions) > 1;

export const isFieldActive = (key: FieldKey, values: RequisitionValues): boolean => {
  if (key === "agencyName") return needsAgencyName(values);
  if (key === "replacingEmployee") return needsReplacingEmployee(values);
  return true;
};

export const completeRows = (rows: ResponsibilityRow[]): ResponsibilityRow[] =>
  rows.filter((row) => row.responsibility.trim() && row.outcome.trim());

/** Has the manager put anything in this field yet? Drives the rail, not validity. */
/** How many list fields there can be. Generous, but not a document. */
export const MAX_LIST_ITEMS = 12;

/** The longest a single list entry may be. One line, not a paragraph. */
export const MAX_LIST_ITEM_LENGTH = 240;

/**
 * A list field's real content.
 *
 * These lists start with one empty row so there is something to type into, and
 * an empty row is not an answer — every check has to look past it.
 */
export const filledItems = (items: string[]): string[] =>
  items.map((item) => item.trim()).filter(Boolean);

export const hasValue = (key: FieldKey, values: RequisitionValues): boolean => {
  const value = values[key];
  if (key === "keyResponsibilitiesRows")
    return completeRows(value as ResponsibilityRow[]).length > 0;
  // A list of one blank row is what an untouched list field looks like
  if (Array.isArray(value))
    return value.every((item) => typeof item === "string")
      ? filledItems(value as string[]).length > 0
      : value.length > 0;
  if (value === null || value === undefined) return false;
  return String(value).trim() !== "";
};

export type SectionState = "untouched" | "in-progress" | "complete" | "has-errors";

/**
 * Per-section state for the sticky rail. Deliberately not a percentage: a bar
 * invites managers to game the number rather than answer the question.
 */
export const sectionState = (
  section: SectionId,
  values: RequisitionValues,
  errors: Partial<Record<FieldKey, string>>,
): SectionState => {
  const fields = FIELDS.filter((f) => f.section === section && isFieldActive(f.key, values));
  if (fields.some((f) => errors[f.key])) return "has-errors";

  const required = fields.filter((f) => f.required);
  const touched = fields.filter((f) => hasValue(f.key, values));
  if (touched.length === 0) return "untouched";
  return required.every((f) => hasValue(f.key, values)) ? "complete" : "in-progress";
};

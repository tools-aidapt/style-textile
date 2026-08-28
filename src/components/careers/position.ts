/**
 * Positions come from an n8n webhook that holds the ClickUp credential and
 * reads the "Positions" list filtered to status "live". A requisition only
 * reaches "live" after HR review plus HR head and director approval, so no
 * approval filtering happens here.
 *
 * Commercially confidential fields are stripped server-side in n8n, because
 * the response is publicly fetchable. This module only decides what to show.
 */

export interface Position {
  id: string;
  name: string;
  description?: string;
  company?: string;
  educationalQualification?: string;
  positionType?: string;
  department?: string;
  benefits?: string;
  benefitGroupLife?: string;
  benefitMedicalInsurance?: string;
  benefitPension?: string;
  recruitmentType?: string;
  openings?: string;
  positionNature?: string;
  reportingTo?: string;
  leaveDays?: string;
  assessmentStages?: string;
  sixMonthObjectives?: string;
  careerPath?: string;
  competitiveAdvantage?: string;
  /** ISO date the requisition was created, for JobPosting structured data. */
  datePosted?: string;
  location?: string;
}

/** The shape n8n forwards from ClickUp. Only the fields this page reads. */
interface ClickUpFieldOption {
  id?: string;
  name?: string;
  label?: string;
  orderindex?: number;
}

interface ClickUpCustomField {
  name?: string;
  type?: string;
  value?: string | number | string[] | null;
  type_config?: { options?: ClickUpFieldOption[] };
}

export interface ClickUpTask {
  id?: string;
  name?: string;
  description?: string;
  text_content?: string;
  /** Epoch milliseconds as a string, which is how ClickUp sends dates. */
  date_created?: string | number;
  custom_fields?: ClickUpCustomField[];
}

/** ClickUp epoch-millisecond strings -> an ISO date, or nothing if unparseable. */
const toIsoDate = (value?: string | number): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const ms = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(ms) || ms <= 0) return undefined;
  return new Date(ms).toISOString().slice(0, 10);
};

/**
 * The first of these that exists in ClickUp wins. Location is not a required
 * field on the Positions list, so a role may simply not carry one.
 */
const LOCATION_FIELDS = ["Location", "Job Location", "Work Location", "City", "Office"];

// Normalize a field name so emoji prefixes and punctuation don't break matching
// e.g. "🎓 Educational Qualification" -> "educational qualification"
const normalizeFieldName = (name?: string): string =>
  (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Resolve a ClickUp custom field to a display string
export const getCustomFieldValue = (task: ClickUpTask, fieldName: string): string | undefined => {
  const target = normalizeFieldName(fieldName);
  const field = task.custom_fields?.find((f) => normalizeFieldName(f.name) === target);
  if (!field) return undefined;

  // Dropdowns carry either the option id or its orderindex, depending on how
  // the field was created in ClickUp
  if (field.type === "drop_down" && field.type_config?.options) {
    const selectedOption = field.type_config.options.find(
      (opt) => opt.id === field.value || opt.orderindex === field.value,
    );
    return selectedOption?.name;
  }

  // Labels carry an array of option ids -> resolve each to its label
  if (field.type === "labels" && Array.isArray(field.value)) {
    const options = field.type_config?.options || [];
    return field.value.map((id) => options.find((opt) => opt.id === id)?.label ?? id).join(", ");
  }

  return field.value?.toString();
};

/**
 * Maps a ClickUp task from the "Positions" list onto the fields the careers
 * page shows. Deliberately excluded as internal or commercially confidential:
 * Proposed Salary, Existing Salary Band, the HR head and director decision and
 * rejection-reason fields, Approving Director, HR Responsible, Internal JD File
 * and V1 Record.
 */
export const parsePositionFromTask = (task: ClickUpTask): Position => ({
  id: task.id ?? "",
  name: task.name ?? "",
  description: getCustomFieldValue(task, "Job Description") || task.description || task.text_content,
  company: getCustomFieldValue(task, "Company"),
  educationalQualification: getCustomFieldValue(task, "Educational Qualification"),
  positionType: getCustomFieldValue(task, "Position Type"),
  department: getCustomFieldValue(task, "Department"),
  benefits: getCustomFieldValue(task, "Benefits"),
  benefitGroupLife: getCustomFieldValue(task, "Benefit | Group Life"),
  benefitMedicalInsurance: getCustomFieldValue(task, "Benefit | Medical Insurance"),
  benefitPension: getCustomFieldValue(task, "Benefit | Pension"),
  recruitmentType: getCustomFieldValue(task, "Recruitment Type"),
  openings: getCustomFieldValue(task, "Total Sub-Positions"),
  positionNature: getCustomFieldValue(task, "Position: New/Replacement"),
  reportingTo: getCustomFieldValue(task, "Reporting To"),
  leaveDays: getCustomFieldValue(task, "Leave Days"),
  assessmentStages: getCustomFieldValue(task, "Assessment Stages Required"),
  sixMonthObjectives: getCustomFieldValue(task, "6 Months Objectives"),
  careerPath: getCustomFieldValue(task, "Potential Career Path"),
  competitiveAdvantage: getCustomFieldValue(task, "Competitive Advantage"),
  datePosted: toIsoDate(task.date_created),
  location: LOCATION_FIELDS.map((name) => getCustomFieldValue(task, name)).find(Boolean),
});

// "labels" fields arrive from getCustomFieldValue as a comma-joined string.
// "N/A" is a real option in ClickUp and is never worth showing a candidate.
export const splitLabels = (value?: string): string[] =>
  (value || "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && part !== "N/A");

// Accept either the ClickUp payload passed straight through ({ tasks: [...] })
// or a bare array of tasks, which is what an n8n webhook returns by default
export const parsePositionsResponse = (response: unknown): Position[] => {
  const payload = response as { tasks?: unknown } | unknown[] | null | undefined;
  const rawTasks: ClickUpTask[] = Array.isArray(payload)
    ? (payload as ClickUpTask[])
    : Array.isArray((payload as { tasks?: unknown })?.tasks)
      ? ((payload as { tasks: ClickUpTask[] }).tasks)
      : [];

  return rawTasks.map(parsePositionFromTask).filter((p) => p.id && p.name);
};

/** Free-text search across the fields a candidate would actually search by */
export const matchesQuery = (position: Position, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    position.name,
    position.company,
    position.department,
    position.positionType,
    position.educationalQualification,
    position.description,
  ]
    .filter(Boolean)
    .some((field) => field!.toLowerCase().includes(q));
};

/**
 * The form schema, served by n8n.
 *
 * ClickUp addresses custom fields and their options by UUID. None of those
 * UUIDs — nor the list id, nor the token — belong in this bundle, so n8n reads
 * `GET /api/v2/list/{id}/field`, caches it, and serves the app a schema keyed
 * by the stable field keys below. Option lists therefore cannot drift out of
 * sync with the workspace, and the app submits *labels*, which n8n resolves
 * back to UUIDs against the same live schema.
 *
 * Nine of these fields do not exist in ClickUp yet (the workspace build is in
 * flight). When one is missing the app refuses to render rather than dropping
 * a manager's answers on the floor — see `describeSchemaFault`.
 */

/** A dropdown or label option. `label` is what the app stores and submits. */
export interface SchemaOption {
  label: string;
  /** Present for provenance only; the app never submits it. */
  id?: string;
  /** Quiet secondary text — the department that owns a provisioning item. */
  note?: string;
  /** Flags a value inferred rather than confirmed by the client. */
  provisional?: boolean;
}

export type SchemaFieldType =
  | "text"
  | "textarea"
  | "number"
  | "drop_down"
  | "labels"
  | "people"
  | "date";

export interface SchemaField {
  key: string;
  /** ClickUp's own name for the field, shown in the schema-fault diagnostic. */
  clickupName?: string;
  type: SchemaFieldType;
  options?: SchemaOption[];
}

/**
 * People are not in here. The requesting manager, "reports to" and the
 * interview panel come from the two directory endpoints instead — see
 * `directory.ts`.
 */
export interface RequisitionSchema {
  fields: Record<string, SchemaField>;
  /** Keys n8n could not resolve against the workspace, reported rather than hidden. */
  missingKeys?: string[];
}

/**
 * Every field key the app writes to. A key missing from the served schema is a
 * hard startup fault: submitting a requisition whose section, location or
 * responsibilities silently vanish is worse than not submitting at all.
 *
 * `jobTitle` is deliberately absent — it becomes the ClickUp task name, not a
 * custom field. So are `agencyName` and `replacingEmployee`, which travel in
 * the payload for HR and have no field of their own.
 */
export const REQUIRED_FIELD_KEYS = [
  // A · Position identity
  "company",
  "department",
  "costCentre",
  "location",
  "positionType",
  "newOrReplacement",
  "totalSubPositions",
  "recruitmentType",
  // B · Reporting lines
  "requestingManager",
  "reportingTo",
  "othersReportingIndirectly",
  // C · Job description
  "jobOverview",
  "keyResponsibilitiesOutcomes",
  "educationalQualification",
  "relevantSkillsExperienceAttributes",
  // D · Business case
  "previousFailuresSuccesses",
  "competitiveAdvantage",
  "sixMonthsObjectives",
  "potentialCareerPath",
  // E · Provisioning
  "positionRequirements",
  // F · Hiring process
  "assessmentStagesRequired",
  "interviewPanel",
  // Stamped by n8n with the submission timestamp
  "requisitionRaised",
] as const;

/** Keys whose control is unusable without at least one option to choose from. */
export const CHOICE_FIELD_KEYS = [
  "company",
  "department",
  "costCentre",
  "location",
  "positionType",
  "newOrReplacement",
  "recruitmentType",
  "positionRequirements",
  "assessmentStagesRequired",
] as const;

export interface SchemaFault {
  /** Keys absent from the served schema entirely. */
  missing: string[];
  /** Keys present but carrying no options, so nothing can be selected. */
  optionless: string[];
}

export const isSchemaFaulty = (fault: SchemaFault): boolean =>
  fault.missing.length > 0 || fault.optionless.length > 0;

/**
 * Validates the served schema against what the form needs. Called once at
 * mount; a fault renders a diagnostic naming the exact ClickUp fields HR still
 * has to create, which is the only actionable thing to say about it.
 */
export const describeSchemaFault = (schema: RequisitionSchema): SchemaFault => {
  const missing = REQUIRED_FIELD_KEYS.filter((key) => !schema.fields[key]);
  const reportedMissing = (schema.missingKeys ?? []).filter((key) => !missing.includes(key as never));

  const optionless = CHOICE_FIELD_KEYS.filter((key) => {
    const field = schema.fields[key];
    return field ? !field.options?.length : false;
  });

  return { missing: [...missing, ...reportedMissing], optionless };
};

/** Labels only. The app never holds an option UUID. */
export const optionLabels = (schema: RequisitionSchema, key: string): string[] =>
  (schema.fields[key]?.options ?? []).map((option) => option.label);

export const optionsFor = (schema: RequisitionSchema, key: string): SchemaOption[] =>
  schema.fields[key]?.options ?? [];

/**
 * A select value has to be one the workspace actually offers (blocking rule
 * B-11) — a restored draft can outlive the option it names.
 */
export const isKnownOption = (schema: RequisitionSchema, key: string, value: string): boolean =>
  !value || optionLabels(schema, key).includes(value);

/**
 * Job grade is free text until the client supplies a grade structure, and
 * "who is being replaced" is free text until the employee register is exposed.
 * Both become a select the moment the served schema carries options — a config
 * change in n8n, not a rewrite here.
 */
export const rendersAsSelect = (schema: RequisitionSchema, key: string): boolean =>
  !!schema.fields[key]?.options?.length;

/** n8n may serve the raw shape or wrap it; accept either rather than fail. */
export const parseSchemaResponse = (response: unknown): RequisitionSchema => {
  const payload = (Array.isArray(response) ? response[0] : response) as Partial<RequisitionSchema>;
  return {
    fields: payload?.fields ?? {},
    missingKeys: payload?.missingKeys ?? [],
  };
};

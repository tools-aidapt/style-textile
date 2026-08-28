/**
 * The wire contract with n8n — v1.0.
 *
 * `requisition-submission-1.0.json` is the authority; these types and limits
 * mirror it so a payload cannot drift out of shape without the compiler saying
 * so. The schema is `additionalProperties: false` throughout: an extra key is
 * rejected outright, and every listed property is required even when its value
 * is `null`, so the builder always writes the whole object.
 *
 * Two rules worth keeping in mind while editing:
 * - **Labels, never option UUIDs.** n8n resolves them against the live field
 *   schema, which is what keeps this bundle free of ClickUp ids.
 * - **`null` for an empty optional, never `""`.** An empty string is a value;
 *   ClickUp writes it and overwrites the default. `null` means "not answered".
 */

/**
 * v1.1 loosens three of v1.0's position fields to nullable, because the form no
 * longer asks for them: HR assigns the job grade and job code, and the section
 * within a department was noise for the managers filling this in. The keys are
 * still written — always as `null` — so nothing downstream has to cope with an
 * absent property.
 *
 * TODO(kenafric): v1.0 made `jobGrade` a required non-null string, so n8n must
 * accept 1.1 before this ships or every submission is a 422. Confirm with
 * whoever owns the contract.
 */
export const SCHEMA_VERSION = "1.1" as const;

export const CLIENT_APP = "kenafric-requisition-web" as const;

/**
 * The version of *this client's* implementation of the contract, not the npm
 * package. Bump it when what the app puts on the wire changes.
 */
export const APP_VERSION = "1.0.0";

/**
 * Every length and count the schema enforces. Validated here as well as there
 * so a manager is told before a submit, not after a 422.
 */
export const LIMITS = {
  jobTitle: { min: 3, max: 80 },
  location: { max: 120 },
  agencyName: { max: 120 },
  reportingTo: { min: 2, max: 120 },
  othersReportingIndirectly: { max: 2000 },
  longText: { max: 4000 },
  responsibilityCell: { max: 300 },
  rows: { min: 3, max: 12 },
  totalSubPositions: { min: 1, max: 10 },
  interviewPanel: { max: 10 },
  positionRequirements: { max: 9 },
  assessmentStages: { max: 4 },
} as const;

export interface UserRef {
  clickupUserId: number;
  email: string | null;
  displayName: string | null;
}

/**
 * A replacement is a link to an employee record. There is no shape in v1.0 for
 * a name typed by hand — see `replacementOf` in payload.ts for what the app
 * does while the register is still unexposed.
 */
export interface EmployeeRef {
  clickupTaskId: string;
  displayName: string | null;
}

export interface RequisitionSubmission {
  schemaVersion: typeof SCHEMA_VERSION;
  /** UUID v4, generated on first mount and reused by every attempt. */
  submissionId: string;
  /** ISO 8601 UTC. Never epoch from the browser — timezone bugs hide there. */
  submittedAt: string;
  client: { app: typeof CLIENT_APP; appVersion: string };
  submitter: { email: string; clickupUserId: number | null; displayName: string | null };
  position: {
    jobTitle: string;
    company: string;
    department: string;
    /** Always null since v1.1 — the form no longer asks. */
    section: string | null;
    costCentre: string;
    location: string;
    /** Always null since v1.1 — HR assigns it after the manager submits. */
    jobGrade: string | null;
    /** Always null since v1.1 — HR assigns it after the manager submits. */
    jobCodeNo: string | null;
    positionType: string;
    newOrReplacement: string;
    replacingEmployee: EmployeeRef | null;
    totalSubPositions: number;
    recruitmentType: string[];
    agencyName: string | null;
  };
  reporting: {
    requestingManager: UserRef;
    reportingTo: string;
    othersReportingIndirectly: string | null;
  };
  jobDescription: {
    jobOverview: string;
    keyResponsibilitiesRows: { responsibility: string; outcome: string }[];
    keyResponsibilitiesMarkdown: string;
    educationalQualification: string;
    relevantSkillsExperienceAttributes: string;
  };
  businessCase: {
    previousFailuresSuccesses: string;
    competitiveAdvantage: string;
    sixMonthsObjectives: string;
    potentialCareerPath: string;
  };
  provisioning: { positionRequirements: string[] };
  hiringProcess: { assessmentStagesRequired: string[]; interviewPanel: UserRef[] };
  advisoriesAcknowledged: string[];
}

/** An advisory the server raised. A-6 arrives this way, alongside a success. */
export interface ServerAdvisory {
  code: string;
  message: string;
  taskUrl?: string;
}

/** `201`. `duplicate: true` is the idempotent replay, and is still a success. */
export interface SubmissionSuccess {
  ok: true;
  submissionId: string;
  taskId: string;
  taskUrl?: string;
  reference?: string;
  duplicate?: boolean;
  advisories?: ServerAdvisory[];
}

/**
 * `422`. `path` is dot-notation matching the payload exactly, so each issue
 * maps straight to its field. Server messages are written for the manager to
 * read — the app shows them verbatim rather than inventing its own wording.
 */
export interface SubmissionIssue {
  path: string;
  code: string;
  message: string;
  allowed?: string[];
}

export interface SubmissionFailure {
  ok: false;
  error: string;
  issues?: SubmissionIssue[];
}

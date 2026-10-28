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
 * v1.2 does two more things:
 * - `replacingEmployee` is now always `null`. The form no longer asks who is
 *   being replaced, so the key stays (still written, for the same reason as
 *   `jobGrade` above) but the old rule requiring an object when
 *   `newOrReplacement` is "Replacement" has to be dropped server-side, or a
 *   replacement requisition 422s on a field nothing can ever answer again.
 * - The six long-form essay answers (`jobOverview`, the C4 experience half,
 *   and the four business-case fields) drop their 4000-character ceiling and
 *   gain a 300-character floor instead — see `LIMITS.longText`.
 *
 * Later in 1.2, `hiringProcess.applicationDeadline` (YYYY-MM-DD) was added. The
 * form requires it; n8n accepts its absence so a tab opened before it shipped
 * still submits, and writes it to ClickUp's Application Deadline date field.
 *
 * TODO(kenafric): n8n's JSON Schema validation node must accept 1.2 — both
 * changes above — before this ships, or every affected submission is a 422.
 * Confirm with whoever owns the contract.
 */
export const SCHEMA_VERSION = "1.2" as const;

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
  /** The six essay answers: a floor, deliberately no ceiling — see v1.2 above. */
  longText: { min: 300 },
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
 * A replacement is a link to an employee record. The form no longer has a
 * control for it — `position.replacingEmployee` is always `null` since v1.2 —
 * but the shape stays on the wire in case a future version reintroduces it.
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
  hiringProcess: {
    assessmentStagesRequired: string[];
    interviewPanel: UserRef[];
    /** YYYY-MM-DD. Added later in 1.2; n8n treats it as optional for older tabs. */
    applicationDeadline: string | null;
  };
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

/**
 * Every VITE_* value is inlined into the built JavaScript and is therefore
 * PUBLIC. Nothing secret belongs here: n8n holds the ClickUp credential and
 * serves an already-filtered response. See .env.example.
 *
 * Read once, in one place, so a missing variable is a single diagnosable fault
 * rather than an empty page in three different components.
 */

const read = (value: string | undefined): string => (value ?? "").trim();

export const config = {
  jobsWebhookUrl: read(import.meta.env.VITE_JOBS_WEBHOOK_URL),
  jobsWebhookUser: read(import.meta.env.VITE_JOBS_WEBHOOK_USER),
  jobsWebhookPassword: read(import.meta.env.VITE_JOBS_WEBHOOK_PASSWORD),
  applicationWebhookUrl: read(import.meta.env.VITE_APPLICATION_WEBHOOK_URL),
  applicationWebhookUser: read(import.meta.env.VITE_APPLICATION_WEBHOOK_USER),
  applicationWebhookPassword: read(import.meta.env.VITE_APPLICATION_WEBHOOK_PASSWORD),

  /**
   * The requisition form's two endpoints. The first serves the workspace form
   * schema — every option list, every ClickUp field id resolution and the
   * member directory — so no ClickUp id ever reaches this bundle. The second
   * receives a completed requisition.
   */
  requisitionSchemaUrl: read(import.meta.env.VITE_REQUISITION_SCHEMA_URL),
  requisitionWebhookUrl: read(import.meta.env.VITE_REQUISITION_WEBHOOK_URL),
  requisitionWebhookUser: read(import.meta.env.VITE_REQUISITION_WEBHOOK_USER),
  requisitionWebhookPassword: read(import.meta.env.VITE_REQUISITION_WEBHOOK_PASSWORD),

  /**
   * The two people directories. Separate endpoints: the employee register says
   * who can raise a requisition and carries avatars, the user list says who can
   * be reported to or sit on a panel.
   */
  employeesWebhookUrl: read(import.meta.env.VITE_EMPLOYEES_WEBHOOK_URL),
  usersWebhookUrl: read(import.meta.env.VITE_USERS_WEBHOOK_URL),

  /**
   * The employee onboarding form's two endpoints, both on n8n.
   *
   * The first exchanges the employee's ClickUp task id for their own details
   * and the list of documents they owe. The second takes the whole submission
   * in one multipart request — the metadata and every document together.
   *
   * Neither carries a ClickUp field id. The employee's id is not configured
   * here either; it arrives in the URL WF-15 emailed to the new hire.
   */
  onboardingSessionUrl: read(import.meta.env.VITE_ONBOARDING_SESSION_URL),
  onboardingSubmitUrl: read(import.meta.env.VITE_ONBOARDING_SUBMIT_URL),
  onboardingWebhookUser: read(import.meta.env.VITE_ONBOARDING_WEBHOOK_USER),
  onboardingWebhookPassword: read(import.meta.env.VITE_ONBOARDING_WEBHOOK_PASSWORD),

  /**
   * Kenafric's privacy notice, and the address HR reads.
   *
   * Deliberately unset by default and never guessed. The onboarding form asks
   * a Kenyan employee for their national ID, their bank details and a
   * photograph of their face; a wrong privacy-notice link on that screen is
   * worse than no link, and an invented HR address sends a document nowhere.
   * The app renders each only when it is configured.
   */
  onboardingPrivacyUrl: read(import.meta.env.VITE_ONBOARDING_PRIVACY_URL),
  onboardingHrEmail: read(import.meta.env.VITE_ONBOARDING_HR_EMAIL),

  /** Absolute origin used to build canonical URLs and JobPosting structured data. */
  siteUrl: read(import.meta.env.VITE_SITE_URL) || "https://aidapt.co",

  /**
   * Allows the requisition form to be filled with sample content in one click.
   *
   * Off unless explicitly set, and always on in development. It must stay off
   * on the deployment HR uses: sample content is invented, and a requisition
   * raised from it would reach ClickUp looking like a real one. See
   * requisition/sample.ts.
   */
  allowPrefill: read(import.meta.env.VITE_ALLOW_PREFILL) === "true",
} as const;

/** Basic auth is only worth sending when a username was actually configured. */
export const basicAuthFor = (username: string, password: string) =>
  username ? { username, password } : undefined;

/** A missing webhook URL is a deployment fault, not an empty careers page. */
export const reportMissingConfig = (name: string): void => {
  console.error(`${name} is not configured — the careers page cannot reach its data.`);
};

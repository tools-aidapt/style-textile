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

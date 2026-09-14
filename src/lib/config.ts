/**
 * Every VITE_* value is inlined into the built JavaScript and is therefore
 * PUBLIC. Nothing secret belongs here: n8n holds the ClickUp credential and
 * serves an already-filtered response. See .env.example.
 *
 * Read once, in one place, so a missing variable is a single diagnosable fault
 * rather than an empty page in three different components.
 */

const read = (value: string | undefined): string => (value ?? "").trim();

/**
 * The n8n instance every workflow in this system is served from.
 *
 * Here once so a renumbered workflow is one edit. The feedback workflows were
 * renumbered to WF-21..24 on 2026-09-10 because WF-14 and WF-15 already
 * belonged to the onboarding phase. The old submit path must not survive
 * anywhere in the repo — that is an acceptance criterion, so it is not
 * written out here either.
 */
export const N8N_HOST =
  read(import.meta.env.VITE_N8N_BASE_URL) || "https://aidapt.app.n8n.cloud";

export const N8N_BASE = `${N8N_HOST}/webhook`;

/**
 * Join a host and a path without doubling or dropping the slash between them.
 *
 * `https://host/` + `/webhook/x` is `//webhook/x`, which n8n answers with a
 * 404 that says the webhook is not registered — indistinguishable, from the
 * outside, from a workflow nobody activated. A trailing slash in a dashboard
 * environment variable is the most likely way anyone ever produces that, so
 * it is handled here rather than trusted not to happen.
 */
export const joinUrl = (host: string, path: string): string =>
  `${host.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

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

  /**
   * The feedback forms' two endpoints, shared by all five instruments.
   *
   * The first exchanges the signed token in the link for that one person's
   * prefilled details and whether they have already answered. The second
   * takes the completed response.
   *
   * Neither carries a ClickUp field id, and the token is never configured
   * here — it arrives in the URL WF-15 emailed. See `feedback/session.ts` for
   * why the app refuses to decode it.
   */
  feedbackContextUrl:
    read(import.meta.env.VITE_FEEDBACK_CONTEXT_URL) || `${N8N_BASE}/kenafric-feedback-context`,
  /** WF-21, renumbered on 2026-09-10. */
  feedbackSubmitUrl: read(import.meta.env.VITE_FEEDBACK_SUBMIT_URL) || `${N8N_BASE}/kenafric-wf21`,
  feedbackWebhookUser: read(import.meta.env.VITE_FEEDBACK_WEBHOOK_USER),
  feedbackWebhookPassword: read(import.meta.env.VITE_FEEDBACK_WEBHOOK_PASSWORD),

  /**
   * The KPI forms' three endpoints.
   *
   * One context endpoint serves both forms — it verifies the token, reads
   * the employee and, for a review, the agreed KPI set — and each form
   * posts to its own workflow: WF-18b takes a new KPI set, WF-26b takes a
   * mid or final review. Two submit URLs rather than one branching workflow,
   * because they write to different lists and fail for different reasons.
   *
   * No ClickUp field id, option UUID or list id is configured here or
   * carried in the payloads; see `kpi/contract.ts`. The token is never
   * configured either — it arrives in the URL WF-18a or WF-26a emailed,
   * and `LINK_SECRET` is not here and must never be: the app carries `?t=`
   * through and neither mints nor verifies it.
   *
   * Host and path are separate variables so that pointing the whole layer at
   * a staging n8n is one change rather than three, and so a renamed webhook
   * does not require redeploying with a different hostname. Each falls back
   * to the live value, so a preview build with nothing configured still
   * works rather than posting to `undefined`.
   */
  kpiContextUrl: joinUrl(
    N8N_HOST,
    read(import.meta.env.VITE_KPI_CONTEXT_PATH) || "/webhook/kenafric-kpi-context",
  ),
  /** WF-18b — a new KPI set. */
  kpiDefineSubmitUrl: joinUrl(
    N8N_HOST,
    read(import.meta.env.VITE_KPI_DEFINE_PATH) || "/webhook/kenafric-wf18b",
  ),
  /** WF-26b — a mid or final review. */
  kpiReviewSubmitUrl: joinUrl(
    N8N_HOST,
    read(import.meta.env.VITE_KPI_REVIEW_PATH) || "/webhook/kenafric-wf26b",
  ),
  kpiWebhookUser: read(import.meta.env.VITE_KPI_WEBHOOK_USER),
  kpiWebhookPassword: read(import.meta.env.VITE_KPI_WEBHOOK_PASSWORD),

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

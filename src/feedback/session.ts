/**
 * Who is filling this in, and whether they still may.
 *
 * The link WF-15 emails a candidate carries a signed token:
 * `/feedback/candidate-review?t=<token>`. The app reads it out of the URL,
 * sends it to the context endpoint, and renders whatever comes back.
 *
 * ---
 * **The app never decodes the token, and never trusts it.** It could — the
 * payload is only base64url — and that is exactly why it must not. A claim
 * read out of an unverified token is a claim the candidate could have
 * rewritten, and `ft` decides which `Form Type` the response is tagged with
 * and whether a payroll number is shown. So the signature is checked in n8n,
 * where the secret is, and `formType` and every prefilled value come back
 * from the endpoint. The token is an opaque string in this app from the URL
 * to the POST body.
 *
 * This is the same bargain `onboarding/session.ts` strikes, one step
 * stronger: there the id in the URL is a name and the safeguards are all
 * server-side; here the link is actually signed, so a bad or expired one is
 * refused outright rather than rate-limited.
 * ---
 *
 * The response is scoped to one person and one form. It is never a list, and
 * there is no shape in it for anybody else's anything.
 */

import { isFormType, type FormType } from "./schema";

/**
 * What the context endpoint says, filtered to what the app renders.
 *
 * Every value here is prefilled and read-only. Nothing on this list is ever
 * typed by the person filling the form in — that was V1's defect: five forms
 * asked for a name, an email, a payroll number, a department and a company
 * that Kenafric already held, and a typo or a nickname made the response
 * unmatchable to a candidate record for ever.
 */
export interface FeedbackPrefill {
  fullName: string;
  email: string;
  /** Internal applicants only. Shown back to them, never asked for. */
  payroll: string | null;
  positionTitle: string | null;
  /** For the manager and new-hire forms. Unused by Build A. */
  jobTitle: string | null;
  /** The employing entity. Substituted into the recommend question (G-9). */
  company: string | null;
  department: string | null;
  recruitmentType: string | null;
  /** Which of a repeating form's sends this is. Unused by Build A. */
  reviewPoint: string | null;
}

export interface FeedbackContext {
  /** The server's word on which instrument this is. Never the token's. */
  formType: FormType;
  /** Already answered. Renders the thank-you, not the form. */
  alreadySubmitted: boolean;
  prefill: FeedbackPrefill;
}

/** Why the form will not open. Each renders a different dead end. */
export type ContextFault =
  /** No token in the URL — the tail of the link was lost in an email client. */
  | "no-token"
  /**
   * The endpoint refused it: bad signature, expired, or no record answers to
   * it. All one thing to the person reading it — this link does not work.
   */
  | "link-dead"
  | "unreachable"
  /** Deployed without its endpoints. A fault of ours, said as one. */
  | "unconfigured";

const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const nullable = (value: unknown): string | null => str(value) || null;

/**
 * `base64url.base64url` — a payload and its HMAC, as WF-15 mints it.
 *
 * Checked before the token is sent, for the same reason a ClickUp id is:
 * it saves the endpoint a verification, and it keeps a URL nobody typed on
 * purpose out of the logs. The lengths are floors, not a format claim — the
 * only thing that can actually judge this token is the secret in n8n.
 */
const TOKEN = /^[A-Za-z0-9_-]{16,1024}\.[A-Za-z0-9_-]{16,512}$/;

/**
 * The token, from `?t=`.
 *
 * Query string only, deliberately: unlike the onboarding id there is no path
 * form to accept, because a token is long enough that no email client will
 * reflow it into a path segment. Returns "" for anything that is not
 * token-shaped, which the page renders as `no-token`.
 */
export const readToken = (): string => {
  let raw = "";
  try {
    raw = str(new URLSearchParams(window.location.search).get("t"));
  } catch {
    return "";
  }
  return TOKEN.test(raw) ? raw : "";
};

export const parseContext = (raw: unknown): FeedbackContext | null => {
  const body = raw as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return null;

  // An explicit `ok: false` is a refusal with a 200 on it. n8n Respond nodes
  // do that more often than anyone would like.
  if (body.ok === false) return null;

  const formType = body.formType;
  // No form type means the app does not know which questions to ask, and
  // guessing would tag somebody's answers as the wrong instrument
  if (!isFormType(formType)) return null;

  const prefill = (body.prefill ?? {}) as Record<string, unknown>;

  return {
    formType,
    alreadySubmitted: body.alreadySubmitted === true,
    prefill: {
      fullName: str(prefill.fullName),
      email: str(prefill.email),
      payroll: nullable(prefill.payroll),
      positionTitle: nullable(prefill.positionTitle),
      jobTitle: nullable(prefill.jobTitle),
      company: nullable(prefill.company),
      department: nullable(prefill.department),
      recruitmentType: nullable(prefill.recruitmentType),
      reviewPoint: nullable(prefill.reviewPoint),
    },
  };
};

/** Internal applicants get the payroll block; nobody else sees it. */
export const isInternal = (context: FeedbackContext): boolean =>
  context.formType === "ICRR";

/**
 * The employing entity's name, for the question that asks whether they would
 * recommend it.
 *
 * Falls back to the group name rather than to the ClickUp field's hardcoded
 * "Kenafric Industries Ltd": a candidate interviewed by KBBL being asked
 * about KIL reads as a form built for somebody else.
 */
export const companyName = (context: FeedbackContext): string =>
  context.prefill.company || "Kenafric";

/**
 * Who is filling this in, and what they owe.
 *
 * A new hire has no ClickUp account and no password. The link WF-15 emails
 * them carries their ClickUp Employee task id, and that id is what identifies
 * them: `/onboarding/869evrmhx`, or `?id=869evrmhx`.
 *
 * The app reads it, sends it to the session endpoint, and renders whatever
 * comes back. It never infers anything from the id itself and never stores an
 * identity it was not just handed — the response is the only source of truth
 * for who this is and what they owe.
 *
 * ---
 * A ClickUp task id is short and enumerable, so it is a NAME, not a secret.
 * Anyone who tries a few opens somebody's form, and this form accepts national
 * IDs and bank details. Nothing the browser can do changes that, so the
 * safeguards have to live on the n8n side, and they are not optional:
 *
 * - **Rate-limit hard, per id and per IP.** Enumeration has to be expensive.
 * - **Serve a session only for an employee who is actually onboarding** —
 *   status `preboarding`, with documents still outstanding. That closes the
 *   window to the few weeks it needs to be open rather than for ever.
 * - **Log every session hit with its id and IP**, so a sweep is visible after
 *   the fact even though it cannot be prevented.
 *
 * `n8n/onboarding-token.cjs` holds a signed-link implementation if this is
 * ever judged too thin; nothing in the app would need to change but the two
 * lines that read the id out of the URL.
 * ---
 *
 * The response is scoped to one employee. It is never a list, and there is no
 * shape in it for anybody else's anything.
 */

import { DOCUMENTS, isDocumentKey, type DocumentKey, type DocumentSpec } from "./documents";
import { needsHelbDocument, type OnboardingValues } from "./form";

export interface OnboardingSession {
  /** Echoed back by the session endpoint. Used for the filename prefix. */
  clickupTaskId: string;
  /** Pre-fills A1, and A3 in the advisory that compares the two (A-3). */
  fullName: string;
  /** The address the link was sent to. A2 defaults to it. */
  personalEmail: string;
  mobile: string;
  /** The trust anchor in A4 — ISO date, rendered in Africa/Nairobi. */
  joiningDate: string | null;
  positionTitle: string | null;
  company: string | null;
  /** Derived by n8n from the position's requirements. Served, never guessed. */
  requiredDocuments: DocumentKey[];
  optionalDocuments: DocumentKey[];
  /** Documents Kenafric already holds — rendered satisfied, with no control. */
  alreadyReceived: DocumentKey[];
  /** When the link stops working, so the page can say so before it does. */
  expiresAt: string | null;
}

/** Why the form will not open. Each renders a different dead end. */
export type SessionFault =
  /** The link is missing its id — the last part of the address was lost. */
  | "no-id"
  /** No employee record answers to it, or the record is not onboarding. */
  | "unknown"
  | "unreachable"
  | "unconfigured";

const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const nullable = (value: unknown): string | null => str(value) || null;

/** Unknown keys are dropped rather than trusted — the app owns the key list. */
const keys = (value: unknown): DocumentKey[] =>
  Array.isArray(value) ? value.filter((v): v is DocumentKey => typeof v === "string" && isDocumentKey(v)) : [];

/**
 * NOTE: there is no server-side manifest any more.
 *
 * Everything is sent in the one request the submit makes, so nothing exists
 * server-side until that succeeds. What survives a closed tab is IndexedDB —
 * see `readAllPending` in draft.ts, which is now the only record that a
 * document was ever prepared.
 */

/**
 * The ClickUp Employee task id, from the URL.
 *
 * `…/onboarding/869evrmhx` is the shape WF-15 builds. `?id=869evrmhx` is
 * accepted too, because an email client that mangles a path segment is a real
 * thing and the alternative is a new hire who cannot start.
 *
 * A ClickUp id is lowercase alphanumeric. Anything else is not one, and is
 * refused here rather than sent on — it saves the endpoint a lookup, and it
 * keeps a URL nobody typed on purpose out of the logs.
 */
const CLICKUP_ID = /^[a-z0-9]{4,20}$/i;

export const readEmployeeId = (fromPath?: string): string => {
  const fromQuery = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      // `t` is accepted as an alias so a link built before this changed shape
      // still opens rather than dead-ending on somebody's first day
      return str(params.get("id") ?? params.get("t"));
    } catch {
      return "";
    }
  };

  const candidate = str(fromPath) || fromQuery();
  return CLICKUP_ID.test(candidate) ? candidate.toLowerCase() : "";
};

export const parseSession = (raw: unknown): OnboardingSession | null => {
  const body = raw as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return null;

  const employee = (body.employee ?? {}) as Record<string, unknown>;
  const clickupTaskId = str(employee.clickupTaskId ?? body.clickupTaskId);
  // No task id means no identity, and an identity is not something this app
  // can fall back to a default for
  if (!clickupTaskId) return null;

  return {
    clickupTaskId,
    fullName: str(employee.fullName ?? body.fullName),
    personalEmail: str(employee.personalEmail ?? body.personalEmail),
    mobile: str(employee.mobile ?? body.mobile),
    joiningDate: nullable(employee.joiningDate ?? body.joiningDate),
    positionTitle: nullable(employee.positionTitle ?? body.positionTitle),
    company: nullable(employee.company ?? body.company),
    requiredDocuments: keys(body.requiredDocuments),
    optionalDocuments: keys(body.optionalDocuments),
    alreadyReceived: keys(body.alreadyReceived),
    expiresAt: nullable(body.expiresAt),
  };
};

export interface DocumentRequirement {
  spec: DocumentSpec;
  required: boolean;
  /** Already on file. Rendered with a teal check and no upload control. */
  satisfied: boolean;
  /** Replaces the spec's own note when an answer changed what it means. */
  overrideNote?: string;
}

/**
 * Which documents this employee sees, and which of them they owe.
 *
 * A `conditional` document is **hidden entirely** until the session says it
 * applies. TODO(kenafric): until n8n derives this from the position's
 * requirements and department, `requiredDocuments`/`optionalDocuments` arrive
 * empty and the Public Health Certificate and Driver's Licence stay hidden.
 * Hidden is the safe default — a wrongly required document is a support call
 * the employee cannot resolve.
 */
export const visibleDocuments = (
  session: OnboardingSession,
  values: OnboardingValues,
): DocumentRequirement[] =>
  DOCUMENTS.flatMap((spec) => {
    const servedRequired = session.requiredDocuments.includes(spec.key);
    const servedOptional = session.optionalDocuments.includes(spec.key);

    if (spec.tier === "conditional" && !servedRequired && !servedOptional) return [];

    let required = servedRequired || (!servedOptional && spec.tier === "required");
    let overrideNote: string | undefined;

    // C3 owns the HELB document, not the session: the employee's own answer is
    // the only thing that knows whether they have a loan
    if (spec.key === "helb-status" && !needsHelbDocument(values)) {
      required = false;
      overrideNote = "Not needed if you have no HELB loan.";
    }

    return [
      {
        spec,
        required,
        satisfied: session.alreadyReceived.includes(spec.key),
        overrideNote,
      },
    ];
  });

/**
 * The passport photo's own requirement. WF-14 can pre-fill it the same way it
 * pre-fills the offer letter, so it is asked the same question.
 */
export const photoAlreadyReceived = (session: OnboardingSession): boolean =>
  session.alreadyReceived.includes("passport-photo");

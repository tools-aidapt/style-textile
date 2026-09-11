/**
 * Logging, on a page that carries one named employee's performance.
 *
 * Same rule as `feedback/log.ts`, and for a sharper reason: a final review
 * holds a manager's rating of a named person against five objectives, and
 * a session recorder would put that in a third party's console, attributed,
 * for ever.
 *
 * What may be logged: the form type, the review mode, the outcome, a count,
 * an HTTP status, a short machine code.
 *
 * What may never be logged: an employee's name, a KPI statement, a rating, a
 * score, a comment, or the token — the token identifies the employee and is
 * the credential that opens their form.
 */

import type { KpiFormType, ReviewMode } from "./contract";

export type KpiOutcome =
  | "opened"
  | "context-refused"
  | "submitted"
  | "submit-rejected"
  | "submit-failed";

export interface KpiLogFields {
  formType?: KpiFormType;
  mode?: ReviewMode | null;
  /** How many KPIs were on screen. A count, attached to no name. */
  kpis?: number;
  status?: number;
  /** A short machine code — never a message written about a person. */
  code?: string;
}

export const logKpi = (outcome: KpiOutcome, fields: KpiLogFields = {}): void => {
  // One line, one shape, no free text
  console.info("kpi", { outcome, ...fields });
};

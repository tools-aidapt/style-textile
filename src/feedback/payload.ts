/**
 * Building the submission.
 *
 * Small, pure, and tested against `docs/feedback-submission-1.0.schema.json`
 * with Ajv rather than against its own opinion of that file.
 */

import type { Answers, FeedbackSubmission } from "./contract";
import { askableSections, isFieldId, type FeedbackFormSpec, type Question } from "./schema";
import type { FeedbackContext } from "./session";

/**
 * ISO 8601 with the local offset.
 *
 * Moved to `lib/isoTimestamp.ts` when the KPI forms needed the same stamp;
 * re-exported here so this module stays the one place a feedback submission
 * is assembled from, and so nothing that already imported it has to move.
 */
export { localIsoTimestamp } from "@/lib/isoTimestamp";
import { localIsoTimestamp } from "@/lib/isoTimestamp";

/**
 * The answers, cleaned for the wire.
 *
 * Three things happen here, and each one is a rule from the contract:
 *
 * - **Only questions that are actually on screen survive.** A withheld
 *   question cannot have been answered, and a stale answer to one that was
 *   removed from the spec would be posted to a field the form no longer asks
 *   about.
 * - **An unanswered optional question is dropped**, not sent as `null` or
 *   `""`. An empty string is a value ClickUp will write, and "skipped" and
 *   "answered nothing" report differently.
 * - **Text is trimmed.** A textarea that holds one newline is not an answer.
 */
/**
 * The ClickUp field id this answer is POSTED under.
 *
 * Normally the spec's own. A question marked `idFrom` takes it from the
 * context endpoint instead, because that field has been rebuilt in ClickUp
 * before and a rebuild changes the UUID — an answer posted to a retired id is
 * dropped with no error anywhere.
 *
 * `session.ts` has already refused anything that is not a complete UUID, and
 * this checks again rather than trusting that: the fallback is the spec id,
 * which is at least an id somebody tested.
 */
export const postedFieldId = (question: Question, context: FeedbackContext): string => {
  if (!question.idFrom) return question.id;
  const override = context.fieldIds[question.idFrom];
  return override && isFieldId(override) ? override : question.id;
};

export const cleanAnswers = (
  spec: FeedbackFormSpec,
  answers: Answers,
  context: FeedbackContext,
): Answers => {
  const clean: Answers = {};

  askableSections(spec).forEach((section) => {
    section.questions.forEach((question) => {
      const value = answers[question.id];
      if (value === undefined) return;

      // The UI keys on the spec id throughout — DOM ids, error keys, local
      // state. Only the wire key is substituted, and only here.
      const key = postedFieldId(question, context);

      if (typeof value === "number") {
        clean[key] = value;
        return;
      }

      const text = String(value).trim();
      if (text) clean[key] = text;
    });
  });

  return clean;
};

export const buildSubmission = ({
  token,
  context,
  spec,
  answers,
  now,
}: {
  token: string;
  context: FeedbackContext;
  spec: FeedbackFormSpec;
  answers: Answers;
  now?: Date;
}): FeedbackSubmission => ({
  t: token,
  // The server's word on which instrument this is, carried back so WF-21 can
  // branch without decoding its own token twice. Never a value the app chose.
  formType: context.formType,
  submittedAt: localIsoTimestamp(now),
  answers: cleanAnswers(spec, answers, context),
});

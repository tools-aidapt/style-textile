/**
 * Building the submission.
 *
 * Small, pure, and tested against `docs/feedback-submission-1.0.schema.json`
 * with Ajv rather than against its own opinion of that file.
 */

import type { Answers, FeedbackSubmission } from "./contract";
import { askableSections, type FeedbackFormSpec } from "./schema";
import type { FeedbackContext } from "./session";

/**
 * ISO 8601 with the local offset.
 *
 * `toISOString()` would send Z, and every one of these is submitted in
 * Nairobi — a 09:00 EAT response filed as 06:00 UTC reads as a candidate
 * answering before the email went out.
 */
export const localIsoTimestamp = (now: Date = new Date()): string => {
  const pad = (value: number) => String(Math.floor(Math.abs(value))).padStart(2, "0");
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";

  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` +
    `${sign}${pad(offset / 60)}:${pad(offset % 60)}`
  );
};

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
export const cleanAnswers = (spec: FeedbackFormSpec, answers: Answers): Answers => {
  const clean: Answers = {};

  askableSections(spec).forEach((section) => {
    section.questions.forEach((question) => {
      const value = answers[question.id];
      if (value === undefined) return;

      if (typeof value === "number") {
        clean[question.id] = value;
        return;
      }

      const text = String(value).trim();
      if (text) clean[question.id] = text;
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
  // The server's word on which instrument this is, carried back so WF-14 can
  // branch without decoding its own token twice. Never a value the app chose.
  formType: context.formType,
  submittedAt: localIsoTimestamp(now),
  answers: cleanAnswers(spec, answers),
});

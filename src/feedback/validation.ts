/**
 * What stops a submit, and what the candidate is told about it.
 *
 * One tier only. The requisition form has a blocking and an advisory tier
 * because a rejected requisition costs a manager four long-text fields and
 * the next one arrives by email instead. A survey has no such stakes: every
 * rule here is either a question that has to be answered or an answer that
 * cannot be stored, and neither is negotiable by a checkbox.
 *
 * Errors show on **blur, never on keystroke** — the same rule the requisition
 * form keeps. Telling somebody their answer is wrong before they have
 * finished giving it is noise. A submit attempt reveals everything at once.
 */

import { askableSections, type FeedbackFormSpec, type Question } from "./schema";
import type { Answers, AnswerValue } from "./contract";

/** Keyed by ClickUp field id, like the answers themselves. */
export type AnswerErrors = Record<string, string>;

export interface ValidationResult {
  errors: AnswerErrors;
  /** Field ids in reading order, so "go to the first problem" is unambiguous. */
  missing: string[];
}

const REQUIRED = "Please answer this";

const isBlank = (value: AnswerValue | undefined): boolean =>
  value === undefined || (typeof value === "string" && !value.trim());

/** A five-star answer is an integer 1-5. Anything else never came from the UI. */
export const isStarValue = (value: AnswerValue | undefined): boolean =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;

const checkOne = (question: Question, value: AnswerValue | undefined): string | null => {
  if (isBlank(value)) return question.required ? REQUIRED : null;

  switch (question.type) {
    case "stars":
      // Not reachable from the star control, so this guards a restored draft
      // or a hand-edited state rather than a candidate
      return isStarValue(value) ? null : "Please choose a rating from 1 to 5";

    case "choice":
    case "scale":
      return question.options?.includes(String(value))
        ? null
        : "Please choose one of the options";

    case "text": {
      const text = String(value).trim();
      if (question.maxLength && text.length > question.maxLength) {
        return `Please keep this under ${question.maxLength.toLocaleString()} characters`;
      }
      return null;
    }
  }
};

/**
 * Validate what is actually on screen.
 *
 * `askableSections` is the input, not `spec.sections`: a question withheld
 * because its ClickUp field id is incomplete is not rendered, so it cannot be
 * required. Requiring an answer to a question nobody can see is a form that
 * will not submit and will not say why.
 */
export const validate = (spec: FeedbackFormSpec, answers: Answers): ValidationResult => {
  const errors: AnswerErrors = {};
  const missing: string[] = [];

  askableSections(spec).forEach((section) => {
    section.questions.forEach((question) => {
      const error = checkOne(question, answers[question.id]);
      if (!error) return;
      errors[question.id] = error;
      missing.push(question.id);
    });
  });

  return { errors, missing };
};

/** Every question on screen, so the progress meter has a denominator. */
export const askableCount = (spec: FeedbackFormSpec): number =>
  askableSections(spec).reduce((total, section) => total + section.questions.length, 0);

export const answeredCount = (spec: FeedbackFormSpec, answers: Answers): number =>
  askableSections(spec).reduce(
    (total, section) =>
      total + section.questions.filter((q) => !isBlank(answers[q.id])).length,
    0,
  );

/**
 * The mean of the rating questions, to one decimal place.
 *
 * **WF-14 computes the figure that gets stored.** This copy exists so the
 * candidate can be shown what they said and so the log line carries it; two
 * sources of truth for one number is one too many, which is why it is not in
 * the payload.
 *
 * `null` until every rating question is answered — a mean of three answers
 * out of thirteen is not a rating of anything, and rounding it would put a
 * confident-looking number on a page.
 */
export const overallRating = (spec: FeedbackFormSpec, answers: Answers): number | null => {
  const scores = spec.ratingQuestions.map((id) => answers[id]);
  if (!scores.every(isStarValue)) return null;

  const total = (scores as number[]).reduce((sum, score) => sum + score, 0);
  return Math.round((total / scores.length) * 10) / 10;
};

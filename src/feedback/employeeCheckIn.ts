/**
 * F5 — the Employee Experience & Engagement Check-In. Build D.
 *
 * The new hire, about their own experience, repeatedly through probation:
 * Day 30, 60, 90, 120, 150 and 180 from their joining date. Six sends, which
 * makes it the most frequent instrument in the layer and the only one whose
 * reader is also its subject.
 *
 * It is also the only one that can promise something back. Three of its nine
 * questions ask what the employee is *missing* — tools, support, training —
 * so an answer here is an action for HR rather than a score for a report.
 * The copy says so, and deliberately does not imply anonymity: the response
 * is linked to their employee record, and a form that prefills somebody's
 * payroll number cannot pretend otherwise.
 *
 * ---
 * **NOT YET LIVE. Every field id below is a placeholder.**
 *
 * The nine question fields do not exist on `Feedback Responses`
 * (901220480198) — verified live on 2026-09-10. The `Candidate Experience
 * Survey` Form Type option has never had a single question field behind it.
 *
 * So every `id` here is a `TBC-` string, which fails `isFieldId`, so
 * `askableSections` withholds every question, so `canCollect` is false and
 * the route renders "not finished being set up" instead of a form. That is
 * the designed behaviour, not a bug: asking somebody nine questions and
 * dropping every answer is the V1 failure this whole phase exists to undo.
 *
 * To finish this build: create the nine fields (see
 * `n8n/wf25-employee-check-in.md` §1), paste the real UUIDs over the `TBC-`
 * ids, and fill in the four option lists marked `options: []`. Nothing else
 * changes — no renderer change, no workflow change.
 * ---
 *
 * QUESTION TEXT is verbatim from the live Google Form, which has fourteen
 * questions. Nine survive:
 *
 * - **Q1 Employee Name, Q2 Payroll Number, Q3 Department, Q4 Company** are
 *   dropped as questions and prefilled instead. All four are data Kenafric
 *   already holds, and a typo in any of them made a V1 response unmatchable
 *   to the person who sent it.
 * - **Q6 "Have you signed your Job Description (JD)?"** is dropped outright.
 *   JD signing went out of scope on 2026-08-25.
 */

import { voices } from "./locale";
import type { FeedbackFormSpec, FormSection, PrefilledFactSpec } from "./schema";

/** ClickUp text fields hold more; a check-in answer longer than this is a letter. */
const TEXT_MAX = 2000;

/**
 * Nothing on this form is a 1-5 score, so nothing averages.
 *
 * The four choice questions are categorical — "Yes / Partially / No" and the
 * like — and a mean of a category is a number that looks like a rating and
 * measures nothing. `Overall Rating` stays empty on an EEC response, and the
 * thank-you screen shows no figure back.
 */
export const RATING_QUESTION_IDS: readonly string[] = [];

/**
 * The header. Q1 to Q4 of the Google Form, shown back rather than asked.
 *
 * `reviewPoint` is the fifth line and it is not optional: this form arrives
 * six times, and "Day 30" and "Day 150" are different questions wearing the
 * same words. An employee who cannot see which one this is has no way to
 * judge what a fair answer to "do you have the tools you need" looks like.
 */
const FACTS: PrefilledFactSpec[] = [
  { label: "Name", key: "fullName" },
  { label: "Payroll number", key: "payroll" },
  { label: "Department", key: "department" },
  { label: "Company", key: "company" },
  { label: "Check-in", key: "reviewPoint" },
];

const SECTIONS: FormSection[] = [
  {
    id: "settling",
    ordinal: 1,
    title: "Settling in",
    questions: [
      {
        // Google Form Q5
        id: "TBC-experience-so-far",
        label: "How has your experience been so far since joining the company?",
        type: "choice",
        required: true,
        // TODO(kenafric): the live option list. Expand this dropdown in the
        // Google Form and copy the choices verbatim — WF-21 resolves the
        // NAME against the ClickUp schema, so a paraphrase resolves to
        // nothing and the answer is dropped in silence.
        options: [],
      },
      {
        // Q7
        id: "TBC-understand-role",
        label: "Do you clearly understand your role and responsibilities?",
        type: "choice",
        required: true,
        // TODO(kenafric): the live option list. Q8 names 'Partially' and
        // 'No', so those two are certainly among them — which is not the
        // same as knowing the list, and it is not worth guessing the rest.
        options: [],
      },
      {
        // Q8 — conditional in intent, unconditional in fact
        id: "TBC-explain-role-gap",
        label: "If 'Partially' or 'No', please briefly explain why?",
        type: "text",
        required: false,
        maxLength: TEXT_MAX,
      },
    ],
  },
  {
    id: "support",
    ordinal: 2,
    title: "Support and tools",
    questions: [
      {
        // Q9
        id: "TBC-supported-by-team",
        label: "Do you feel supported by your supervisor and team?",
        type: "choice",
        required: true,
        options: [],
      },
      {
        // Q10
        id: "TBC-tools-and-resources",
        label: "Do you have the tools and resources you need to do your job effectively?",
        type: "choice",
        required: true,
        options: [],
      },
      {
        // Q11
        id: "TBC-explain-tools-gap",
        label: "Briefly explain if No",
        type: "text",
        required: false,
        maxLength: TEXT_MAX,
      },
    ],
  },
  {
    id: "open",
    ordinal: 3,
    title: "In your own words",
    questions: [
      {
        // Q12
        id: "TBC-challenges",
        label: "What challenges have you faced in your role, if any?",
        type: "text",
        required: false,
        maxLength: TEXT_MAX,
      },
      {
        // Q13 — the question this instrument exists for
        id: "TBC-support-or-training",
        label: "What additional support or training would help you perform better?",
        type: "text",
        required: false,
        maxLength: TEXT_MAX,
      },
      {
        // Q14
        id: "TBC-anything-for-hr",
        label: "Is there anything you would like to share with HR or management?",
        type: "text",
        required: false,
        maxLength: TEXT_MAX,
      },
    ],
  },
];

/**
 * Which questions the Google Form marks required, kept as it has them.
 *
 * Q5, Q7, Q9 and Q10 are the four choices and are required. Every free-text
 * answer is optional, including the two "briefly explain" boxes — they are
 * follow-ups to a choice that may not need explaining, and requiring an
 * explanation of a "Yes" is a form that will not submit and will not say why.
 */
export const CHOICES_REQUIRED = true;

export const EMPLOYEE_CHECK_IN: FeedbackFormSpec = {
  formTypes: ["EEC"],
  title: "How are things going?",
  intro:
    "Nine questions on how you are finding it here, about three minutes. It goes to HR, and the parts about what you are missing are the parts they act on.",
  voice: voices.employeeCheckIn,
  facts: FACTS,
  sections: SECTIONS,
  ratingQuestions: RATING_QUESTION_IDS,
};

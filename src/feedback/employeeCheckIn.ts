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
 * FIELD IDS and OPTION NAMES are complete, read live from `Feedback
 * Responses` (901220480198) on 2026-09-10 — the nine fields were created
 * that day. Every option list below is verbatim from ClickUp, in ClickUp's
 * own order, because the NAME is what WF-21 resolves against the live
 * schema: a paraphrase resolves to nothing and the answer is dropped with no
 * error anywhere.
 *
 * Note the four option lists are four different shapes — `Very Good / Good /
 * Fair / Poor`, `Yes / Partially / No`, `Yes / Sometimes / No` and `Yes / No`.
 * Q7 says `Partially` where Q9 says `Sometimes`; they are not interchangeable
 * and not one of them was guessable from the question text.
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
        id: "f8846fd7-f9aa-4323-b203-ce05651c7e9c",
        label: "How has your experience been so far since joining the company?",
        type: "choice",
        required: true,
        options: ["Very Good", "Good", "Fair", "Poor"],
      },
      {
        // Q7
        id: "9a1a419e-688b-498c-b19e-3c33d4dad339",
        label: "Do you clearly understand your role and responsibilities?",
        type: "choice",
        required: true,
        options: ["Yes", "Partially", "No"],
      },
      {
        /**
         * Q8. Conditional in the Google Form, unconditional here — see D-21.
         * The ClickUp field is named with the form's own curly quotes and a
         * stray double space; the label renders cleanly because the label is
         * display text and the FIELD ID is what the answer is posted under.
         */
        id: "bfccbfbb-fd9c-4dd2-b38f-a3e672e56846",
        label: "If ‘Partially’ or ‘No,’ please briefly explain why?",
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
        // Q9. `Sometimes`, not `Partially` — a different list from Q7's
        id: "a4419c28-bc18-4f19-85b5-72fceedd787c",
        label: "Do you feel supported by your supervisor and team?",
        type: "choice",
        required: true,
        options: ["Yes", "Sometimes", "No"],
      },
      {
        // Q10. Yes/No only, which is why Q11 says "explain if No"
        id: "39bbd4ec-28fe-4658-8d1a-3c509392a077",
        label: "Do you have the tools and resources you need to do your job effectively?",
        type: "choice",
        required: true,
        options: ["Yes", "No"],
      },
      {
        // Q11
        id: "6a8b786e-4f17-4fd1-b2cd-138bdcc1df76",
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
        id: "d424b0aa-e127-404d-a701-04374e6202cc",
        label: "What challenges have you faced in your role, if any?",
        type: "text",
        required: false,
        maxLength: TEXT_MAX,
      },
      {
        // Q13 — the question this instrument exists for
        id: "919ae0af-321e-403f-a85c-c7b828a2f181",
        label: "What additional support or training would help you perform better?",
        type: "text",
        required: false,
        maxLength: TEXT_MAX,
      },
      {
        // Q14
        id: "85c082fd-86c8-47f8-8196-4d1122e3bfa5",
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

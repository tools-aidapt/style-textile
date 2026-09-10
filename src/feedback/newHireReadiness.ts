/**
 * F4 — Manager Feedback on New Hire Readiness & Performance. Build C.
 *
 * The line manager, about a named new hire, **twice**: at Month 1 and at
 * Month 3 from the joining date. `Review Point` is the only thing that keeps
 * the two apart — without it two responses about one person collapse
 * indistinguishably, which is gap G-4 and the reason the field exists.
 *
 * This is the one instrument in the layer whose subject is a person who is
 * not the one reading it. Two consequences, both deliberate:
 *
 * - The privacy note says plainly where the answers go and that they form
 *   part of a probation record. A manager writing something frank about a
 *   colleague is entitled to know that before they write it, not after.
 * - The header shows the new hire's name back. A manager with four reports
 *   who is sent two of these a quarter must not have to guess which one this
 *   is, and an answer filed against the wrong person is worse than none.
 *
 * Ten questions. The Airtable form had fourteen: manager name, candidate
 * name, job title and department were four of them, and are prefilled here.
 *
 * ---
 * FIELD IDS are complete UUIDs read live from `Feedback Responses`
 * (901220480198) on 2026-09-10 — including the four text ids the phase-plan
 * audit carried abbreviated to eight characters. Nothing is withheld.
 * ---
 */

import { voices } from "./locale";
import { SCALE_OPTIONS } from "./managerRecruitmentReview";
import type { FeedbackFormSpec, FormSection, PrefilledFactSpec } from "./schema";

/**
 * What 1 and 5 mean, verbatim from the V1 form's own line: "Score (1 = Poor,
 * 5 = Excellent)". Stated on each control rather than once at the top,
 * because an anchor away from the number it anchors is a legend.
 */
const SCORE_ANCHORS = { low: "Poor", high: "Excellent" } as const;

const SCORE_LEGEND = "Score (1 = Poor, 5 = Excellent)";

/**
 * The six questions that average into `Overall Rating`: the five readiness
 * scores plus the overall-impression score.
 */
export const RATING_QUESTION_IDS = [
  "479af8f7-1f42-4c10-9cfd-5901cdb3a656",
  "661719d7-23d6-4049-90c1-548ca65ddce8",
  "65c830f2-0c66-45ef-bde7-3371cc53d2f2",
  "20edde00-b002-4f66-96b5-5e4789ad02e0",
  "269183ca-73c8-4a2d-a518-2d37a45c8148",
  "62ca0de5-6f17-464f-a19a-9bec86e705b0",
] as const;

/**
 * Are the three open questions mandatory?
 *
 * Yes, and unlike anywhere else in this layer that is not a close call: a
 * probation record consisting of six numbers and no sentence tells nobody
 * why, and this is read at the Month 6 confirmation gate by people who were
 * not in the room. The final comments box stays optional.
 */
export const OPEN_FEEDBACK_REQUIRED = true;

const TEXT_MAX = 2000;

/**
 * The header.
 *
 * `fullName` is the manager — the rule everywhere is that it names the person
 * filling the form in — and `subjectName` is the new hire being reviewed.
 * `reviewPoint` is shown because the same manager gets this form twice about
 * the same person, eight weeks apart, and "Month 1" versus "Month 3" changes
 * what a fair answer to "ready to work independently" even looks like.
 */
const FACTS: PrefilledFactSpec[] = [
  { label: "Completed by", key: "fullName" },
  { label: "New hire", key: "subjectName" },
  { label: "Job title", key: "jobTitle" },
  { label: "Department", key: "department" },
  { label: "Review point", key: "reviewPoint" },
];

const SECTIONS: FormSection[] = [
  {
    id: "readiness",
    ordinal: 1,
    title: "Readiness and performance",
    intro: SCORE_LEGEND,
    questions: [
      {
        id: "479af8f7-1f42-4c10-9cfd-5901cdb3a656",
        label: "How well does the new hire understand their role and responsibilities?",
        type: "scale",
        required: true,
        options: SCALE_OPTIONS,
        anchors: SCORE_ANCHORS,
      },
      {
        id: "661719d7-23d6-4049-90c1-548ca65ddce8",
        label: "How effectively has the new hire integrated into the team?",
        type: "scale",
        required: true,
        options: SCALE_OPTIONS,
        anchors: SCORE_ANCHORS,
      },
      {
        id: "65c830f2-0c66-45ef-bde7-3371cc53d2f2",
        label: "How would you rate the new hire's ability to meet initial performance goals?",
        type: "scale",
        required: true,
        options: SCALE_OPTIONS,
        anchors: SCORE_ANCHORS,
      },
      {
        id: "20edde00-b002-4f66-96b5-5e4789ad02e0",
        label: "How prepared is the new hire to handle their daily tasks independently?",
        type: "scale",
        required: true,
        options: SCALE_OPTIONS,
        anchors: SCORE_ANCHORS,
      },
      {
        id: "269183ca-73c8-4a2d-a518-2d37a45c8148",
        label: "How aligned is the new hire with the company's values and culture?",
        type: "scale",
        required: true,
        options: SCALE_OPTIONS,
        anchors: SCORE_ANCHORS,
      },
    ],
  },
  {
    id: "open",
    ordinal: 2,
    title: "In your own words",
    questions: [
      {
        id: "468efe41-37bb-4def-8152-93f69dc1e8c0",
        label: "What strengths has the new hire demonstrated during their initial period?",
        type: "text",
        required: OPEN_FEEDBACK_REQUIRED,
        maxLength: TEXT_MAX,
      },
      {
        id: "7f8bef92-869f-492e-8532-23f100550b19",
        label: "What areas of improvement could help the new hire succeed further?",
        type: "text",
        required: OPEN_FEEDBACK_REQUIRED,
        maxLength: TEXT_MAX,
      },
      {
        id: "685db2f4-e3d3-4c58-a108-3664009ddc29",
        /**
         * The one question on this form that asks what *Kenafric* owes the
         * new hire rather than what the new hire owes Kenafric. It is why the
         * instrument is worth sending at Month 1 rather than only at Month 3
         * — a gap named in week four can still be closed.
         */
        label: "What additional support or resources do you think the new hire needs?",
        type: "text",
        required: OPEN_FEEDBACK_REQUIRED,
        maxLength: TEXT_MAX,
      },
    ],
  },
  {
    id: "impression",
    ordinal: 3,
    title: "Overall impression",
    intro: SCORE_LEGEND,
    questions: [
      {
        id: "62ca0de5-6f17-464f-a19a-9bec86e705b0",
        /**
         * G-8, closed. V1 filed this against `Overal Impression`
         * (`835df2a4-…`) — the section heading, misspelling and all, which
         * is not a question and could not be asked as one. A field named for
         * the actual question was created on 2026-09-10 and this writes to
         * that instead.
         *
         * `Overal Impression` still exists on the list and is now dead for
         * this form. It should be deleted or archived once anything reading
         * it has been repointed, because two fields holding one answer is
         * how a report quietly halves.
         */
        label: "Do you believe the new hire is ready to contribute effectively in their role?",
        type: "scale",
        required: true,
        options: SCALE_OPTIONS,
        anchors: SCORE_ANCHORS,
      },
    ],
  },
  {
    id: "comments",
    ordinal: 4,
    title: "Anything else",
    questions: [
      {
        id: "70120fb4-8691-4c62-b8a2-b1524d2ae738",
        label: "Please share any additional feedback or suggestions.",
        type: "text",
        required: false,
        maxLength: TEXT_MAX,
      },
    ],
  },
];

export const NEW_HIRE_READINESS: FeedbackFormSpec = {
  formTypes: ["MNHR"],
  title: "How is your new hire settling in?",
  intro:
    "Ten questions on how one of your new team members is doing, about three minutes. It is part of their probation record, and it is also how we find out what support they are missing.",
  voice: voices.newHireReadiness,
  facts: FACTS,
  sections: SECTIONS,
  ratingQuestions: RATING_QUESTION_IDS,
};

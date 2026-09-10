/**
 * F3 — the Manager Recruitment Review. Build B.
 *
 * The requesting manager, once, on the day the position they raised closes as
 * filled. It marks **the recruitment process**, not the person who was hired
 * — that is F4, a different form on a different clock — and the copy says so,
 * because a manager who thinks they are appraising their new report will
 * answer a different set of questions than the one they were asked.
 *
 * Ten questions. The Airtable form had eleven: the first asked the manager to
 * type their own name. It is prefilled here, which is the entire rebuild in
 * one line.
 *
 * ---
 * QUESTION TEXT is verbatim from the V1 form, including the "On a scale of
 * 1-5" openings that are now redundant beside a visible 1-5 control. Reworded
 * questions measure something slightly different from the ones they replace,
 * and this instrument's whole value is being comparable to the round before.
 *
 * FIELD IDS are complete UUIDs read live from `Feedback Responses`
 * (901220480198) on 2026-09-10 — including `674d4bc9` and `51651fc5`, which
 * the phase-plan audit carried abbreviated to eight characters. Nothing here
 * is withheld. An id that is not a complete UUID withholds its own question
 * rather than filing an answer nowhere; see `schema.ts`.
 * ---
 */

import { voices } from "./locale";
import type { FeedbackFormSpec, FormSection, PrefilledFactSpec } from "./schema";

/**
 * The five options of every 1-5 question on this form.
 *
 * They are the ClickUp option NAMES, and the names really are the strings "1"
 * to "5" — so the answer posted is `"4"`, not `4`. WF-21 resolves the name
 * against the live field schema; a number would resolve to nothing.
 */
export const SCALE_OPTIONS = ["1", "2", "3", "4", "5"] as const;

/**
 * The seven questions that average into `Overall Rating`.
 *
 * `Comparison with Previous Hiring Rounds` is deliberately not among them.
 * It is categorical — Improved, Stayed the same, Declined — and averaging a
 * category produces a number that looks like a score and means nothing.
 */
export const RATING_QUESTION_IDS = [
  "9504832d-2815-422e-a036-4c66e2eaaece",
  "ac470551-9fa4-496d-9fd1-79371bdee0cd",
  "fe49981e-1c5f-4b91-aead-834f911be43a",
  "ed015a41-2da0-4fc9-a6ba-dd882e4998a8",
  "f96b2aff-d3a6-4951-b14d-f6a45fb431fe",
  "144cdfc5-3847-4407-9bea-cb25c5fafb13",
  "936da5d6-7cbc-4ab7-8dd1-7dd2674d0191",
] as const;

/**
 * Are the two open questions mandatory?
 *
 * They were in Airtable, and unlike the candidate survey this one goes to a
 * colleague who raised the requisition rather than to somebody who has just
 * been turned down — the abandonment risk that made D-14 recommend optional
 * prose does not apply in the same way, and "what worked" and "what to
 * change" are the two answers HR actually acts on.
 *
 * One boolean, because that is the whole cost of changing our minds.
 */
export const OPEN_FEEDBACK_REQUIRED = true;

/** ClickUp text fields hold more; a survey answer longer than this is a letter. */
const TEXT_MAX = 2000;

/**
 * The header. Four lines, none of them typed.
 *
 * `fullName` is the manager here, not the candidate — the rule across every
 * instrument is that it names the person filling the form in. `hiresMade` is
 * how many people were hired against this requisition, which is the context
 * that makes "quality of candidate pool" answerable: one hire out of forty
 * applicants is a different round from three out of five.
 */
const FACTS: PrefilledFactSpec[] = [
  { label: "Manager", key: "fullName" },
  { label: "Role recruited", key: "positionTitle" },
  { label: "Hires made", key: "hiresMade" },
  { label: "Department", key: "department" },
  { label: "Company", key: "company" },
];

const SECTIONS: FormSection[] = [
  {
    id: "process",
    ordinal: 1,
    title: "The recruitment process for this role",
    intro: "Seven scores, 1 to 5. What each end means is written under it.",
    questions: [
      {
        id: "9504832d-2815-422e-a036-4c66e2eaaece",
        topic: "Clarity of job requirements",
        label:
          "On a scale of 1-5, how clear were the job responsibilities, qualifications, and desired competencies communicated to you before interviewing candidates?",
        type: "scale",
        required: true,
        options: SCALE_OPTIONS,
        anchors: { low: "Not clear at all", high: "Extremely clear" },
      },
      {
        id: "ac470551-9fa4-496d-9fd1-79371bdee0cd",
        topic: "Quality of candidate pool",
        label:
          "On a scale of 1-5, how satisfied were you with the overall quality and relevance of the candidates presented for this role?",
        type: "scale",
        required: true,
        options: SCALE_OPTIONS,
        anchors: { low: "Very dissatisfied", high: "Very satisfied" },
      },
      {
        id: "fe49981e-1c5f-4b91-aead-834f911be43a",
        topic: "Timeliness of the recruitment process",
        label: "How would you rate the efficiency and speed of the recruitment process?",
        type: "scale",
        required: true,
        options: SCALE_OPTIONS,
        anchors: { low: "Very inefficient", high: "Very efficient" },
      },
      {
        id: "ed015a41-2da0-4fc9-a6ba-dd882e4998a8",
        topic: "Effectiveness of communication",
        label:
          "How would you rate the communication from the HR/Recruitment team throughout the hiring process (e.g., candidate updates, scheduling, feedback loop)?",
        type: "scale",
        required: true,
        options: SCALE_OPTIONS,
        anchors: { low: "Poor", high: "Excellent" },
      },
      {
        id: "f96b2aff-d3a6-4951-b14d-f6a45fb431fe",
        topic: "Interview support and resources",
        label:
          "To what extent did you feel adequately supported with tools, guidelines, or training to conduct effective interviews?",
        type: "scale",
        required: true,
        options: SCALE_OPTIONS,
        anchors: { low: "Not supported", high: "Fully supported" },
      },
      {
        id: "144cdfc5-3847-4407-9bea-cb25c5fafb13",
        topic: "Alignment of candidates with organizational values",
        /**
         * "Kenafric Group" is the V1 wording and is kept. It is not the
         * `{{company}}` case: the candidate's recommend question names one of
         * nine legal entities and had to be substituted, whereas the values
         * being scored here are the group's and are the same in every entity.
         */
        label:
          "How satisfied were you with how well the candidates aligned with Kenafric Group's culture and core values?",
        type: "scale",
        required: true,
        options: SCALE_OPTIONS,
        anchors: { low: "Not satisfied", high: "Very satisfied" },
      },
      {
        id: "936da5d6-7cbc-4ab7-8dd1-7dd2674d0191",
        topic: "Decision-making process",
        label:
          "How would you evaluate the support provided in making final hiring decisions (e.g., having all necessary information, timely evaluation forms, clear next steps)?",
        type: "scale",
        required: true,
        options: SCALE_OPTIONS,
        anchors: { low: "Poor", high: "Excellent" },
      },
    ],
  },
  {
    id: "comparison",
    ordinal: 2,
    title: "Compared with last time",
    questions: [
      {
        id: "adf71af4-59d2-4b52-837a-b9002a77ca0a",
        topic: "Comparison with previous hiring rounds",
        label:
          "Compared to previous recruitment experiences at Kenafric Group, do you feel this process has improved, stayed the same, or declined?",
        type: "choice",
        required: true,
        // Verbatim from the live field, in ClickUp's own order
        options: ["Improved", "Stayed the same", "Declined"],
      },
    ],
  },
  {
    id: "open",
    ordinal: 3,
    title: "In your own words",
    questions: [
      {
        id: "674d4bc9-6b4f-4038-8241-e772c4bcf0c7",
        topic: "Main strengths of the current recruitment process",
        label: "In your opinion, what worked particularly well this time around?",
        type: "text",
        required: OPEN_FEEDBACK_REQUIRED,
        maxLength: TEXT_MAX,
      },
      {
        id: "51651fc5-854e-46ab-8f7c-28d6eca4dcc5",
        topic: "Areas for improvement",
        label:
          "What changes would you recommend to enhance the recruitment process for future hires?",
        type: "text",
        required: OPEN_FEEDBACK_REQUIRED,
        maxLength: TEXT_MAX,
      },
    ],
  },
];

export const MANAGER_RECRUITMENT_REVIEW: FeedbackFormSpec = {
  formTypes: ["MRR"],
  title: "How did this recruitment go?",
  intro:
    "You raised this role and it is now filled. Ten questions on how the recruitment itself went, about three minutes. It reviews our process, not the person you hired.",
  voice: voices.managerRecruitment,
  facts: FACTS,
  sections: SECTIONS,
  ratingQuestions: RATING_QUESTION_IDS,
};

/**
 * F1 and F2 — the Candidate Recruitment Review, and its internal twin.
 *
 * **One spec, one route, two `formType` values.** The questions are
 * identical; the only differences are that an internal applicant's payroll
 * number is shown back to them in the header, and that WF-14 tags the
 * response `Internal Candidate Recruitment Review Form` instead. In Airtable
 * these were two separate forms, they drifted, and the internal one shipped
 * with no `Form` tag at all — so every internal response ever submitted is
 * invisible to every report. Two files here would drift the same way.
 *
 * Question text is verbatim from the live ClickUp field names. Where a field
 * name was truncated to fit ClickUp's 100-character cap, the full question is
 * asked here and the cap is ClickUp's problem rather than the candidate's.
 *
 * ---
 * FIELD IDS. Every id below is a complete ClickUp custom field UUID, verified
 * against the live `Feedback Responses` list (901220480198). Four of the five
 * free-text fields first reached us abbreviated to eight characters and were
 * held that way — `isFieldId` rejected them, so `askableSections` withheld the
 * questions rather than asking them and dropping the answers. They were
 * completed on 2026-09-09 and all twenty questions now render.
 *
 * The mechanism stays: an id that is not a complete UUID withholds its own
 * question. That is what stops a careless paste from silently filing a real
 * answer against nothing.
 * ---
 */

import type { FeedbackFormSpec, FormSection } from "./schema";

/**
 * The eight Kenafric values, verbatim and in order.
 *
 * The field name "How well did our recruitment process reflect Kenafric's
 * values?" was truncated for the 100-character cap, and the values themselves
 * went with the tail of it. A candidate cannot score a process against values
 * nobody has told them, so they are rendered as helper text under the
 * question.
 */
export const KENAFRIC_VALUES =
  "Kinetic · Execute · Nimble · Ambitious · Fun · Robust · Innovative · Caring";

/**
 * The 13 five-star questions, in the order they are asked.
 *
 * This list is what averages into `Overall Rating`. WF-14 computes the figure
 * it stores; the app computes the same one only for what the candidate is
 * shown and for the log line.
 */
export const RATING_QUESTION_IDS = [
  "a74b7b20-5e86-4d94-93e2-13e32930b60f",
  "fad94172-668b-4d4b-b3dd-41056fde0ed5",
  "0107ed0d-566e-4da4-a164-5b41763660ef",
  "4b3ef640-cbec-46ed-942c-2449e2c88b26",
  "1330bc57-7bc2-4f81-9908-3fd8d4b806b8",
  "5697b65d-eb6f-4c62-a02a-f3958fe64b18",
  "ec73497f-d222-4f67-a704-a3765ef8d4c4",
  "589dd645-d5ec-4672-b4f3-24c6cd1b589a",
  "c7bf0ced-c3bd-4416-8e58-b0d11d12cb92",
  "9273d0e7-df76-4521-9c3e-626f752f4da5",
  "07dee0d0-1761-4388-b51c-8e6eced59888",
  "745e496a-0382-4bd3-a777-ad59a9e0e5c4",
  "24e6c339-bcd0-4337-bd5a-9448c7de583d",
] as const;

/**
 * Are the five free-text answers mandatory?
 *
 * Airtable made all of them required. Mandatory prose is the single biggest
 * driver of survey abandonment, and the 13 ratings are what the report is
 * built from — so they are optional here.
 *
 * **This is open with HR as D-14.** It is one boolean because that is the
 * whole cost of changing our minds.
 */
export const FREE_TEXT_REQUIRED = false;

/** ClickUp text fields hold more than this; a survey answer that long is a letter. */
const TEXT_MAX = 2000;

const SECTIONS: FormSection[] = [
  {
    id: "application",
    ordinal: 1,
    title: "Initial application experience",
    intro: "Thinking back to when you first found the role and applied.",
    questions: [
      {
        id: "a74b7b20-5e86-4d94-93e2-13e32930b60f",
        label: "How would you rate the clarity of our job description?",
        type: "stars",
        required: true,
      },
      {
        id: "fad94172-668b-4d4b-b3dd-41056fde0ed5",
        label: "How easy was it to submit your application?",
        type: "stars",
        required: true,
      },
      {
        id: "0107ed0d-566e-4da4-a164-5b41763660ef",
        label:
          "How satisfied were you with the communication during the application process?",
        type: "stars",
        required: true,
      },
    ],
  },
  {
    id: "interview",
    ordinal: 2,
    title: "Interview process",
    questions: [
      {
        id: "4b3ef640-cbec-46ed-942c-2449e2c88b26",
        label: "The professionalism of our recruitment team?",
        type: "stars",
        required: true,
      },
      {
        id: "1330bc57-7bc2-4f81-9908-3fd8d4b806b8",
        label:
          "The clarity of information provided about Kenafric's culture and values?",
        type: "stars",
        required: true,
      },
      {
        id: "5697b65d-eb6f-4c62-a02a-f3958fe64b18",
        label: "The relevance of interview questions to the position?",
        type: "stars",
        required: true,
      },
      {
        id: "ec73497f-d222-4f67-a704-a3765ef8d4c4",
        label: "The preparedness of your interviewers?",
        type: "stars",
        required: true,
      },
      {
        id: "589dd645-d5ec-4672-b4f3-24c6cd1b589a",
        label: "The timeliness of interview scheduling and communication?",
        type: "stars",
        required: true,
      },
    ],
  },
  {
    id: "communication",
    ordinal: 3,
    title: "Communication and feedback",
    questions: [
      {
        id: "c7bf0ced-c3bd-4416-8e58-b0d11d12cb92",
        label: "How well did we keep you informed throughout the process?",
        type: "stars",
        required: true,
      },
      {
        id: "9273d0e7-df76-4521-9c3e-626f752f4da5",
        label: "The clarity of next steps after each interaction?",
        type: "stars",
        required: true,
      },
      {
        id: "07dee0d0-1761-4388-b51c-8e6eced59888",
        label: "The timeliness of our responses to your queries?",
        type: "stars",
        required: true,
      },
      {
        id: "745e496a-0382-4bd3-a777-ad59a9e0e5c4",
        label: "The quality of feedback provided after interviews?",
        type: "stars",
        required: true,
      },
    ],
  },
  {
    id: "overall",
    ordinal: 4,
    title: "Overall experience",
    questions: [
      {
        id: "9a21e6ae-5493-47a9-9ab1-87d6002216eb",
        label: "How would you describe our hiring process?",
        type: "choice",
        required: true,
        options: [
          "Easy and engaging",
          "Easy but time-consuming",
          "Challenging but well-organized",
          "Needs improvement",
        ],
      },
      {
        id: "006db82e-6dfe-4554-ab17-29d0fed62b9f",
        label: "What aspects of our recruitment process impressed you the most?",
        type: "text",
        required: FREE_TEXT_REQUIRED,
        maxLength: TEXT_MAX,
      },
      {
        id: "f109d805-06dc-4870-b59b-64bd4868a3e8",
        label: "What could we improve in our recruitment process?",
        type: "text",
        required: FREE_TEXT_REQUIRED,
        maxLength: TEXT_MAX,
      },
      {
        id: "3f0cddbc-8693-4d5d-a7f0-50464c516ec2",
        label:
          "Did the recruitment process give you a good understanding of Kenafric's products and culture?",
        type: "text",
        required: FREE_TEXT_REQUIRED,
        maxLength: TEXT_MAX,
      },
      {
        id: "650c074f-e656-446b-a51a-7f1ff7177af7",
        label:
          "Were there any moments during the process that stood out as particularly positive or negative?",
        type: "text",
        required: FREE_TEXT_REQUIRED,
        maxLength: TEXT_MAX,
      },
    ],
  },
  {
    id: "values",
    ordinal: 5,
    title: "Company culture and values",
    questions: [
      {
        id: "24e6c339-bcd0-4337-bd5a-9448c7de583d",
        label: "How well did our recruitment process reflect Kenafric's values?",
        help: KENAFRIC_VALUES,
        type: "stars",
        required: true,
      },
    ],
  },
  {
    id: "final",
    ordinal: 6,
    title: "Final feedback",
    questions: [
      {
        id: "d27d7a83-c193-4173-a07a-6691b90eea4b",
        /**
         * The ClickUp field is named for Kenafric Industries Ltd, but the hire
         * may have been for KML, KBBL or Properties. `{{company}}` is
         * substituted from the prefilled employing entity, and falls back to
         * "Kenafric" rather than naming the wrong company at somebody.
         */
        label: "Would you recommend {{company}} as an employer to others?",
        type: "choice",
        required: true,
        options: ["Yes", "No"],
      },
      {
        id: "f7994a03-2a34-4623-8fa6-065a3fddaf8c",
        label:
          "Any additional comments or suggestions to help us improve our recruitment process?",
        type: "text",
        required: FREE_TEXT_REQUIRED,
        maxLength: TEXT_MAX,
      },
    ],
  },
];

export const CANDIDATE_REVIEW: FeedbackFormSpec = {
  formTypes: ["CRR", "ICRR"],
  title: "Your recruitment experience",
  intro:
    "You interviewed with us recently and we would like to know how it went. It takes about three minutes, it is read by our HR team, and it will not affect your application.",
  sections: SECTIONS,
  ratingQuestions: RATING_QUESTION_IDS,
};

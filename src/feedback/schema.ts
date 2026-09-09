/**
 * The shape of a feedback form, and the one rule about ClickUp field ids.
 *
 * Four instruments will be built on this (the candidate review, the manager
 * recruitment review, the new-hire readiness review and the employee
 * check-in). They differ only in their question list, so the renderer is
 * generic and each form is a config object: sections, and questions in the
 * order the person reads them.
 *
 * ---
 * **`answers` is keyed by ClickUp custom field id.** That is the single
 * decision the whole layer rests on: WF-14 carries no question-text mapping
 * table, so rewording a question never breaks the workflow, and adding an
 * instrument later needs no workflow change at all. The question text and its
 * field id sit side by side here, in the app, and nowhere else.
 *
 * The cost is that a wrong id writes a real answer to the wrong field, or to
 * none, and neither fails loudly. So an id is either a complete UUID or it is
 * not usable, and `isFieldId` is the only thing that decides. A question whose
 * id is not complete is NOT ASKED — see `askableSections`. Asking somebody a
 * question and then dropping their answer is the V1 failure this whole phase
 * exists to undo.
 * ---
 */

/**
 * Which instrument this is. The same five codes the token's `ft` claim uses,
 * so a log line, a token and a form spec all say the same word.
 *
 * `CRR` and `ICRR` are Build A and are live. The rest are declared now
 * because WF-14 branches on them from the start.
 */
export type FormType = "CRR" | "ICRR" | "MRR" | "MNHR" | "EEC";

/** The `Form Type` option name WF-14 writes, per form. Names, never UUIDs. */
export const FORM_TYPE_LABEL: Record<FormType, string> = {
  CRR: "Candidate Recruitment Review Form",
  ICRR: "Internal Candidate Recruitment Review Form",
  MRR: "Manager Recruitment Review Form",
  MNHR: "Manager Feedback on New Hire Readiness & Performance",
  EEC: "Employee Experience & Engagement Check-In",
};

export const isFormType = (value: unknown): value is FormType =>
  typeof value === "string" && value in FORM_TYPE_LABEL;

/**
 * A ClickUp custom field id.
 *
 * The audit that produced these question lists abbreviated some ids to their
 * first eight characters. An abbreviation is held here verbatim rather than
 * completed by guesswork: it fails `isFieldId`, so the question it belongs to
 * is withheld until somebody supplies the real id.
 */
const FIELD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const isFieldId = (value: string): boolean => FIELD_ID.test(value);

/**
 * `stars`  — ClickUp `emoji`, count 5. Posted as an **integer 1-5**.
 * `scale`  — ClickUp `drop_down` whose option names are the strings "1".."5".
 *            Posted as a string, because that is what the option is called.
 * `choice` — ClickUp `drop_down`. Posted as the option **name**; WF-14
 *            resolves it against the live schema. Never an option UUID: those
 *            change if anyone rebuilds a field, and a public bundle has no
 *            business holding one.
 * `text`   — ClickUp `text`. Posted as a string.
 */
export type QuestionType = "stars" | "scale" | "choice" | "text";

export interface Question {
  /** The ClickUp custom field id. The key this answer is posted under. */
  id: string;
  /** Rendered verbatim. `{{company}}` is substituted from the prefill. */
  label: string;
  /** Sits below the control, so every control in a section starts level. */
  help?: string;
  type: QuestionType;
  required: boolean;
  /** `choice` only. Option names, in the order ClickUp holds them. */
  options?: readonly string[];
  /** `text` only. Refused above this, and counted down from 200 remaining. */
  maxLength?: number;
}

export interface FormSection {
  /** Stable across a build, so "section 3" means one thing on the phone. */
  id: string;
  /** "Section 1", as the person sees it. */
  ordinal: number;
  title: string;
  intro?: string;
  questions: readonly Question[];
}

export interface FeedbackFormSpec {
  /** Which `formType` values this spec renders. Build A serves two. */
  formTypes: readonly FormType[];
  /** The h1. */
  title: string;
  intro: string;
  sections: readonly FormSection[];
  /**
   * The questions that average into `Overall Rating`.
   *
   * Named explicitly rather than derived from `type === "stars"`, because a
   * categorical dropdown must never be averaged and a future form may score
   * on a subset. WF-14 computes the figure it stores; this is only for what
   * the person is shown and for the log line.
   */
  ratingQuestions: readonly string[];
}

/**
 * A question's DOM id.
 *
 * A ClickUp field id is a UUID, and a DOM id may not begin with a digit, so
 * every one is prefixed. `q-<uuid>` names the control or the group,
 * `q-<uuid>-field` is the scroll target, and `-label`, `-help` and `-error`
 * are what describe it. Same job as `fieldId` in `onboarding/form.ts`, and
 * here in the model layer for the same reason: four things need to agree on
 * it, and only one of them is the field itself.
 */
export const questionDomId = (fieldId: string): string => `q-${fieldId}`;

/**
 * `{{company}}` — the employing entity, from the prefill.
 *
 * The ClickUp field that asks whether somebody would recommend Kenafric is
 * named for one of the nine legal entities, and the candidate may have
 * interviewed with another. Substituting keeps the question true without
 * renaming a field that reporting already depends on.
 */
export const renderLabel = (label: string, company: string): string =>
  label.replace(/\{\{company\}\}/g, company);

/** Every question in a spec, in reading order. */
export const allQuestions = (spec: FeedbackFormSpec): Question[] =>
  spec.sections.flatMap((section) => [...section.questions]);

/**
 * The questions that may actually be asked: the ones whose ClickUp field id
 * is complete.
 *
 * A section left with no askable question is dropped whole, so the form never
 * renders an empty heading, and the remaining sections are renumbered — the
 * person reads "Section 1, 2, 3", not "Section 1, 3, 5".
 */
export const askableSections = (spec: FeedbackFormSpec): FormSection[] =>
  spec.sections
    .map((section) => ({
      ...section,
      questions: section.questions.filter((question) => isFieldId(question.id)),
    }))
    .filter((section) => section.questions.length > 0)
    .map((section, index) => ({ ...section, ordinal: index + 1 }));

/**
 * The questions withheld because their field id is incomplete.
 *
 * Surfaced in development so the gap is visible to whoever is building, and
 * never to the person filling the form in — they cannot act on it, and a
 * survey that apologises for itself gets abandoned.
 */
export const withheldQuestions = (spec: FeedbackFormSpec): Question[] =>
  allQuestions(spec).filter((question) => !isFieldId(question.id));

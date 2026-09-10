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
 * decision the whole layer rests on: WF-21 carries no question-text mapping
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
 * because WF-21 branches on them from the start.
 */
export type FormType = "CRR" | "ICRR" | "MRR" | "MNHR" | "EEC";

/** The `Form Type` option name WF-21 writes, per form. Names, never UUIDs. */
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
 * `choice` — ClickUp `drop_down`. Posted as the option **name**; WF-21
 *            resolves it against the live schema. Never an option UUID: those
 *            change if anyone rebuilds a field, and a public bundle has no
 *            business holding one.
 * `text`   — ClickUp `text`. Posted as a string.
 */
export type QuestionType = "stars" | "scale" | "choice" | "text";

export interface Question {
  /** The ClickUp custom field id. The key this answer is posted under. */
  id: string;
  /**
   * The short name of the thing being scored, above the question.
   *
   * Only the manager recruitment review needs one: its ClickUp fields are
   * named `Clarity of Job Requirements` and the like, which is what HR reads
   * on the report, while the question actually put to the manager is a
   * sentence. Both are shown — the topic so a manager can scan seven of them,
   * the sentence so they know what they are scoring.
   */
  topic?: string;
  /** Rendered verbatim. `{{company}}` is substituted from the prefill. */
  label: string;
  /** Sits below the control, so every control in a section starts level. */
  help?: string;
  type: QuestionType;
  required: boolean;
  /** `choice` and `scale`. Option names, in the order ClickUp holds them. */
  options?: readonly string[];
  /**
   * `scale` only. What 1 and 5 mean on this particular question.
   *
   * A bare 1-5 row is not a scale, it is five numbers: `1 – Very inefficient`
   * and `5 – Very efficient` are the difference between a considered answer
   * and a guess. They sit at the ends of the row rather than in `help`,
   * because an anchor away from the number it anchors is a legend to be
   * cross-referenced.
   */
  anchors?: { low: string; high: string };
  /** `text` only. Refused above this, and counted down from 200 remaining. */
  maxLength?: number;
  /**
   * Take the ClickUp field id from the context endpoint instead of from `id`.
   *
   * The UI still keys on `id` — it is the DOM id, the error key and the answer
   * key in local state — and only the POSTED key is substituted, in
   * `payload.ts`. So a server that sends nothing, or something malformed,
   * changes nothing on screen.
   */
  idFrom?: ContextFieldKey;
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

/**
 * A value the context endpoint prefills. The keys of `FeedbackPrefill`.
 *
 * Stated as a union rather than `keyof FeedbackPrefill` to keep the model
 * layer free of a `session.ts` import; `session.test.ts` pins the two lists
 * together so they cannot drift.
 */
/**
 * A field id the CONTEXT ENDPOINT supplies, overriding the one in the spec.
 *
 * One key so far. `d27d7a83` — the recommend question — has already been
 * rebuilt once in ClickUp, and a rebuilt field gets a new UUID: the answer
 * then posts to an id that no longer exists and is dropped without an error
 * anywhere. So for that question the server names the field and the spec's
 * own id is only a fallback.
 *
 * It is deliberately NOT how every id works. A spec whose ids all came from
 * the wire could not be tested against ClickUp at all, and `isFieldId` would
 * have nothing to check.
 */
export type ContextFieldKey = "recommendFieldId";

export type PrefillKey =
  | "fullName"
  | "email"
  | "subjectName"
  | "payroll"
  | "positionTitle"
  | "hiresMade"
  | "jobTitle"
  | "company"
  | "department"
  | "recruitmentType"
  | "reviewPoint";

/**
 * One line of the header: something Kenafric already holds, shown back.
 *
 * The header is per instrument because who is reading changes what the same
 * value means — `fullName` is the candidate on Build A and the *manager* on
 * Build B, and on Build C the manager's name and the new hire's name are two
 * different lines. A header hardcoded in the renderer got Build A right and
 * would have got both manager forms wrong.
 */
export interface PrefilledFactSpec {
  label: string;
  key: PrefillKey;
  /**
   * Shown only for these form types. Absent means always — subject to the
   * value existing at all, which `PrefilledFact` decides.
   */
  onlyFor?: readonly FormType[];
}

/**
 * The strings whose wording depends on who is reading.
 *
 * Everything shared — the star legend, the progress count, "go to the first
 * one" — stays in `locale.ts` and is the same for everybody. These five are
 * not: a candidate is told their feedback will not affect their application,
 * which is meaningless to a line manager, and "you rated your overall
 * experience" is wrong when what they rated was somebody else's first month.
 *
 * The strings themselves live in `locale.ts` with the rest, so translating
 * the layer never means reading a spec or a component.
 */
export interface FeedbackVoice {
  /** Above the h1. */
  eyebrow: string;
  /**
   * Over the prefilled header.
   *
   * "Your details" on the candidate and manager-recruitment forms. Not on the
   * new-hire readiness form, where half the block is somebody else's details.
   */
  detailsHeading: string;
  /** Who reads the answers and what they are used for. */
  privacyNote: string;
  /** The already-answered screen. */
  alreadyBody: string;
  /** The thank-you screen. */
  successBody: string;
  /** The rating, said back. */
  successRating: (rating: number) => string;
}

export interface FeedbackFormSpec {
  /** Which `formType` values this spec renders. Build A serves two. */
  formTypes: readonly FormType[];
  /** The h1. */
  title: string;
  intro: string;
  /** How this instrument speaks to the person filling it in. */
  voice: FeedbackVoice;
  /** The header: what is shown back rather than asked for. */
  facts: readonly PrefilledFactSpec[];
  sections: readonly FormSection[];
  /**
   * The questions that average into `Overall Rating`.
   *
   * Named explicitly rather than derived from `type === "stars"`, because a
   * categorical dropdown must never be averaged and a future form may score
   * on a subset. WF-21 computes the figure it stores; this is only for what
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

/**
 * Does this spec render that instrument?
 *
 * Each form has its own route, and the route decides which spec is loaded
 * while the CONTEXT ENDPOINT decides which instrument the token is for. When
 * those two disagree — a candidate-review token opened at the new-hire
 * readiness address — the page must refuse. Rendering anyway would put ten
 * questions about somebody's probation in front of a candidate and file the
 * answers under `CRR`.
 *
 * It is not a case that arises from a mistyped URL: a token that does not
 * verify never gets this far. It arises from a bug in what WF-23 or WF-24
 * put in the email, which is exactly the kind of thing that must fail
 * visibly the first time rather than quietly produce mislabelled data.
 */
export const servesFormType = (spec: FeedbackFormSpec, formType: FormType): boolean =>
  spec.formTypes.includes(formType);

/**
 * The header lines this instrument shows to this reader.
 *
 * Filtered by form type only. Whether a line has a value to show is
 * `PrefilledFact`'s decision, so a null payroll number leaves no gap.
 */
export const visibleFacts = (
  spec: FeedbackFormSpec,
  formType: FormType,
): PrefilledFactSpec[] =>
  spec.facts.filter((fact) => !fact.onlyFor || fact.onlyFor.includes(formType));

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

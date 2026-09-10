import * as React from "react";
import { AlertTriangle, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/careers/primitives";
import { cn } from "@/lib/utils";
import { useFeedbackSubmit } from "@/hooks/useFeedbackSubmit";
import type { Answers, AnswerValue } from "@/feedback/contract";
import { copy } from "@/feedback/locale";
import { logFeedback } from "@/feedback/log";
import { buildSubmission } from "@/feedback/payload";
import {
  askableSections,
  questionDomId,
  visibleFacts,
  withheldQuestions,
  type FeedbackFormSpec,
  type Question,
} from "@/feedback/schema";
import { companyName, type FeedbackContext } from "@/feedback/session";
import {
  answeredCount,
  askableCount,
  overallRating,
  validate,
  type AnswerErrors,
} from "@/feedback/validation";
import { ChoiceField, LongTextField, PrefilledFact, ScaleField, StarField } from "./fields";
import { FeedbackSubmitted } from "./FeedbackStates";

/**
 * The generic feedback form.
 *
 * One renderer for all four builds. It knows about sections, question types
 * and the prefill; it knows nothing about which instrument it is rendering.
 * Everything specific lives in the spec it is handed — `feedback/
 * candidateReview.ts` for Build A — so the manager and check-in forms are a
 * config object and a route each, not another form.
 */

const Panel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={cn(
      "overflow-hidden rounded-lg border border-mist-200 bg-white shadow-sm",
      className,
    )}
  >
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

export const FeedbackForm = ({
  token,
  context,
  spec,
}: {
  token: string;
  context: FeedbackContext;
  spec: FeedbackFormSpec;
}) => {
  const [answers, setAnswers] = React.useState<Answers>({});
  /**
   * Which questions may show an error.
   *
   * Errors appear on blur, never on keystroke — the same rule the requisition
   * form keeps, because telling somebody their answer is wrong before they
   * have finished giving it is noise. A choice or a star answer is complete
   * the moment it is made, so those touch immediately; a textarea waits for
   * blur. A submit attempt touches everything at once.
   */
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = React.useState(false);
  const { state, submit } = useFeedbackSubmit();

  const sections = React.useMemo(() => askableSections(spec), [spec]);
  const withheld = React.useMemo(() => withheldQuestions(spec), [spec]);
  const facts = React.useMemo(
    () => visibleFacts(spec, context.formType),
    [spec, context.formType],
  );
  const company = companyName(context);
  const voice = spec.voice;

  const { errors, missing } = React.useMemo(() => validate(spec, answers), [spec, answers]);
  const rating = React.useMemo(() => overallRating(spec, answers), [spec, answers]);
  const asked = React.useMemo(() => askableCount(spec), [spec]);
  const answered = React.useMemo(() => answeredCount(spec, answers), [spec, answers]);

  /** What WF-21 said was wrong, keyed the same way the local errors are. */
  const serverErrors: AnswerErrors = React.useMemo(() => {
    if (state.status !== "rejected") return {};
    return state.issues.reduce<AnswerErrors>((all, issue) => {
      if (issue.field) all[issue.field] = issue.message;
      return all;
    }, {});
  }, [state]);

  const shownError = (question: Question): string | undefined =>
    serverErrors[question.id] ??
    (attempted || touched[question.id] ? errors[question.id] : undefined);

  const setAnswer = (question: Question, value: AnswerValue) => {
    setAnswers((current) => ({ ...current, [question.id]: value }));
    // A rating or a choice is finished the instant it is given
    if (question.type !== "text") {
      setTouched((current) => ({ ...current, [question.id]: true }));
    }
  };

  const focusQuestion = (fieldId: string) => {
    const target = document.getElementById(`${questionDomId(fieldId)}-field`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    // The group's first control, so the keyboard lands where the eye does
    target.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true });
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAttempted(true);

    if (missing.length) {
      focusQuestion(missing[0]);
      return;
    }

    logFeedback("submitted", { formType: context.formType, asked, answered, rating });
    void submit(buildSubmission({ token, context, spec, answers }));
  };

  if (state.status === "succeeded") {
    return <FeedbackSubmitted rating={rating} voice={voice} />;
  }

  const busy = state.status === "submitting";
  /** Unattributed rejections — the ones no single question owns. */
  const looseIssues =
    state.status === "rejected" ? state.issues.filter((issue) => !issue.field) : [];

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {/*
       * Everything Kenafric already knows, shown back rather than asked for.
       *
       * This block is the whole reason the feedback layer is being rebuilt.
       * V1's five forms each asked for a name, an email, a payroll number, a
       * department and a company — all of it already held — and a typo or a
       * nickname made the response unmatchable to a candidate record for
       * ever. If a form we build ever asks for one of these, we have rebuilt
       * the V1 problem in React.
       */}
      <Panel>
        <Eyebrow>{voice.detailsHeading}</Eyebrow>
        {/*
         * Which lines these are is the spec's decision, not the renderer's.
         * `fullName` is the candidate on Build A and the manager on Build B,
         * and on Build C the manager and the new hire are two separate lines
         * — a header hardcoded here got Build A right and both manager forms
         * wrong. A fact with no value renders nothing, so a null payroll
         * number leaves no gap.
         */}
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {facts.map((fact) => (
            <PrefilledFact
              key={`${fact.key}-${fact.label}`}
              label={fact.label}
              value={context.prefill[fact.key]}
            />
          ))}
        </dl>

        <p className="measure mt-5 flex gap-2.5 text-[0.8125rem] leading-5 text-steel-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
          <span>{voice.privacyNote}</span>
        </p>
      </Panel>

      {/*
       * An operational warning from the endpoint.
       *
       * Shown to everybody, not just in development, and deliberately so:
       * the only one that exists means n8n is in TEST_MODE and is not
       * enforcing token signatures, so a hand-made link opens any
       * candidate's or employee's form. A banner is how that gets noticed
       * and switched off before a real link is sent. It says what the server
       * said — this app does not invent the wording.
       */}
      {context.warning ? (
        <Panel className="border-ember-200 bg-ember-50/40">
          <p className="measure flex gap-2.5 text-body-sm text-ink-900">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-ember-500"
              aria-hidden="true"
            />
            <span>{context.warning}</span>
          </p>
        </Panel>
      ) : null}

      {/* Dev only. A gap the person filling this in cannot act on, and a
          survey that apologises for itself gets abandoned. */}
      {import.meta.env.DEV && withheld.length ? (
        <Panel className="border-ember-200 bg-ember-50/40">
          <p className="text-body-sm font-semibold text-ink-900">
            {withheld.length} question{withheld.length === 1 ? "" : "s"} withheld in this build
          </p>
          <p className="measure mt-1.5 text-[0.8125rem] leading-5 text-steel-700">
            Their ClickUp field ids are incomplete, so they are not asked — an answer that
            cannot be stored must not be collected. Complete the ids in
            <span className="font-mono"> src/feedback/candidateReview.ts</span> and they appear.
          </p>
          <ul className="mt-3 space-y-1.5">
            {withheld.map((question) => (
              <li key={question.id} className="text-[0.8125rem] leading-5 text-steel-700">
                <span className="font-mono text-caption text-ember-500">{question.id}…</span>{" "}
                {question.label}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {sections.map((section) => (
        <Panel key={section.id}>
          <Eyebrow>Section {section.ordinal}</Eyebrow>
          <SectionHeading className="mt-2">{section.title}</SectionHeading>
          {section.intro ? (
            <p className="measure mt-2 text-body-sm text-steel-600">{section.intro}</p>
          ) : null}

          <div className="mt-6 space-y-7">
            {section.questions.map((question, index) => {
              const error = shownError(question);
              const ordinal = index + 1;

              if (question.type === "stars") {
                return (
                  <StarField
                    key={question.id}
                    question={question}
                    company={company}
                    ordinal={ordinal}
                    value={
                      typeof answers[question.id] === "number"
                        ? (answers[question.id] as number)
                        : undefined
                    }
                    onChange={(value) => setAnswer(question, value)}
                    error={error}
                  />
                );
              }

              if (question.type === "scale") {
                return (
                  <ScaleField
                    key={question.id}
                    question={question}
                    company={company}
                    ordinal={ordinal}
                    value={
                      answers[question.id] === undefined
                        ? undefined
                        : String(answers[question.id])
                    }
                    onChange={(value) => setAnswer(question, value)}
                    error={error}
                  />
                );
              }

              if (question.type === "choice") {
                return (
                  <ChoiceField
                    key={question.id}
                    question={question}
                    company={company}
                    ordinal={ordinal}
                    value={
                      answers[question.id] === undefined
                        ? undefined
                        : String(answers[question.id])
                    }
                    onChange={(value) => setAnswer(question, value)}
                    error={error}
                  />
                );
              }

              return (
                <LongTextField
                  key={question.id}
                  question={question}
                  company={company}
                  ordinal={ordinal}
                  value={answers[question.id] === undefined ? "" : String(answers[question.id])}
                  onChange={(value) => setAnswer(question, value)}
                  onBlur={() => setTouched((current) => ({ ...current, [question.id]: true }))}
                  error={error}
                />
              );
            })}
          </div>
        </Panel>
      ))}

      <Panel>
        {/* Announced, because a submit that refused is a change of state a
            screen reader user has no other way to notice */}
        <div aria-live="polite">
          {attempted && missing.length ? (
            <div className="mb-5 flex gap-3 rounded-md border border-ember-200 bg-ember-50/50 p-4">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-ember-500"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-body-sm font-semibold text-ink-900">
                  {copy.incompleteHeading(missing.length)}
                </p>
                <p className="mt-1 text-[0.8125rem] leading-5 text-steel-700">
                  {copy.incompleteBody}
                </p>
                <button
                  type="button"
                  onClick={() => focusQuestion(missing[0])}
                  className="press mt-2 rounded-sm text-[0.8125rem] font-semibold text-teal-700 underline underline-offset-4"
                >
                  {copy.incompleteJump}
                </button>
              </div>
            </div>
          ) : null}

          {looseIssues.length ? (
            <div className="mb-5 rounded-md border border-ember-200 bg-ember-50/50 p-4">
              <ul className="space-y-1.5">
                {looseIssues.map((issue, index) => (
                  <li key={index} className="text-body-sm text-ink-900">
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {state.status === "failed" ? (
            <div className="mb-5 flex gap-3 rounded-md border border-ember-200 bg-ember-50/50 p-4">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-ember-500"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-body-sm font-semibold text-ink-900">{copy.failedHeading}</p>
                <p className="mt-1 measure text-[0.8125rem] leading-5 text-steel-700">
                  {state.message}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-caption tabular-nums text-steel-600">
            {copy.progress(answered, asked)}
          </p>
          {/*
           * Disabled while in flight, and it stays disabled: the token is
           * single-use, and a second POST would be refused by WF-21's dedupe
           * guard rather than land twice. The guard is the insurance, not the
           * design.
           */}
          <Button type="submit" size="lg" disabled={busy}>
            <Send className="h-4 w-4" aria-hidden="true" />
            {busy ? copy.submitting : copy.submit}
          </Button>
        </div>

        <p className="mt-3 text-caption text-steel-500">{copy.requiredNote}</p>
      </Panel>
    </form>
  );
};

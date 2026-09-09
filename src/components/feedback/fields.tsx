import * as React from "react";
import { Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { copy } from "@/feedback/locale";
import { questionDomId, renderLabel, type Question } from "@/feedback/schema";

/**
 * Shared field furniture for the feedback forms.
 *
 * Same rules as the requisition and onboarding forms', because a person who
 * has used one of Kenafric's forms should be able to predict the next:
 *
 * - Label and help come from the question spec, never the call site.
 * - Help sits BELOW the control, so every control in a section starts level.
 * - An error is never colour alone — an Ember message under the field, a 2px
 *   Ember keyline down the control, plus `aria-invalid` and `aria-describedby`.
 * - One column. This is filled on a phone, held in one hand.
 *
 * A question is addressed by its ClickUp field id, which is a UUID and cannot
 * begin a DOM id, so every id here is prefixed. `q-<uuid>` is the group,
 * `q-<uuid>-help` and `-error` are what describe it.
 */

const describedBy = (fieldId: string, hasHelp: boolean, hasError: boolean) =>
  [hasHelp ? `${questionDomId(fieldId)}-help` : null, hasError ? `${questionDomId(fieldId)}-error` : null]
    .filter(Boolean)
    .join(" ") || undefined;

/** The 2px Ember keyline that marks an errored control. */
const errorKeyline = (error?: string) =>
  error ? "border-l-2 border-l-ember-300 pl-[calc(0.75rem-1px)]" : undefined;

/**
 * The label, help and error around a control.
 *
 * `as="group"` renders a plain span instead of a `<label>`: a star row and a
 * choice row are both radio groups, and the fieldset around them already
 * carries the group's name and the scroll target. Two elements sharing an id
 * is invalid, and the "go to the first problem" jump would then land on
 * whichever one the browser happened to return first.
 */
export const QuestionShell = ({
  question,
  company,
  error,
  ordinal,
  children,
  as = "group",
}: {
  question: Question;
  company: string;
  error?: string;
  /** The number the person sees beside the question. */
  ordinal?: number;
  children: React.ReactNode;
  as?: "label" | "group";
}) => {
  const id = questionDomId(question.id);
  const LabelTag = as === "label" ? "label" : "span";

  return (
    <div
      // For a group the fieldset outside already carries this id
      id={as === "label" ? `${id}-field` : undefined}
      className="scroll-mt-28 space-y-2"
    >
      <LabelTag
        id={`${id}-label`}
        {...(as === "label" ? { htmlFor: id } : {})}
        className="flex gap-2 text-body-sm font-medium text-ink-900"
      >
        {ordinal ? (
          <span
            className="shrink-0 font-mono text-caption tabular-nums text-steel-500"
            aria-hidden="true"
          >
            {ordinal}.
          </span>
        ) : null}
        <span className="measure">
          {renderLabel(question.label, company)}
          {question.required ? (
            <span className="ml-1 text-ember-500" aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
      </LabelTag>

      {children}

      {question.help ? (
        <p id={`${id}-help`} className="measure text-[0.8125rem] leading-5 text-steel-600">
          {question.help}
        </p>
      ) : null}

      {error ? (
        <p id={`${id}-error`} className="text-[0.8125rem] font-medium leading-5 text-ember-500">
          {error}
        </p>
      ) : null}
    </div>
  );
};

/**
 * A five-star rating.
 *
 * Real radio inputs, visually hidden, one per star — so arrow keys move
 * between the values, the group announces itself once, and the browser owns
 * the roving tabindex. A row of `<button>`s would have needed all of that
 * written by hand and got it subtly wrong.
 *
 * Stars fill left to right on hover and on focus as well as on selection,
 * because a rating control that only responds on click gives no clue that
 * three stars means three. The fill is Water rather than the conventional
 * amber: there is no amber in this palette, and Ember is the CTA spark.
 *
 * The chosen number is also printed beside the stars. Five identical shapes
 * differing only in fill is exactly the case where colour alone is not enough.
 */
export const StarField = ({
  question,
  company,
  value,
  ordinal,
  onChange,
  error,
}: {
  question: Question;
  company: string;
  value: number | undefined;
  ordinal?: number;
  onChange: (value: number) => void;
  error?: string;
}) => {
  const id = questionDomId(question.id);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const shown = hovered ?? value ?? 0;

  return (
    <fieldset
      id={`${id}-field`}
      className="scroll-mt-28"
      aria-labelledby={`${id}-label`}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(question.id, !!question.help, !!error)}
    >
      <QuestionShell question={question} company={company} error={error} ordinal={ordinal}>
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-3 gap-y-1.5",
            error && "border-l-2 border-l-ember-300 pl-3",
          )}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((score) => {
              const lit = score <= shown;
              return (
                <label
                  key={score}
                  onMouseEnter={() => setHovered(score)}
                  className="press tap-44 flex h-11 w-11 cursor-pointer items-center justify-center rounded-md focus-within:ring-[3px] focus-within:ring-teal-200"
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name={id}
                    value={score}
                    checked={value === score}
                    onChange={() => onChange(score)}
                    // The group is named by the visible question; each option
                    // only needs to say which value it is
                    aria-label={copy.starValue(score)}
                  />
                  <Star
                    className={cn(
                      "h-6 w-6 transition-colors duration-fast",
                      lit ? "fill-teal-400 text-teal-400" : "fill-transparent text-mist-300",
                    )}
                    aria-hidden="true"
                  />
                </label>
              );
            })}
          </div>

          {/* Never the stars alone: five identical shapes differing only in
              fill is the textbook case for colour not being enough */}
          <span
            className={cn(
              "font-mono text-caption tabular-nums",
              value ? "text-ink-900" : "text-steel-500",
            )}
          >
            {value ? copy.starValue(value) : copy.starLegend}
          </span>
        </div>
      </QuestionShell>
    </fieldset>
  );
};

/**
 * A single choice.
 *
 * Tiles rather than bare radios, and one per row rather than a grid: three of
 * these four options are long enough to wrap at 360px, and a wrapped label in
 * a two-column grid is two ragged columns. Yes/No gets the same treatment
 * because a form whose controls change shape by option count is a form that
 * cannot be predicted.
 */
export const ChoiceField = ({
  question,
  company,
  value,
  ordinal,
  onChange,
  error,
}: {
  question: Question;
  company: string;
  value: string | undefined;
  ordinal?: number;
  onChange: (value: string) => void;
  error?: string;
}) => {
  const id = questionDomId(question.id);
  const options = question.options ?? [];
  const side = options.length <= 2;

  return (
    <fieldset
      id={`${id}-field`}
      className="scroll-mt-28"
      aria-labelledby={`${id}-label`}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(question.id, !!question.help, !!error)}
    >
      <QuestionShell question={question} company={company} error={error} ordinal={ordinal}>
        <div className={cn("grid gap-2", side && "sm:grid-cols-2 sm:max-w-sm")}>
          {options.map((option) => {
            const checked = value === option;
            return (
              <label
                key={option}
                className={cn(
                  "press tap-44 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border bg-white p-3 text-body-sm",
                  "focus-within:ring-[3px] focus-within:ring-teal-200",
                  checked ? "border-teal-400 bg-teal-50/50" : "border-mist-200 hover:border-mist-300",
                  error && "border-l-2 border-l-ember-300",
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={id}
                  value={option}
                  checked={checked}
                  onChange={() => onChange(option)}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-circle border transition-colors duration-fast",
                    checked ? "border-teal-400 bg-teal-400" : "border-mist-300 bg-white",
                  )}
                >
                  {checked ? <span className="h-1.5 w-1.5 rounded-circle bg-ink-900" /> : null}
                </span>
                <span className="text-ink-900">{option}</span>
              </label>
            );
          })}
        </div>
      </QuestionShell>
    </fieldset>
  );
};

/**
 * A free-text answer.
 *
 * `autoGrow`, and no character counter until there is a reason for one: a
 * counter on an optional question reads as a length requirement, and these
 * are the answers HR actually quotes in the report. The remaining count
 * appears only in the last 200 characters, where it is a warning rather than
 * an instruction.
 */
export const LongTextField = ({
  question,
  company,
  value,
  ordinal,
  onChange,
  onBlur,
  error,
}: {
  question: Question;
  company: string;
  value: string;
  ordinal?: number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}) => {
  const id = questionDomId(question.id);
  const max = question.maxLength;
  const remaining = max ? max - value.length : null;
  const showCount = remaining !== null && remaining <= 200;

  return (
    <QuestionShell
      question={question}
      company={company}
      error={error}
      ordinal={ordinal}
      as="label"
    >
      <Textarea
        id={id}
        value={value}
        rows={3}
        autoGrow
        maxLength={max}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(question.id, !!question.help, !!error)}
        className={errorKeyline(error)}
      />
      {showCount ? (
        <p
          className="text-right font-mono text-caption tabular-nums text-steel-500"
          // Announced as it changes would read the count out on every
          // keystroke; it is there to be looked at
          aria-live="off"
        >
          {remaining} left
        </p>
      ) : null}
    </QuestionShell>
  );
};

/**
 * A prefilled fact, shown back to the person rather than asked of them.
 *
 * Every one of these is data Kenafric already holds. V1's forms asked for
 * their name, email, payroll number, department and company, and a typo or a
 * nickname made the response unmatchable to a candidate record for ever —
 * which is the whole reason the feedback layer produced nothing usable. So
 * these render as text with no control anywhere near them.
 */
export const PrefilledFact = ({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) => {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-caption text-steel-600">{label}</dt>
      <dd className="mt-0.5 break-words text-body-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
};

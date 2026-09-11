import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { RATING_ANCHORS, RATINGS, controlDomId, datalistId } from "@/kpi/schema";

/**
 * Shared field furniture for the two KPI forms.
 *
 * Same rules as the requisition, onboarding and feedback forms', because a
 * manager who has used one of Kenafric's forms should be able to predict the
 * next:
 *
 * - Label above, help BELOW the control, so every control in a row starts
 *   level whatever the help says.
 * - An error is never colour alone — an Ember message under the field, a 2px
 *   Ember keyline down the control, plus `aria-invalid` and `aria-describedby`.
 * - 44px targets, and one column on a phone.
 *
 * A control is addressed by `k-<row>-<name>`, because a row is identified by
 * either a client-side row id or a ClickUp task id and neither is safe at
 * the start of a DOM id. `-field` is the scroll target, `-help` and `-error`
 * are what describe it.
 */

const describedBy = (id: string, hasHelp: boolean, hasError: boolean) =>
  [hasHelp ? `${id}-help` : null, hasError ? `${id}-error` : null].filter(Boolean).join(" ") ||
  undefined;

/** The 2px Ember keyline that marks an errored control. */
const errorKeyline = (error?: string) =>
  error ? "border-l-2 border-l-ember-300 pl-[calc(0.75rem-1px)]" : undefined;

export const FieldShell = ({
  id,
  label,
  help,
  error,
  required,
  children,
  className,
  as = "label",
  suffix,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  /** Radio groups label themselves with a fieldset and a span instead. */
  as?: "label" | "group";
  /** A unit or a computed figure, printed at the end of the label row. */
  suffix?: React.ReactNode;
}) => {
  const LabelTag = as === "label" ? "label" : "span";

  return (
    <div
      // For a group the fieldset outside already carries this id
      id={as === "label" ? `${id}-field` : undefined}
      className={cn("scroll-mt-28 space-y-1.5", className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <LabelTag
          id={`${id}-label`}
          {...(as === "label" ? { htmlFor: id } : {})}
          className="text-caption font-medium text-ink-900"
        >
          {label}
          {required ? (
            <span className="ml-1 text-ember-500" aria-hidden="true">
              *
            </span>
          ) : null}
        </LabelTag>
        {suffix ? <div className="shrink-0">{suffix}</div> : null}
      </div>

      {children}

      {help ? (
        <p id={`${id}-help`} className="measure text-[0.75rem] leading-4 text-steel-600">
          {help}
        </p>
      ) : null}

      {error ? (
        <p id={`${id}-error`} className="text-[0.75rem] font-medium leading-4 text-ember-500">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export const TextField = ({
  row,
  name,
  label,
  help,
  error,
  required,
  value,
  onChange,
  onBlur,
  placeholder,
  maxLength,
  suggestions,
  suffix,
  className,
}: {
  row: string;
  name: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  /**
   * Offered through a `<datalist>`, which is a suggestion and not a
   * constraint. Key Result Area and Unit of Measure are both `short_text` in
   * ClickUp today, so a select would refuse values the workspace accepts —
   * see K-2.
   */
  suggestions?: readonly string[];
  suffix?: React.ReactNode;
  className?: string;
}) => {
  const id = controlDomId(row, name);
  const list = suggestions?.length ? datalistId(name) : undefined;

  return (
    <FieldShell
      id={id}
      label={label}
      help={help}
      error={error}
      required={required}
      suffix={suffix}
      className={className}
    >
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        list={list}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, !!help, !!error)}
        className={errorKeyline(error)}
      />
      {list ? (
        <datalist id={list}>
          {suggestions?.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      ) : null}
    </FieldShell>
  );
};

/**
 * A number.
 *
 * `inputMode="decimal"` rather than `type="number"`: a number input on
 * Android silently discards a value the browser judges incomplete, scrolls
 * to a different figure when the wheel moves over it, and gives no way to
 * tell an empty box from a zero. The value is a string all the way to
 * `parseNumber`, which is the only thing that decides what it means.
 */
export const NumberField = ({
  row,
  name,
  label,
  help,
  error,
  required,
  value,
  onChange,
  onBlur,
  unit,
  placeholder,
  suffix,
  className,
}: {
  row: string;
  name: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Rendered inside the control, so a figure is never read without it. */
  unit?: string | null;
  placeholder?: string;
  suffix?: React.ReactNode;
  className?: string;
}) => {
  const id = controlDomId(row, name);

  return (
    <FieldShell
      id={id}
      label={label}
      help={help}
      error={error}
      required={required}
      suffix={suffix}
      className={className}
    >
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, !!help, !!error)}
          className={cn("font-mono tabular-nums", unit && "pr-16", errorKeyline(error))}
        />
        {unit ? (
          <span
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-caption text-steel-600"
            // The unit is part of the label's meaning, and the label already
            // carries it; announced here as well it is the same word twice
            aria-hidden="true"
          >
            {unit}
          </span>
        ) : null}
      </div>
    </FieldShell>
  );
};

export const LongTextField = ({
  row,
  name,
  label,
  help,
  error,
  required,
  value,
  onChange,
  onBlur,
  rows = 3,
  maxLength,
  placeholder,
}: {
  row: string;
  name: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
}) => {
  const id = controlDomId(row, name);

  return (
    <FieldShell id={id} label={label} help={help} error={error} required={required}>
      <Textarea
        id={id}
        value={value}
        rows={rows}
        autoGrow
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, !!help, !!error)}
        className={errorKeyline(error)}
      />
    </FieldShell>
  );
};

/**
 * A single choice, as tiles.
 *
 * Real radios inside labels, visually hidden — so arrow keys move between
 * the values, the group announces itself once, and the browser owns the
 * roving tabindex. A row of `<button>`s would need all of that written by
 * hand and would get it subtly wrong.
 */
export const ChoiceField = ({
  row,
  name,
  label,
  help,
  error,
  required,
  options,
  value,
  onChange,
  columns = true,
}: {
  row: string;
  name: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  /** Side by side where they fit; one per row for long options. */
  columns?: boolean;
}) => {
  const id = controlDomId(row, name);

  return (
    <fieldset
      id={`${id}-field`}
      className="scroll-mt-28"
      aria-labelledby={`${id}-label`}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, !!help, !!error)}
    >
      <FieldShell id={id} label={label} help={help} error={error} required={required} as="group">
        <div className={cn("grid gap-2", columns && "sm:grid-cols-3")}>
          {options.map((option) => {
            const checked = value === option;
            return (
              <label
                key={option}
                className={cn(
                  "press tap-44 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border bg-white p-3 text-body-sm",
                  "focus-within:ring-[3px] focus-within:ring-teal-200",
                  checked
                    ? "border-teal-400 bg-teal-50/50"
                    : "border-mist-200 hover:border-mist-300",
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
      </FieldShell>
    </fieldset>
  );
};

/**
 * The 1-5 rating, with the KIL sheet's anchors under it.
 *
 * Five real radios in a row, and the anchor for each value is carried into
 * that radio's accessible name — a screen reader user hearing "1, 2, 3, 4,
 * 5" has been told nothing, and these five words are the difference between
 * a considered rating and a guess. The chosen anchor is also printed below
 * the row, because a rating is the single figure a probation decision turns
 * on and it should never be five identical boxes differing only in fill.
 */
export const RatingField = ({
  row,
  name,
  label,
  help,
  error,
  value,
  onChange,
}: {
  row: string;
  name: string;
  label: string;
  help?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const id = controlDomId(row, name);
  const chosen = RATING_ANCHORS[Number(value)] ?? null;

  return (
    <fieldset
      id={`${id}-field`}
      className="scroll-mt-28"
      aria-labelledby={`${id}-label`}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, !!help, !!error)}
    >
      <FieldShell id={id} label={label} help={help} error={error} required as="group">
        <div className={cn("max-w-xs", error && "border-l-2 border-l-ember-300 pl-3")}>
          <div className="flex gap-1.5">
            {RATINGS.map((rating) => {
              const checked = value === String(rating);
              return (
                <label
                  key={rating}
                  className={cn(
                    "press tap-44 flex h-11 flex-1 cursor-pointer items-center justify-center rounded-md border bg-white",
                    "font-mono text-body-sm tabular-nums transition-colors duration-fast",
                    "focus-within:ring-[3px] focus-within:ring-teal-200",
                    checked
                      ? "border-teal-400 bg-teal-400 font-semibold text-ink-900"
                      : "border-mist-200 text-steel-700 hover:border-mist-300",
                  )}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name={id}
                    value={rating}
                    checked={checked}
                    onChange={() => onChange(String(rating))}
                    aria-label={`${rating} — ${RATING_ANCHORS[rating]}`}
                  />
                  <span aria-hidden="true">{rating}</span>
                </label>
              );
            })}
          </div>

          <p
            className="mt-1.5 text-caption text-steel-600"
            // Already in the chosen radio's accessible name
            aria-hidden="true"
          >
            {chosen ?? `1 ${RATING_ANCHORS[1]} · 5 ${RATING_ANCHORS[5]}`}
          </p>
        </div>
      </FieldShell>
    </fieldset>
  );
};

/**
 * A prefilled fact, shown back rather than asked for.
 *
 * Every one of these is data Kenafric already holds. A KPI sheet with a
 * typed employee name is not attached to an employee record and cannot be
 * scored, reported, or carried into an appraisal — which is the whole
 * reason this layer is being rebuilt. So these render as text with no
 * control anywhere near them.
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

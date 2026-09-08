import * as React from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { fieldId, fieldSpec, type FieldKey } from "@/onboarding/form";
import { DIAL_CODES, dialFor } from "@/onboarding/dialCodes";

/**
 * Shared field furniture.
 *
 * Same rules as the requisition form's: labels and help come from the field
 * spec rather than the call site, help sits BELOW the control so every control
 * in a row starts at the same height, and an error is never colour alone — an
 * Ember message under the field, a 2px Ember keyline down the control, plus
 * `aria-invalid` and `aria-describedby` on the input.
 *
 * Unlike that form, this one is one column. It is filled on a phone, held in
 * one hand, and a two-column row on a 360 px viewport is two cramped columns.
 */

const describedBy = (key: FieldKey, hasHelp: boolean, hasError: boolean) =>
  [hasHelp ? `${fieldId(key)}-help` : null, hasError ? `${fieldId(key)}-error` : null]
    .filter(Boolean)
    .join(" ") || undefined;

/** The 2px Ember keyline that marks an errored control. */
const errorKeyline = (error?: string) =>
  error ? "border-l-2 border-l-ember-300 pl-[calc(0.75rem-1px)]" : undefined;

export const FieldShell = ({
  fieldKey,
  error,
  children,
  className,
  labelFor,
  as = "label",
}: {
  fieldKey: FieldKey;
  error?: string;
  children: React.ReactNode;
  className?: string;
  labelFor?: string;
  /**
   * A radio group is wrapped in a fieldset that carries the scroll target and
   * the group's name, so the shell renders a plain span and no second id.
   */
  as?: "label" | "group";
}) => {
  const spec = fieldSpec(fieldKey);
  const id = fieldId(fieldKey);
  const LabelTag = as === "label" ? Label : "span";

  return (
    <div
      // For a group, the fieldset outside already carries this id. Two
      // elements with the same id is invalid, and `focusField` would then be
      // scrolling to whichever one the browser happened to return first.
      id={as === "label" ? `${id}-field` : undefined}
      className={cn("scroll-mt-28 space-y-1.5", className)}
    >
      <LabelTag
        id={`${id}-label`}
        {...(as === "label" ? { htmlFor: labelFor ?? id } : {})}
        className="flex items-baseline gap-2 text-body-sm font-medium text-ink-900"
      >
        <span>
          {spec.label}
          {spec.required ? (
            <span className="ml-1 text-ember-500" aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
        {spec.ref ? (
          <span className="font-mono text-caption font-normal text-steel-500" aria-hidden="true">
            {spec.ref}
          </span>
        ) : null}
      </LabelTag>

      {children}

      {spec.help ? (
        <p id={`${id}-help`} className="measure text-[0.8125rem] leading-5 text-steel-600">
          {spec.help}
        </p>
      ) : null}

      {error ? (
        <p
          id={`${id}-error`}
          className="text-[0.8125rem] font-medium leading-5 text-ember-500"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
};

export const TextField = ({
  fieldKey,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
  /** Shown as dots after blur, with a toggle. See `mask` below. */
  mask = false,
}: {
  fieldKey: FieldKey;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  type?: "text" | "email" | "tel";
  inputMode?: React.ComponentProps<"input">["inputMode"];
  autoComplete?: string;
  mask?: boolean;
}) => {
  const spec = fieldSpec(fieldKey);
  const [revealed, setRevealed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  /**
   * The account number, masked once the employee looks away.
   *
   * This screen gets filled on a matatu. Showing the last four is enough to
   * check the field is right, and the toggle is there because somebody
   * proof-reading their own account number needs to see all of it.
   */
  const hidden = mask && !revealed && !focused && value.trim().length > 4;
  const display = hidden ? `${"•".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}` : value;

  return (
    <FieldShell fieldKey={fieldKey} error={error}>
      <div className={cn(mask && "relative")}>
        <Input
          id={fieldId(fieldKey)}
          type={type}
          value={display}
          placeholder={placeholder}
          inputMode={inputMode}
          // Never offer to remember a bank account or an ID number
          autoComplete={autoComplete ?? (mask ? "off" : undefined)}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldKey, !!spec.help, !!error)}
          className={cn(errorKeyline(error), mask && "pr-11")}
        />
        {mask ? (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            className="press tap-44 absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-steel-500 hover:bg-mist-50 hover:text-ink-900"
            aria-label={revealed ? "Hide the account number" : "Show the account number"}
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>
    </FieldShell>
  );
};

export const TextareaField = ({
  fieldKey,
  value,
  onChange,
  onBlur,
  error,
  rows = 4,
  placeholder,
}: {
  fieldKey: FieldKey;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  rows?: number;
  placeholder?: string;
}) => {
  const spec = fieldSpec(fieldKey);
  return (
    <FieldShell fieldKey={fieldKey} error={error}>
      <Textarea
        id={fieldId(fieldKey)}
        value={value}
        rows={rows}
        autoGrow
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldKey, !!spec.help, !!error)}
        className={errorKeyline(error)}
      />
    </FieldShell>
  );
};

/**
 * A radio group. Tiles rather than bare radios: this is a phone, and a 44px
 * target with the label inside it is the difference between one tap and three.
 */
export const RadioField = ({
  fieldKey,
  value,
  options,
  onChange,
  error,
}: {
  fieldKey: FieldKey;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  error?: string;
}) => {
  const spec = fieldSpec(fieldKey);
  const id = fieldId(fieldKey);

  return (
    <fieldset
      id={`${id}-field`}
      className="scroll-mt-28"
      /*
       * Named by the visible label rather than by an `sr-only` legend.
       *
       * With both, a screen reader announced "HELB loan status" as the group's
       * name and then read the same words again as its first piece of content.
       * The label is on screen; it only needs saying once.
       */
      aria-labelledby={`${id}-label`}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(fieldKey, !!spec.help, !!error)}
    >
      <FieldShell fieldKey={fieldKey} error={error} as="group">
        <div className="grid gap-2 sm:grid-cols-3">
          {options.map((option, index) => {
            const checked = value === option;
            return (
              <label
                key={option}
                className={cn(
                  "press tap-44 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border bg-white p-3 text-body-sm",
                  checked ? "border-teal-400 bg-teal-50/50" : "border-mist-200 hover:border-mist-300",
                  error && "border-l-2 border-l-ember-300",
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={id}
                  id={index === 0 ? id : undefined}
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
 * A short optional note on a document.
 *
 * This is where "Good Conduct application submitted 2026-08-14, receipt
 * attached" goes — the thing an employee wants to tell HR and would otherwise
 * put in an email that arrives separately from the document it is about.
 */
export const NoteField = ({
  id,
  label,
  value,
  onChange,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-caption font-medium text-ink-900">
      {label}
    </Label>
    <Textarea
      id={id}
      value={value}
      rows={2}
      maxLength={max}
      autoComplete="off"
      onChange={(event) => onChange(event.target.value)}
      className="text-body-sm"
    />
    <p className="text-right font-mono text-caption tabular-nums text-steel-500">
      {value.length}/{max}
    </p>
  </div>
);

/**
 * A phone number: the country first, then the digits.
 *
 * Two controls rather than one box, because one box produces `0712345678`
 * from somebody in Nairobi, `+254 0712 345 678` from somebody being careful,
 * and `0772...` from somebody in Kampala who did not notice the field wanted
 * Kenya. Choosing the country makes the question unambiguous and the answer
 * short.
 *
 * The code sits in a select at the leading edge and the number runs on from
 * it, so the whole thing reads as one field — which is what it is, and what
 * the label and the single error message describe.
 */
export const PhoneField = ({
  fieldKey,
  value,
  country,
  onChange,
  onCountryChange,
  onBlur,
  error,
}: {
  fieldKey: FieldKey;
  /** The national part only. */
  value: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  onChange: (value: string) => void;
  onCountryChange: (country: string) => void;
  onBlur?: () => void;
  error?: string;
}) => {
  const spec = fieldSpec(fieldKey);
  const id = fieldId(fieldKey);
  const dial = dialFor(country);

  return (
    <FieldShell fieldKey={fieldKey} error={error}>
      <div className="flex gap-2">
        {/* A native select, deliberately. Fifty-five rows on a phone is a job
            for the platform's own picker — it is searchable, it is the control
            people already know, and it does not need a scroll trap. */}
        <div className="relative shrink-0">
          <select
            id={`${id}-country`}
            value={country}
            onChange={(event) => onCountryChange(event.target.value)}
            aria-label="Country code"
            className={cn(
              "h-11 w-[6.5rem] appearance-none rounded-md border border-mist-200 bg-white pl-3 pr-7 text-body-sm text-ink-900",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-teal-200",
              error && "border-l-2 border-l-ember-300",
            )}
          >
            {DIAL_CODES.map((option) => (
              // The code is what the employee is choosing; the country name is
              // how they find it
              <option key={option.country} value={option.country}>
                {option.dial} {option.country}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500"
            aria-hidden="true"
          />
        </div>

        <Input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={value}
          placeholder={country === "KE" ? "712 345 678" : ""}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldKey, !!spec.help, !!error)}
          className={cn("min-w-0 flex-1", errorKeyline(error))}
        />
      </div>

      {/* What will actually be stored, so a wrong country is visible before
          submit rather than after a payslip goes to the wrong number */}
      {dial && value.trim() ? (
        <p className="font-mono text-caption tabular-nums text-steel-500">
          Saved as {dial}
          {value.replace(/[^\d]/g, "").replace(/^0+/, "")}
        </p>
      ) : null}
    </FieldShell>
  );
};

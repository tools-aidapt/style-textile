import * as React from "react";
import { Check, ChevronDown, Minus, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  MAX_LIST_ITEMS,
  fieldId,
  fieldSpec,
  filledItems,
  type FieldKey,
} from "@/requisition/form";
import type { SchemaOption } from "@/requisition/schema";

/**
 * Shared field furniture.
 *
 * Labels and help text come from the field spec rather than the call site, so
 * a field and the submit-time error summary cannot disagree about what it is
 * called. An error is never colour alone: Ember text below the field and
 * a 2px Ember keyline down the control, plus `aria-invalid` and
 * `aria-describedby` on the input.
 */

const describedBy = (key: FieldKey, hasHelp: boolean, hasError: boolean) =>
  [hasHelp ? `${fieldId(key)}-help` : null, hasError ? `${fieldId(key)}-error` : null]
    .filter(Boolean)
    .join(" ") || undefined;

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
  /** Overrides the control the label points at. */
  labelFor?: string;
  /** Checkbox and radio groups label themselves with a legend instead. */
  as?: "label" | "group";
}) => {
  const spec = fieldSpec(fieldKey);
  const id = fieldId(fieldKey);
  const LabelTag = as === "label" ? Label : "span";

  return (
    <div id={`${id}-field`} className={cn("scroll-mt-28 space-y-1.5", className)}>
      <LabelTag
        {...(as === "label" ? { htmlFor: labelFor ?? id } : {})}
        className="flex items-baseline gap-2 text-caption font-medium text-ink-900"
      >
        <span>
          {spec.label}
          {spec.required ? (
            <span className="ml-1 text-ember-500" aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
        <span className="font-mono text-caption font-normal text-steel-500" aria-hidden="true">
          {spec.ref}
        </span>
      </LabelTag>

      {children}

      {/*
        Help sits BELOW the control, not above it.

        Above the control, its line count decided where the control started, so
        two fields side by side in a row put their inputs at different heights:
        Company carried a line of help and Department carried none, so their
        dropdowns were a line apart. With every label exactly one line tall,
        every control in a row starts at the same y — whatever the help says,
        and whether or not one of them is showing an error.

        The control is still described by both, so a screen reader reads label,
        then value, then help, on focus. This is also how the candidate
        application form already orders it.
      */}
      {spec.help ? (
        <p id={`${id}-help`} className="measure text-[0.75rem] leading-4 text-steel-600">
          {spec.help}
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

/** The 2px Ember keyline that marks an errored control. */
const errorKeyline = (error?: string) =>
  error ? "border-l-2 border-l-ember-300 pl-[calc(0.75rem-1px)]" : undefined;

export const TextField = ({
  fieldKey,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  className,
  inputMode,
}: {
  fieldKey: FieldKey;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  className?: string;
  inputMode?: React.ComponentProps<"input">["inputMode"];
}) => {
  const spec = fieldSpec(fieldKey);
  return (
    <FieldShell fieldKey={fieldKey} error={error} className={className}>
      <Input
        id={fieldId(fieldKey)}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldKey, !!spec.help, !!error)}
        className={errorKeyline(error)}
      />
    </FieldShell>
  );
};

export const TextareaField = ({
  fieldKey,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  rows = 4,
  className,
  emphasis,
}: {
  fieldKey: FieldKey;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  /** D3 earns a teal wash on its help text — the new joiner reads that answer. */
  emphasis?: boolean;
}) => {
  const spec = fieldSpec(fieldKey);
  return (
    <div className={cn(emphasis && "rounded-md bg-teal-50/60 p-3 ring-1 ring-teal-100", className)}>
      <FieldShell fieldKey={fieldKey} error={error}>
        <Textarea
          id={fieldId(fieldKey)}
          value={value}
          rows={rows}
          autoGrow
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldKey, !!spec.help, !!error)}
          className={errorKeyline(error)}
        />
      </FieldShell>
    </div>
  );
};

export const SelectField = ({
  fieldKey,
  value,
  options,
  onChange,
  error,
  placeholder = "Select",
  className,
}: {
  fieldKey: FieldKey;
  value: string;
  options: SchemaOption[];
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
}) => {
  const spec = fieldSpec(fieldKey);
  return (
    <FieldShell fieldKey={fieldKey} error={error} className={className}>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger
          id={fieldId(fieldKey)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldKey, !!spec.help, !!error)}
          className={cn("text-left", errorKeyline(error))}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((option) => (
            <SelectItem key={option.label} value={option.label}>
              <span>{option.label}</span>
              {option.provisional ? (
                <span className="ml-2 text-caption text-steel-500">provisional</span>
              ) : null}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
};

/** A fieldset with a legend — the group is labelled, not each control. */
const GroupShell = ({
  fieldKey,
  error,
  note,
  children,
}: {
  fieldKey: FieldKey;
  error?: string;
  note?: string;
  children: React.ReactNode;
}) => (
  <fieldset
    id={`${fieldId(fieldKey)}-field`}
    className="scroll-mt-28"
    aria-invalid={error ? true : undefined}
    aria-describedby={describedBy(fieldKey, !!fieldSpec(fieldKey).help, !!error)}
  >
    <legend className="sr-only">{fieldSpec(fieldKey).label}</legend>
    <FieldShell fieldKey={fieldKey} error={error} as="group">
      {children}
      {note ? <p className="text-[0.75rem] leading-4 text-steel-600">{note}</p> : null}
    </FieldShell>
  </fieldset>
);

const optionTile = (checked: boolean, invalid: boolean) =>
  cn(
    "press flex cursor-pointer items-start gap-2.5 rounded-md border bg-white p-2.5 text-caption",
    checked ? "border-teal-400 bg-teal-50/50" : "border-mist-200 hover:border-mist-300",
    invalid && "border-l-2 border-l-ember-300",
  );

/** The visual box. The real input sits behind it, focusable and announced. */
const Tick = ({ checked, round }: { checked: boolean; round?: boolean }) => (
  <span
    aria-hidden="true"
    className={cn(
      "mt-px flex h-4 w-4 shrink-0 items-center justify-center border transition-colors duration-fast",
      round ? "rounded-circle" : "rounded-sm",
      checked ? "border-teal-400 bg-teal-400" : "border-mist-300 bg-white",
    )}
  >
    {checked ? (
      round ? (
        <span className="h-1.5 w-1.5 rounded-circle bg-ink-900" />
      ) : (
        <Check className="h-3 w-3 text-ink-900" strokeWidth={3} />
      )
    ) : null}
  </span>
);

export const RadioField = ({
  fieldKey,
  value,
  options,
  onChange,
  error,
  columns = 2,
}: {
  fieldKey: FieldKey;
  value: string;
  options: SchemaOption[];
  onChange: (value: string) => void;
  error?: string;
  columns?: 1 | 2 | 3;
}) => (
  <GroupShell fieldKey={fieldKey} error={error}>
    <div
      className={cn(
        "grid gap-2",
        columns === 1 && "grid-cols-1",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-3",
      )}
    >
      {options.map((option, index) => {
        const checked = value === option.label;
        return (
          <label key={option.label} className={optionTile(checked, !!error)}>
            <input
              type="radio"
              className="sr-only"
              name={fieldId(fieldKey)}
              id={index === 0 ? fieldId(fieldKey) : undefined}
              value={option.label}
              checked={checked}
              onChange={() => onChange(option.label)}
            />
            <Tick checked={checked} round />
            <span className="text-ink-900">{option.label}</span>
          </label>
        );
      })}
    </div>
  </GroupShell>
);

export const CheckboxField = ({
  fieldKey,
  values,
  options,
  onChange,
  error,
  note,
  columns = 2,
  exclusive,
}: {
  fieldKey: FieldKey;
  values: string[];
  options: SchemaOption[];
  onChange: (values: string[]) => void;
  error?: string;
  note?: string;
  columns?: 1 | 2 | 3;
  /**
   * An option that clears every other, and is cleared by any other — enforced
   * here rather than left to validation, so the tick never lies.
   */
  exclusive?: string;
}) => {
  const toggle = (label: string) => {
    const on = values.includes(label);
    if (exclusive && label === exclusive) {
      onChange(on ? [] : [exclusive]);
      return;
    }
    const next = on ? values.filter((v) => v !== label) : [...values, label];
    onChange(exclusive ? next.filter((v) => v !== exclusive) : next);
  };

  return (
    <GroupShell fieldKey={fieldKey} error={error} note={note}>
      <div
        className={cn(
          "grid gap-2",
          columns === 1 && "grid-cols-1",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-3",
        )}
      >
        {options.map((option, index) => {
          const checked = values.includes(option.label);
          return (
            <label key={option.label} className={optionTile(checked, !!error)}>
              <input
                type="checkbox"
                className="sr-only"
                id={index === 0 ? fieldId(fieldKey) : undefined}
                checked={checked}
                onChange={() => toggle(option.label)}
              />
              <Tick checked={checked} />
              <span className="min-w-0 text-ink-900">
                {option.label}
                {option.note ? (
                  <span className="ml-2 text-caption text-steel-500">{option.note}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </GroupShell>
  );
};

/** Wait before a hold starts repeating, so a plain tap is still one step. */
const HOLD_DELAY_MS = 380;
const REPEAT_START_MS = 170;
const REPEAT_FLOOR_MS = 55;

/**
 * Press and hold to keep going.
 *
 * A stepper that only counts discrete clicks makes the far end of its range
 * expensive — nine taps to reach ten openings — and gives nothing back during
 * the press itself. Holding repeats, and speeds up as it goes, so the distance
 * to a value stops depending on how far it is.
 *
 * The first step fires on pointer-DOWN. That is where feedback belongs, and it
 * also means a hold and a tap begin identically, so there is no moment where
 * the control looks unresponsive while it decides which one this is.
 */
const useHoldRepeat = (step: () => void) => {
  const stepRef = React.useRef(step);
  stepRef.current = step;
  const timers = React.useRef<number[]>([]);

  const stop = React.useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const start = React.useCallback(() => {
    stop();
    stepRef.current();

    let period = REPEAT_START_MS;
    const repeat = () => {
      stepRef.current();
      period = Math.max(REPEAT_FLOOR_MS, period * 0.82);
      timers.current.push(window.setTimeout(repeat, period));
    };
    timers.current.push(window.setTimeout(repeat, HOLD_DELAY_MS));
  }, [stop]);

  // A pointer released outside the button, or a component unmounted mid-hold,
  // would otherwise leave the interval counting on its own
  React.useEffect(() => stop, [stop]);

  return {
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      // Only a primary press repeats; a right-click must not start a run
      if (event.button !== 0) return;
      // Capture keeps the repeat alive if the finger slides off the button,
      // and guarantees the release lands here so it can be stopped. jsdom does
      // not implement it, and a test harness must not be the thing that
      // decides whether the control works.
      event.currentTarget.setPointerCapture?.(event.pointerId);
      start();
    },
    onPointerUp: stop,
    onPointerCancel: stop,
    onLostPointerCapture: stop,
    // The keyboard has its own repeat, so Enter/Space stay one step each
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        stepRef.current();
      }
    },
  };
};

export const NumberStepper = ({
  fieldKey,
  value,
  onChange,
  onBlur,
  error,
  min = 1,
  max = 10,
}: {
  fieldKey: FieldKey;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  min?: number;
  max?: number;
}) => {
  const spec = fieldSpec(fieldKey);
  const current = Number(value);
  const step = (delta: number) => {
    const next = (Number.isFinite(current) ? current : min) + delta;
    onChange(String(Math.min(max, Math.max(min, next))));
  };

  const stepButton =
    "press tap-44 flex h-10 w-10 items-center justify-center rounded-md border border-mist-200 bg-white text-ink-900 hover:border-teal-400 hover:bg-teal-50 disabled:cursor-not-allowed disabled:text-steel-300 disabled:hover:border-mist-200 disabled:hover:bg-white";

  const decrement = useHoldRepeat(() => step(-1));
  const increment = useHoldRepeat(() => step(1));

  return (
    <FieldShell fieldKey={fieldKey} error={error}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={stepButton}
          {...decrement}
          disabled={current <= min}
          aria-label={`One fewer than ${current || min}`}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <Input
          id={fieldId(fieldKey)}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldKey, !!spec.help, !!error)}
          className={cn("w-16 text-center font-mono tabular-nums", errorKeyline(error))}
        />
        <button
          type="button"
          className={stepButton}
          {...increment}
          disabled={current >= max}
          aria-label={`One more than ${current || min}`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </FieldShell>
  );
};

/**
 * A conditional field. It grows in rather than appearing, so the eye follows
 * the change instead of hunting for it — and a crossfade stands in when the
 * viewer has asked for less motion.
 */
export const Reveal = ({ when, children }: { when: boolean; children: React.ReactNode }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  // A collapsed field is still in the DOM so it can animate, which would leave
  // a keyboard user tabbing into a control they cannot see. `inert` takes the
  // whole subtree out of the tab order and the accessibility tree with it.
  React.useEffect(() => {
    ref.current?.toggleAttribute("inert", !when);
  }, [when]);

  return (
    <div
      ref={ref}
      data-reveal={when ? "open" : "closed"}
      aria-hidden={!when}
      className={cn(
        "grid transition-all duration-base ease-entrance motion-reduce:transition-opacity motion-reduce:duration-fast",
        when ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className={cn("overflow-hidden", when ? undefined : "pointer-events-none")}>
        <div className="pt-1">{children}</div>
      </div>
    </div>
  );
};

/** A quiet inline note. Conditional rule 1 uses it — a statement, not a field. */
export const InlineNote = ({ children }: { children: React.ReactNode }) => (
  <p className="flex gap-2 rounded-md border border-frost-200 bg-frost-50 px-3 py-2 text-caption text-steel-700">
    <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 -rotate-90 text-teal-400" aria-hidden="true" />
    <span>{children}</span>
  </p>
);

/**
 * A list field: one short line per entry, added as you go.
 *
 * Qualifications and skills were single long-text boxes, and managers used
 * them as one: a wall of prose in which "a degree is an advantage but not a
 * requirement" and "HACCP or FSSC 22000" ran into each other, and which the
 * job description then reproduced verbatim. They are lists — so this asks for
 * a list, and the payload joins the entries into the one text field the
 * workspace has.
 *
 * Enter adds the next entry, because a list is typed in one run and reaching
 * for a button between every item is the thing that makes people write a
 * paragraph instead. Backspace on an empty row removes it and moves the caret
 * back, so a row added by mistake costs nothing.
 */
export const ListField = ({
  fieldKey,
  values,
  onChange,
  onBlur,
  error,
  addLabel,
  itemLabel,
  placeholders = [],
  className,
}: {
  fieldKey: FieldKey;
  values: string[];
  onChange: (values: string[]) => void;
  onBlur?: () => void;
  error?: string;
  /** Names the thing being added: "Add another qualification". */
  addLabel: string;
  /**
   * The singular noun for one entry — "Qualification", "Skill".
   *
   * Row labels read "Qualification 2", not "Academic and professional
   * qualifications, 2": repeating the whole field name on every row is a
   * mouthful to listen to, and it makes each row's accessible name a prefix
   * of the group's, so nothing can address one row unambiguously.
   */
  itemLabel: string;
  /** Shown on the first rows only, as a worked example. */
  placeholders?: string[];
  className?: string;
}) => {
  const spec = fieldSpec(fieldKey);
  const id = fieldId(fieldKey);
  const rows = values.length > 0 ? values : [""];

  // A row added by Enter or by the button should take the caret with it
  const inputs = React.useRef<(HTMLInputElement | null)[]>([]);
  const focusRow = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (focusRow.current === null) return;
    const target = inputs.current[focusRow.current];
    focusRow.current = null;
    target?.focus();
  }, [rows.length]);

  const setRow = (index: number, value: string) =>
    onChange(rows.map((row, i) => (i === index ? value : row)));

  const addRow = (after = rows.length - 1) => {
    if (rows.length >= MAX_LIST_ITEMS) return;
    const next = [...rows];
    next.splice(after + 1, 0, "");
    focusRow.current = after + 1;
    onChange(next);
  };

  const removeRow = (index: number) => {
    // The control always keeps one row, so there is something to type into
    const next = rows.length === 1 ? [""] : rows.filter((_, i) => i !== index);
    focusRow.current = Math.max(0, index - 1);
    onChange(next);
  };

  const atMax = rows.length >= MAX_LIST_ITEMS;
  const filled = filledItems(rows).length;

  return (
    <FieldShell fieldKey={fieldKey} error={error} className={className} as="group">
      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li key={index} className="flex items-center gap-2">
            <span
              className="w-4 shrink-0 text-right font-mono text-caption tabular-nums text-steel-400"
              aria-hidden="true"
            >
              {index + 1}
            </span>

            {/* The first row carries the field's own id, so the submit-time
                error summary has a control to focus */}
            <label htmlFor={index === 0 ? id : `${id}-${index}`} className="sr-only">
              {itemLabel} {index + 1}
            </label>
            <Input
              id={index === 0 ? id : `${id}-${index}`}
              ref={(node) => {
                inputs.current[index] = node;
              }}
              value={row}
              placeholder={placeholders[index] ?? ""}
              onChange={(event) => setRow(index, event.target.value)}
              onBlur={onBlur}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addRow(index);
                  return;
                }
                if (event.key === "Backspace" && row === "" && rows.length > 1) {
                  event.preventDefault();
                  removeRow(index);
                }
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy(fieldKey, !!spec.help, !!error)}
            />

            <button
              type="button"
              onClick={() => removeRow(index)}
              disabled={rows.length === 1 && row === ""}
              className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-steel-500 hover:bg-ember-50 hover:text-ember-500 disabled:text-steel-200 disabled:hover:bg-transparent"
              aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => addRow()} disabled={atMax}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {addLabel}
        </Button>
        <p className="font-mono text-caption tabular-nums text-steel-500">
          {filled} of {MAX_LIST_ITEMS}
        </p>
      </div>
    </FieldShell>
  );
};

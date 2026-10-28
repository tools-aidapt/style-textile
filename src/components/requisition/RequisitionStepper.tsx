import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectionState } from "@/requisition/form";

/**
 * Where you are in the requisition, and how far there is left.
 *
 * One step renders at a time — a manager writing a job description is doing
 * six or seven different kinds of thinking (who this reports to, what it pays
 * off in six months, what it ships with on day one), and asking for all of it
 * on one tall page is what the review step and this rail replace. Clicking any
 * step jumps straight to it; the gate that stops a half-finished requisition
 * reaching HR is still the submit on the last one, not a locked step here.
 */

export interface StepItem {
  key: string;
  /** The JD section letter — absent for the trailing Review step. */
  letter?: string;
  title: string;
  state: SectionState;
}

const Dot = ({ state, current }: { state: SectionState; current: boolean }) => (
  <span
    aria-hidden="true"
    className={cn(
      "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-circle border-2 font-mono text-caption font-medium transition-colors duration-base",
      state === "has-errors"
        ? "border-ember-300 bg-ember-50 text-ember-500"
        : state === "complete"
          ? "border-teal-400 bg-teal-400 text-ink-900"
          : state === "in-progress"
            ? "border-teal-300 bg-white text-teal-700"
            : "border-mist-300 bg-white text-steel-400",
      current && "ring-2 ring-offset-2 ring-teal-200",
    )}
  >
    {state === "complete" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
  </span>
);

const statusWord = (state: SectionState) =>
  state === "complete"
    ? "complete"
    : state === "has-errors"
      ? "needs attention"
      : state === "in-progress"
        ? "in progress"
        : "not started";

const Rows = ({
  steps,
  current,
  onJump,
}: {
  steps: StepItem[];
  current: number;
  onJump: (index: number) => void;
}) => (
  <ol className="space-y-0.5">
    {steps.map((step, index) => (
      <li key={step.key}>
        <button
          type="button"
          onClick={() => onJump(index)}
          aria-current={index === current ? "step" : undefined}
          className={cn(
            "press tap-44 flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors duration-base",
            index === current ? "bg-teal-50/70" : "hover:bg-mist-50",
          )}
        >
          <Dot state={step.state} current={index === current} />
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate text-body-sm",
                index === current ? "font-semibold text-ink-900" : "text-ink-900",
              )}
            >
              {step.title}
            </span>
            <span className="sr-only">{statusWord(step.state)}</span>
          </span>
          {step.letter ? (
            <span className="shrink-0 font-mono text-caption text-steel-400" aria-hidden="true">
              {step.letter}
            </span>
          ) : null}
        </button>
      </li>
    ))}
  </ol>
);

export const RequisitionStepper = ({
  steps,
  current,
  onJump,
}: {
  steps: StepItem[];
  current: number;
  onJump: (index: number) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const pct = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 0;
  const active = steps[current];

  return (
    <>
      {/* ---- phone / tablet: a slim gradient bar, tap to open the list ---- */}
      <div className="sticky top-0 z-sticky -mx-4 mb-5 px-4 sm:-mx-6 sm:px-6 lg:hidden print:hidden">
        <div className="chrome-top rounded-lg border border-mist-200 bg-white/95 shadow-sm">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="press tap-44 flex w-full items-center gap-3 px-3 py-2.5 text-left"
          >
            <div className="min-w-0 flex-1">
              <p className="text-caption font-medium text-ink-900">
                Step {current + 1} of {steps.length} · {active.title}
              </p>
              <div
                className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-mist-100"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pct)}
                aria-label="Requisition progress"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 transition-[width] duration-base ease-out"
                  style={{ width: `${Math.max(4, pct)}%` }}
                />
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-steel-500 transition-transform duration-base",
                open && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
          {open ? (
            <div className="border-t border-mist-100 p-1.5">
              <Rows
                steps={steps}
                current={current}
                onJump={(index) => {
                  setOpen(false);
                  onJump(index);
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* ---- desk: the rail, with its own gradient progress thread ------- */}
      <nav
        aria-label="Requisition steps"
        className="sticky top-0 hidden self-start lg:block print:hidden"
      >
        <div className="relative pl-2">
          <div className="absolute bottom-3 left-[1.6rem] top-3 w-px bg-mist-200" aria-hidden="true" />
          <div
            className="absolute left-[1.6rem] top-3 w-px bg-gradient-to-b from-teal-400 to-cyan-400 transition-[height] duration-base ease-out"
            style={{ height: `${Math.max(0, pct)}%` }}
            aria-hidden="true"
          />
          <Rows steps={steps} current={current} onJump={onJump} />
        </div>
      </nav>
    </>
  );
};

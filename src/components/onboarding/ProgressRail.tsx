import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTIONS, focusSection, type SectionId } from "@/onboarding/form";

/**
 * Where you are, and what is left.
 *
 * Not a wizard. People jump back to Section A when they notice the name on
 * their KRA certificate is spelled differently, and a wizard makes that a
 * fight. So it is one scrolling page with a rail that says how far along the
 * page you are — and on a phone, where there is no room for a rail, a single
 * bar that opens into the same list.
 */

export type SectionState = "empty" | "partial" | "done";

export interface SectionProgress {
  id: SectionId;
  state: SectionState;
}

const Dot = ({ state }: { state: SectionState }) => (
  <span
    aria-hidden="true"
    className={cn(
      "flex h-5 w-5 shrink-0 items-center justify-center rounded-circle border transition-colors duration-base",
      state === "done"
        ? "border-teal-400 bg-teal-400"
        : state === "partial"
          ? "border-teal-300 bg-white"
          : "border-mist-300 bg-white",
    )}
  >
    {state === "done" ? (
      <Check className="h-3 w-3 text-ink-900" strokeWidth={3} />
    ) : state === "partial" ? (
      <span className="h-1.5 w-1.5 rounded-circle bg-teal-400" />
    ) : null}
  </span>
);

const Rows = ({
  progress,
  onJump,
}: {
  progress: SectionProgress[];
  onJump: (id: SectionId) => void;
}) => (
  <ul className="space-y-0.5">
    {SECTIONS.map((section) => {
      const state = progress.find((item) => item.id === section.id)?.state ?? "empty";
      return (
        <li key={section.id}>
          <button
            type="button"
            onClick={() => onJump(section.id)}
            className="press tap-44 flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-body-sm text-ink-900 hover:bg-mist-50"
          >
            <Dot state={state} />
            <span className="min-w-0 flex-1 truncate">{section.railLabel}</span>
            {section.letter ? (
              <span className="font-mono text-caption text-steel-400" aria-hidden="true">
                {section.letter}
              </span>
            ) : null}
            <span className="sr-only">
              {state === "done" ? "complete" : state === "partial" ? "started" : "not started"}
            </span>
          </button>
        </li>
      );
    })}
  </ul>
);

export const ProgressRail = ({ progress }: { progress: SectionProgress[] }) => {
  const [open, setOpen] = React.useState(false);
  const done = progress.filter((item) => item.state === "done").length;
  const total = SECTIONS.length;
  const jump = (id: SectionId) => {
    setOpen(false);
    focusSection(id);
  };

  return (
    <>
      {/* ---- phone: one bar, tap to open the list --------------------- */}
      <div className="sticky top-16 z-sticky -mx-6 mb-4 px-6 lg:hidden print:hidden">
        <div className="chrome-top rounded-md border border-mist-200 bg-white/95 shadow-sm">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            className="press tap-44 flex w-full items-center gap-3 px-3 py-2.5 text-left"
          >
            <div className="min-w-0 flex-1">
              <p className="text-caption font-medium text-ink-900">
                {done} of {total} sections done
              </p>
              <div
                className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-mist-100"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={done}
                aria-label="Onboarding progress"
              >
                <div
                  className="h-full rounded-full bg-teal-400 transition-[width] duration-base ease-out"
                  style={{ width: `${Math.max(3, (done / total) * 100)}%` }}
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
              <Rows progress={progress} onJump={jump} />
            </div>
          ) : null}
        </div>
      </div>

      {/* ---- desk: the rail ------------------------------------------- */}
      <nav
        aria-label="Sections"
        className="sticky top-24 hidden self-start lg:block print:hidden"
      >
        <p className="px-2 pb-2 text-overline font-semibold uppercase text-steel-600">
          {done} of {total} done
        </p>
        <Rows progress={progress} onJump={jump} />
      </nav>
    </>
  );
};

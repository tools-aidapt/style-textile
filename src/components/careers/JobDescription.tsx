import { useMemo, useState } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Check, ChevronDown, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { groupIntoSections, parseJobDescription, type Block } from "./jobDescriptionParser";

/** Paragraphs and bullet lists, as the parser grouped them. */
const Blocks = ({ blocks }: { blocks: Block[] }) => (
  <div className="space-y-4">
    {blocks.map((block, i) => {
      if (block.kind === "para") {
        return (
          <p key={i} className="measure text-body leading-relaxed text-steel-700">
            {block.text}
          </p>
        );
      }
      if (block.kind === "list") {
        return (
          <ul key={i} className="measure space-y-4">
            {block.items.map((item, j) => (
              <li key={j} className="border-l-2 border-mist-200 pl-4">
                <p className="text-body leading-relaxed text-ink-900">{item.text}</p>
                {item.outcome ? (
                  <p className="mt-1.5 text-body-sm leading-relaxed text-steel-600">
                    <span className="font-semibold text-teal-700">Outcome</span> {item.outcome}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        );
      }
      return null;
    })}
  </div>
);

/**
 * Renders a parsed Job Description as openable sections.
 *
 * Each heading becomes a section the candidate opens, with a reading-progress
 * meter above. The reward for progress is deliberately quiet — a count, a
 * filling hairline, a check on what you have read — because the brand
 * counter-positions on calm. No points, badges or confetti.
 */
export const JobDescription = ({
  description,
  positionName,
}: {
  description: string;
  positionName?: string;
}) => {
  const { intro, sections } = useMemo(
    () => groupIntoSections(parseJobDescription(description, positionName)),
    [description, positionName],
  );

  // The first section starts open, so the page never opens as a stack of bars
  const [open, setOpen] = useState<string[]>(() => (sections[0] ? [sections[0].id] : []));
  const [read, setRead] = useState<Set<string>>(
    () => new Set(sections[0] ? [sections[0].id] : []),
  );

  const handleChange = (value: string[]) => {
    setOpen(value);
    setRead((prev) => new Set([...prev, ...value]));
  };

  const allOpen = sections.length > 0 && open.length === sections.length;
  const toggleAll = () => handleChange(allOpen ? [] : sections.map((s) => s.id));

  const complete = sections.length > 0 && read.size === sections.length;

  // One section is not worth collapsing, and a description with no headings at
  // all has nothing to collapse
  if (sections.length < 2) {
    return <Blocks blocks={[...intro, ...sections.flatMap((s) => s.blocks)]} />;
  }

  return (
    <div className="space-y-5">
      {intro.length > 0 ? <Blocks blocks={intro} /> : null}

      {/* Reading progress. A hairline that fills, not a scoreboard. */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <div
            className="h-1 w-28 overflow-hidden rounded-pill bg-mist-100"
            role="progressbar"
            aria-valuenow={read.size}
            aria-valuemin={0}
            aria-valuemax={sections.length}
            aria-label="Sections read"
          >
            <div
              className="h-full rounded-pill bg-teal-400 transition-[width] duration-slow ease-forward"
              style={{ width: `${(read.size / sections.length) * 100}%` }}
            />
          </div>
          <p className="text-caption text-steel-600" aria-live="polite">
            {complete ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-teal-700">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Full description read
              </span>
            ) : (
              <>
                <span className="font-mono font-medium tabular-nums text-ink-900">
                  {read.size}
                </span>{" "}
                of{" "}
                <span className="font-mono font-medium tabular-nums text-ink-900">
                  {sections.length}
                </span>{" "}
                sections read
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={toggleAll}
          className="press tap-44 -mx-2 inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-caption font-medium text-teal-700 transition-colors duration-fast hover:bg-teal-50"
        >
          {allOpen ? (
            <ChevronsDownUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <AccordionPrimitive.Root
        type="multiple"
        value={open}
        onValueChange={handleChange}
        className="space-y-2"
      >
        {sections.map((section) => {
          const isRead = read.has(section.id);
          return (
            <AccordionPrimitive.Item
              key={section.id}
              value={section.id}
              className="ring-outline group overflow-hidden rounded-lg border border-mist-200 bg-white transition-colors duration-fast data-[state=open]:border-teal-200 hover:border-teal-200"
            >
              <AccordionPrimitive.Header>
                <AccordionPrimitive.Trigger className="press flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors duration-fast hover:bg-teal-50/60 data-[state=open]:bg-teal-50/40 focus-visible:outline-none">
                  {/* Water keyline grows forward on hover and stays while open */}
                  <span
                    aria-hidden="true"
                    className="h-6 w-0.5 shrink-0 rounded-pill bg-teal-400 opacity-0 transition-all duration-base ease-forward group-hover:opacity-100 group-data-[state=open]:opacity-100"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-h6 font-bold tracking-snug text-ink-900">
                      {section.title}
                    </span>
                    {section.points > 0 ? (
                      <span className="mt-0.5 block text-caption text-steel-600">
                        <span className="font-mono tabular-nums">{section.points}</span>{" "}
                        {section.points === 1 ? "point" : "points"}
                      </span>
                    ) : null}
                  </span>

                  {isRead ? (
                    <span
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-circle bg-teal-50"
                      title="Read"
                    >
                      <Check className="h-3 w-3 text-teal-600" aria-hidden="true" />
                      <span className="sr-only">Read</span>
                    </span>
                  ) : null}

                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-steel-500 transition-transform duration-base ease-chevron group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>

              <AccordionPrimitive.Content
                className={cn(
                  "overflow-hidden",
                  "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
                  "motion-reduce:animate-none",
                )}
              >
                <div className="border-t border-mist-100 px-5 pb-5 pt-4">
                  <Blocks blocks={section.blocks} />
                </div>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          );
        })}
      </AccordionPrimitive.Root>
    </div>
  );
};

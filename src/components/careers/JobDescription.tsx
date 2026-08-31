import { useMemo, useState } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  ArrowRight,
  Award,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  ClipboardList,
  FileText,
  Gift,
  GraduationCap,
  ListChecks,
  Network,
  Package,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { groupIntoSections, parseJobDescription, type Block } from "./jobDescriptionParser";

/** How one section presents itself: its header mark, and how its bullets read. */
interface SectionStyle {
  /** The mark beside the heading. */
  icon: LucideIcon;
  /** The mark on each bullet inside it. */
  item: LucideIcon;
  /**
   * Whether bullets pair up two-across once there is room. Only for sections
   * whose items are short — a qualification or a skill is a phrase, and a
   * column of one-line cards down a 1088px page is mostly empty space. A
   * responsibility runs long enough that two-up would wrap badly.
   */
  paired?: boolean;
}

/**
 * A section's presentation, matched on what its heading says.
 *
 * Headings are free text written by whoever drafted the job description, so
 * this matches substrings rather than an exact list: "Key Responsibilities and
 * Duties" and "Responsibilities" want the same treatment. Anything unmatched
 * falls back to a neutral document mark rather than rendering nothing, which
 * would leave one row visibly shorter than the others.
 */
const SECTION_STYLES: [RegExp, SectionStyle][] = [
  [/overview|about|purpose|summary/, { icon: FileText, item: CheckCircle2 }],
  [/responsib|duti|accountab/, { icon: ListChecks, item: CheckCircle2 }],
  [/qualificat|educat|academic/, { icon: GraduationCap, item: Award, paired: true }],
  [/experience/, { icon: Briefcase, item: Briefcase }],
  [/skill|competen|attribute|knowledge/, { icon: Wrench, item: Sparkles, paired: true }],
  [/report|structure|organis|organiz/, { icon: Network, item: Network }],
  [/benefit|package|remunerat|leave/, { icon: Gift, item: Gift, paired: true }],
  [/objective|target|goal|deliverable|six month/, { icon: Target, item: Target }],
  [/requirement|provision|tool|equipment/, { icon: Package, item: Package, paired: true }],
  [/assessment|selection|interview|stage/, { icon: ClipboardList, item: ClipboardList }],
  [/career|growth|progress|development/, { icon: TrendingUp, item: TrendingUp }],
];

const DEFAULT_STYLE: SectionStyle = { icon: FileText, item: CheckCircle2 };

const styleFor = (title: string): SectionStyle => {
  const heading = title.toLowerCase();
  return SECTION_STYLES.find(([pattern]) => pattern.test(heading))?.[1] ?? DEFAULT_STYLE;
};

/**
 * A responsibility and the outcome that says when it is being done well.
 *
 * The two sit side by side on one row, because that pairing is the whole point
 * of the field: this responsibility is measured by that outcome. Stacked, the
 * reader has to carry the responsibility down the page to the line under it,
 * and with four in a row it stops being obvious which belongs to which.
 *
 * Below `md` they stack anyway — two columns of prose in a phone's width is
 * worse than the ambiguity — but the outcome keeps its own tint and its arrow
 * so the relationship survives the fold.
 */
const OutcomeList = ({ items }: { items: { text: string; outcome?: string }[] }) => (
  <ol className="space-y-2.5">
    {items.map((item, j) => (
      <li
        key={j}
        className="overflow-hidden rounded-lg border border-mist-200 bg-white transition-colors duration-fast hover:border-teal-200"
      >
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* The responsibility */}
          <div className="flex gap-3 p-4">
            <span
              className="mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-circle bg-teal-50 font-mono text-caption font-medium tabular-nums text-teal-700"
              aria-hidden="true"
            >
              {j + 1}
            </span>
            <p className="text-body-sm font-semibold leading-relaxed text-ink-900">{item.text}</p>
          </div>

          {/* The outcome, on the same row and visibly the answer to it */}
          {item.outcome ? (
            <div className="flex gap-2.5 border-t border-mist-100 bg-mist-50/60 p-4 md:border-l md:border-t-0">
              <ArrowRight
                className="mt-0.5 hidden h-4 w-4 shrink-0 text-teal-400 md:block"
                aria-hidden="true"
              />
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-teal-400 md:hidden" aria-hidden="true" />
              <p className="text-caption leading-relaxed text-steel-600">
                <span className="mr-1 font-semibold uppercase tracking-wider text-teal-700">
                  Outcome
                </span>
                {item.outcome}
              </p>
            </div>
          ) : null}
        </div>
      </li>
    ))}
  </ol>
);

/** Bullets that are statements rather than commitments: a qualification, a skill. */
const ItemList = ({
  items,
  style,
}: {
  items: { text: string }[];
  style: SectionStyle;
}) => {
  const Icon = style.item;
  return (
    <ul
      className={cn(
        "gap-2.5",
        style.paired ? "grid grid-cols-1 sm:grid-cols-2" : "flex flex-col",
      )}
    >
      {items.map((item, j) => (
        <li
          key={j}
          className="flex items-start gap-3 rounded-lg border border-mist-200 bg-white px-4 py-3 transition-colors duration-fast hover:border-teal-200"
        >
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" aria-hidden="true" />
          <p className="text-body-sm leading-relaxed text-ink-900">{item.text}</p>
        </li>
      ))}
    </ul>
  );
};

/** Paragraphs and bullet lists, as the parser grouped them. */
const Blocks = ({ blocks, style }: { blocks: Block[]; style: SectionStyle }) => (
  <div className="space-y-4">
    {blocks.map((block, i) => {
      if (block.kind === "para") {
        return (
          <p key={i} className="max-w-measure-wide text-body-sm leading-relaxed text-steel-700">
            {block.text}
          </p>
        );
      }
      if (block.kind === "list") {
        // An outcome is what makes a bullet a commitment rather than a
        // statement, and it is the parser — not the heading — that knows
        // which this is. A section titled anything at all gets the right
        // layout as long as its bullets carry one.
        return block.items.some((item) => item.outcome) ? (
          <OutcomeList key={i} items={block.items} />
        ) : (
          <ItemList key={i} items={block.items} style={style} />
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
    return (
      <Blocks
        blocks={[...intro, ...sections.flatMap((s) => s.blocks)]}
        style={styleFor(sections[0]?.title ?? "")}
      />
    );
  }

  return (
    <div className="space-y-5">
      {intro.length > 0 ? <Blocks blocks={intro} style={DEFAULT_STYLE} /> : null}

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
          const style = styleFor(section.title);
          const Icon = style.icon;
          return (
            <AccordionPrimitive.Item
              key={section.id}
              value={section.id}
              className="ring-outline group overflow-hidden rounded-lg border border-mist-200 bg-white transition-colors duration-fast data-[state=open]:border-teal-200 hover:border-teal-200"
            >
              <AccordionPrimitive.Header>
                <AccordionPrimitive.Trigger className="press flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-fast hover:bg-teal-50/60 data-[state=open]:bg-teal-50/40 focus-visible:outline-none">
                  {/* Water keyline grows forward on hover and stays while open */}
                  <span
                    aria-hidden="true"
                    className="h-6 w-0.5 shrink-0 rounded-pill bg-teal-400 opacity-0 transition-all duration-base ease-forward group-hover:opacity-100 group-data-[state=open]:opacity-100"
                  />

                  {/* Fixed square, so every title starts on the same x whatever
                      the icon's own drawn width */}
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-600 transition-colors duration-fast group-data-[state=open]:bg-teal-100">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-body font-semibold tracking-snug text-ink-900">
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
                <div className="border-t border-mist-100 bg-mist-50/40 px-4 pb-5 pt-4 sm:pl-[4.625rem]">
                  <Blocks blocks={section.blocks} style={style} />
                </div>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          );
        })}
      </AccordionPrimitive.Root>
    </div>
  );
};

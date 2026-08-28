import * as React from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/aidapt/assets/logo/aidapt-logo.png";
import logoDark from "@/aidapt/assets/logo/aidapt-logo-dark.png";

/** Wordmark plus chevron. The dark variant is for Deep Flow grounds only. */
export const Wordmark = ({
  variant = "light",
  className,
}: {
  variant?: "light" | "dark";
  className?: string;
}) => (
  <img
    src={variant === "dark" ? logoDark : logo}
    alt="Aidapt"
    className={cn("w-auto object-contain", className)}
  />
);

/** Overline. The only place uppercase is allowed, and it tracks wide. */
export const Eyebrow = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={cn("text-overline font-semibold uppercase text-steel-600", className)}>{children}</p>
);

/** Second-level heading. Source Serif 4 — the human warmth, never a headline. */
export const SectionHeading = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3 className={cn("font-serif text-h4 font-normal tracking-snug text-ink-900", className)}>
    {children}
  </h3>
);

/** A labelled fact. Renders nothing without a value, so grids stay tight. */
export const Fact = ({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  className?: string;
}) => {
  if (!value) return null;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-caption text-steel-600">{label}</dt>
        <dd className="mt-0.5 break-words font-medium text-ink-900">{value}</dd>
      </div>
    </div>
  );
};

/**
 * Chip. `tone="water"` earns the teal wash for role attributes; `neutral` is
 * the default, because a surface earns colour by meaning.
 */
export const Chip = ({
  children,
  icon: Icon,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  tone?: "neutral" | "water" | "wood";
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-medium",
      tone === "neutral" && "bg-mist-50 text-steel-700",
      tone === "water" && "bg-teal-50 text-teal-700",
      tone === "wood" && "bg-frost-100 text-sage-600",
      className,
    )}
  >
    {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
    {children}
  </span>
);

const PROSE_BULLET = /^\s*[•·▪‣]\s*|^\s*[-*–]\s+/;

/**
 * Long-form copy held to the reading measure.
 *
 * ClickUp text fields arrive hard-wrapped at around 78 characters, so
 * preserving newlines verbatim broke sentences mid-clause. Single newlines are
 * joined into flowing copy; a blank line still starts a new paragraph, and a
 * run of bullet lines still renders as a list.
 */
export const Prose = ({ children, className }: { children: string; className?: string }) => {
  const groups = children
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((group) => group.split("\n").filter((line) => line.trim()))
    .filter((lines) => lines.length > 0);

  return (
    <div className={cn("measure space-y-4 text-steel-700", className)}>
      {groups.map((lines, i) => {
        const bullets = lines.filter((l) => PROSE_BULLET.test(l));

        if (bullets.length === lines.length) {
          return (
            <ul key={i} className="space-y-2">
              {lines.map((line, j) => (
                <li key={j} className="border-l-2 border-mist-200 pl-4 text-body leading-relaxed">
                  {line.replace(PROSE_BULLET, "").trim()}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="text-body leading-relaxed">
            {lines.map((l) => l.trim()).join(" ")}
          </p>
        );
      })}
    </div>
  );
};

/**
 * A forward affordance. The chevron means from > to, so it always points
 * right and slides right on hover — motion carries the eye forward.
 */
export const ForwardLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-teal-700">
    {children}
    <ChevronRight
      className="h-4 w-4 transition-transform duration-base ease-chevron group-hover:translate-x-1"
      aria-hidden="true"
    />
  </span>
);

/**
 * A self-contained content tile.
 *
 * `plain` is the default white surface. `sweep` earns the diagonal frost
 * gradient — the system's workhorse. `flow` is the richer light flow gradient,
 * welded with film grain; it is the one landmark moment on a view, so use it
 * once. Both gradients are the locked recipes, cropped by the tile.
 */
export const Panel = ({
  eyebrow,
  title,
  tone = "plain",
  children,
  className,
}: {
  eyebrow?: string;
  title?: string;
  tone?: "plain" | "sweep" | "flow";
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "overflow-hidden rounded-lg border shadow-sm",
      tone === "plain" && "border-mist-200 bg-white",
      tone === "sweep" && "surface-sweep-light border-frost-200",
      tone === "flow" && "surface-flow-light has-grain border-frost-200 [--grain-strength:0.5]",
      className,
    )}
  >
    <div className="relative z-10 flex h-full flex-col p-5 sm:p-6">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      {title ? <SectionHeading className={eyebrow ? "mt-2" : undefined}>{title}</SectionHeading> : null}
      <div className={title || eyebrow ? "mt-4" : undefined}>{children}</div>
    </div>
  </div>
);

/** Page section: an overline, a serif heading, and generous room to breathe. */
export const Section = ({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={cn("space-y-4", className)}>
    {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
    <SectionHeading>{title}</SectionHeading>
    {children}
  </section>
);

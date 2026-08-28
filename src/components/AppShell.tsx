import * as React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/careers/primitives";

/**
 * The page chrome, in one place.
 *
 * Six views each built their own header, and they disagreed: the wordmark led
 * on the board and the requisition page but sat on the far right of a role
 * page, where a back button had taken its place. Things that look the same
 * have to live in the same place or the reader cannot predict them, so the
 * wordmark now always leads and always goes home, and the trail of where you
 * are reads left to right after it — which is what the brand's chevron means.
 *
 * The header carries a regular material and the content scrolls beneath it. It
 * sits at `z-sticky`, below the overlay layers, so a dialog covers it rather
 * than opening underneath it.
 */

export interface Crumb {
  label: string;
  /** Omitted for the current page, which is not a link to itself. */
  to?: string;
  /** Dropped below `sm`, where the page's own h1 already says it. */
  compactHidden?: boolean;
}

const CRUMB_TEXT = "truncate text-body-sm font-medium";

export const PageShell = ({
  width = "default",
  crumbs = [],
  trail,
  children,
  mainClassName,
}: {
  /** The requisition form earns the wider container; everything else is 1200. */
  width?: "default" | "wide";
  crumbs?: Crumb[];
  /** Right-hand slot: the section label, or an action. */
  trail?: React.ReactNode;
  children: React.ReactNode;
  mainClassName?: string;
}) => {
  const container = width === "wide" ? "max-w-container-wide" : "max-w-container";

  return (
    <div className="min-h-screen bg-white">
      {/* Every view is a long scroll with a landmark header. Without this a
          keyboard user tabs the whole nav before reaching the content, and on
          a role page that is the difference between reading the role and
          reading the chrome again. */}
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-6 focus-visible:top-4 focus-visible:z-max focus-visible:rounded-md focus-visible:bg-white focus-visible:px-4 focus-visible:py-2 focus-visible:text-body-sm focus-visible:font-semibold focus-visible:text-teal-700 focus-visible:shadow-md"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-sticky">
        <div className="chrome-top">
          <div
            className={cn(
              "mx-auto flex h-16 items-center justify-between gap-4 px-6 lg:px-8",
              container,
            )}
          >
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Link
                to="/"
                aria-label="Aidapt — all open roles"
                className="press shrink-0 rounded-sm"
              >
                <Wordmark className="h-7" />
              </Link>

              {crumbs.map((crumb, index) => (
                <React.Fragment key={`${crumb.label}-${index}`}>
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 text-steel-300",
                      crumb.compactHidden && "hidden sm:block",
                    )}
                    aria-hidden="true"
                  />
                  {crumb.to ? (
                    <Link
                      to={crumb.to}
                      className={cn(
                        CRUMB_TEXT,
                        "press rounded-sm text-steel-600 hover:text-teal-700",
                        crumb.compactHidden && "hidden sm:block",
                      )}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      aria-current="page"
                      className={cn(
                        CRUMB_TEXT,
                        "text-ink-900",
                        crumb.compactHidden && "hidden sm:block",
                      )}
                    >
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>

            {trail ? <div className="flex shrink-0 items-center gap-3">{trail}</div> : null}
          </div>
        </div>
      </header>

      <main id="main" className={cn("mx-auto px-6 lg:px-8", container, mainClassName)}>
        {children}
      </main>
    </div>
  );
};

/** The section label that sits at the end of the nav. */
export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-caption font-medium text-steel-600">{children}</span>
);

/**
 * A centred notice that fills a page: not found, role closed, service down.
 *
 * The four views that needed one had four copies of the same markup at three
 * different vertical rhythms.
 */
export const PageNotice = ({
  icon: Icon,
  tone = "water",
  title,
  body,
  detail,
  actions,
  titleAs = "h1",
  status,
}: {
  icon: React.ElementType;
  /** `fire` is for a failure; the spark marks it without shouting. */
  tone?: "water" | "fire" | "neutral";
  title: string;
  body: string;
  detail?: string;
  actions?: React.ReactNode;
  titleAs?: "h1" | "h2";
  /** Announces the outcome for a reader who cannot see the page change. */
  status?: boolean;
}) => {
  const Title = titleAs;
  const wash =
    tone === "fire" ? "bg-ember-50" : tone === "neutral" ? "bg-mist-50" : "bg-teal-50";
  const mark =
    tone === "fire" ? "text-ember-500" : tone === "neutral" ? "text-steel-600" : "text-teal-400";

  return (
    <div className="rounded-lg border border-mist-200 bg-white px-6 py-16 text-center shadow-sm sm:py-20">
      <div className={cn("mx-auto flex h-12 w-12 items-center justify-center rounded-full", wash)}>
        <Icon className={cn("h-5 w-5", mark)} aria-hidden="true" />
      </div>
      <Title
        className="mt-5 text-h4 font-bold tracking-snug text-ink-900"
        role={status ? "status" : undefined}
      >
        {title}
      </Title>
      <p className="measure mx-auto mt-2 text-body text-steel-600">{body}</p>
      {detail ? <p className="mt-4 font-mono text-caption text-steel-500">{detail}</p> : null}
      {actions ? (
        <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
      ) : null}
    </div>
  );
};

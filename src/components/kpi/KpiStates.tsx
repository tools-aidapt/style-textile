import { AlertTriangle, Check, Clock, LinkIcon, ListX, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "@/kpi/locale";
import type { KpiFault } from "@/kpi/session";

/** What a KPI page can be instead of, before, and after the form. */

const Shell = ({
  tone = "plain",
  children,
}: {
  tone?: "plain" | "sweep";
  children: React.ReactNode;
}) => (
  <div
    className={
      tone === "sweep"
        ? "surface-sweep-light overflow-hidden rounded-lg border border-frost-200"
        : "overflow-hidden rounded-lg border border-mist-200 bg-white shadow-sm"
    }
  >
    <div className="relative z-raised p-6 sm:p-8">{children}</div>
  </div>
);

export const KpiLoading = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading the KPI form">
    <div className="rounded-lg border border-mist-200 bg-white p-6 shadow-sm">
      <div className="h-4 w-40 rounded-sm bg-mist-100" />
      <div className="mt-3 h-4 w-56 rounded-sm bg-mist-50" />
    </div>
    {[0, 1].map((block) => (
      <div key={block} className="rounded-lg border border-mist-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-44 rounded-sm bg-mist-100" />
        <div className="mt-6 space-y-5">
          {[0, 1, 2].map((row) => (
            <div key={row}>
              <div className="h-3.5 w-3/4 rounded-sm bg-mist-50" />
              <div className="mt-2.5 h-11 w-full rounded-md bg-mist-50" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

/**
 * The dead end.
 *
 * Renders this and NOTHING else — no form, no KPI list, no employee name, no
 * position, no company. A link that does not verify is opened by whoever
 * happens to hold it, and a screen that named the employee would hand a
 * stranger a personnel record.
 *
 * Nor does it say *why* the token failed. Bad signature, expired and unknown
 * all read the same, because distinguishing them tells somebody holding a
 * guessed token which part of the guess was wrong.
 */
export const KpiDeadEnd = ({
  fault,
  reason,
  onRetry,
}: {
  fault: KpiFault;
  /**
   * The endpoint's own explanation, from an `ok: false` body. Shown verbatim
   * when present — it is written server-side where the secret is, so the
   * endpoint owns the rule that it must never name a person or a position.
   */
  reason?: string | null;
  onRetry: () => void;
}) => {
  const content: Record<
    KpiFault,
    { heading: string; body: string; retry: boolean; icon: typeof AlertTriangle }
  > = {
    "no-token": {
      heading: copy.noTokenHeading,
      body: copy.noTokenBody,
      retry: false,
      icon: LinkIcon,
    },
    "link-dead": {
      heading: copy.deadHeading,
      body: copy.deadBody,
      retry: false,
      icon: Clock,
    },
    unreachable: {
      heading: copy.unreachableHeading,
      body: copy.unreachableBody,
      retry: true,
      icon: AlertTriangle,
    },
    "wrong-form": {
      heading: copy.wrongFormHeading,
      // Retrying cannot fix a link built for the other instrument
      body: copy.wrongFormBody,
      retry: false,
      icon: LinkIcon,
    },
    "empty-set": {
      heading: copy.emptySetHeading,
      body: copy.emptySetBody,
      retry: false,
      icon: ListX,
    },
    unconfigured: {
      heading: copy.unreachableHeading,
      // A deployment fault of ours, said plainly rather than blamed on them
      body: copy.unconfiguredBody,
      retry: false,
      icon: AlertTriangle,
    },
  };

  const shown = content[fault];
  const Icon = shown.icon;
  const body = reason?.trim() || shown.body;

  return (
    <Shell>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mist-50">
        <Icon className="h-6 w-6 text-steel-600" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-h4 font-bold tracking-snug text-ink-900">{shown.heading}</h1>
      <p className="measure mt-3 text-body text-steel-600">{body}</p>
      {shown.retry ? (
        <div className="mt-8">
          <Button type="button" variant="secondary" onClick={onRetry}>
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            {copy.unreachableRetry}
          </Button>
        </div>
      ) : null}
    </Shell>
  );
};

/**
 * Already sent.
 *
 * A separate screen from the dead end, and a warmer one: this manager did
 * what was asked of them, and the only reason they are here is that they
 * kept the email or clicked twice. Telling them the link is dead would read
 * as their work having been lost.
 */
export const KpiAlreadySubmitted = ({ body }: { body: string }) => (
  <Shell tone="sweep">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
      <Check className="h-6 w-6 text-teal-400" aria-hidden="true" />
    </div>
    <h1 className="mt-6 text-h4 font-bold tracking-snug text-ink-900">{copy.alreadyHeading}</h1>
    <p className="measure mt-3 text-body text-steel-700">{body}</p>
  </Shell>
);

/**
 * Sent.
 *
 * No ClickUp link and no task id. The line manager may well have a ClickUp
 * account, but the employee on the other side of a final review does not,
 * and a success screen that behaves differently depending on who opened it
 * is a screen nobody can support over the phone.
 */
export const KpiSubmitted = ({
  heading,
  body,
  detail,
}: {
  heading: string;
  body: string;
  /** The score, on a final review. Shown back because it is what they sent. */
  detail?: string | null;
}) => (
  <Shell tone="sweep">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
      <Check className="h-6 w-6 text-teal-400" aria-hidden="true" />
    </div>
    <h1 className="mt-6 text-h3 font-bold tracking-snug text-ink-900" role="status">
      {heading}
    </h1>
    <p className="measure mt-3 text-body text-steel-700">{body}</p>
    {detail ? (
      <p className="measure mt-2 font-mono text-body-sm tabular-nums text-steel-700">{detail}</p>
    ) : null}
  </Shell>
);

/**
 * The sample-data banner.
 *
 * Loud, and it says what it says because the alternative is somebody
 * demoing the form, liking it, and sending a real link to a manager from a
 * page that was never wired up.
 */
export const KpiSampleBanner = () => (
  <div className="flex gap-3 rounded-lg border border-ember-200 bg-ember-50/50 p-4">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" aria-hidden="true" />
    <div className="min-w-0">
      <p className="text-body-sm font-semibold text-ink-900">{copy.sampleHeading}</p>
      <p className="measure mt-1 text-[0.8125rem] leading-5 text-steel-700">{copy.sampleBody}</p>
    </div>
  </div>
);

/** An operational warning the endpoint asked for — TEST_MODE, so far. */
export const KpiWarningBanner = ({ warning }: { warning: string }) => (
  <div className="flex gap-3 rounded-lg border border-ember-200 bg-ember-50/40 p-4">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" aria-hidden="true" />
    <p className="measure text-body-sm text-ink-900">{warning}</p>
  </div>
);

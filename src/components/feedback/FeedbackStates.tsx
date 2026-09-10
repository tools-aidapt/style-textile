import { AlertTriangle, Check, Clock, LinkIcon, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy, voices } from "@/feedback/locale";
import type { FeedbackVoice } from "@/feedback/schema";
import type { ContextFault } from "@/feedback/session";

/**
 * The dead end is reached before the spec is — a token that does not verify
 * says nothing about which instrument it was for — so these screens default
 * to the candidate voice and take another only when the page knows one.
 */
const DEFAULT_VOICE: FeedbackVoice = voices.candidate;

/** What the page can be instead of, before, and after the form. */

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

export const FeedbackLoading = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading the feedback form">
    <div className="rounded-lg border border-mist-200 bg-white p-6 shadow-sm">
      <div className="h-4 w-40 rounded-sm bg-mist-100" />
      <div className="mt-3 h-4 w-56 rounded-sm bg-mist-50" />
    </div>
    {[0, 1].map((section) => (
      <div key={section} className="rounded-lg border border-mist-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-44 rounded-sm bg-mist-100" />
        <div className="mt-6 space-y-5">
          {[0, 1, 2].map((row) => (
            <div key={row}>
              <div className="h-3.5 w-3/4 rounded-sm bg-mist-50" />
              <div className="mt-2.5 h-8 w-48 rounded-md bg-mist-50" />
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
 * Renders this and NOTHING else — no form, no question list, no name, no
 * position, no company. A link that does not verify is opened by whoever
 * happens to hold it, which is not necessarily the person it was sent to, and
 * a screen that names the candidate or the role would tell them who was
 * interviewing where.
 *
 * Nor does it say *why* the token failed. Bad signature, expired and unknown
 * all read the same, because distinguishing them tells somebody holding a
 * guessed token which part of the guess was wrong.
 */
export const FeedbackDeadEnd = ({
  fault,
  reason,
  onRetry,
}: {
  fault: ContextFault;
  /**
   * The endpoint's own explanation, from an `ok: false` body.
   *
   * Preferred over the generic wording when present, because it is written
   * server-side where the secret is and can say something true that this app
   * cannot know. It is shown verbatim, so the endpoint owns the rule that it
   * must never name a person or a position — whoever holds the link reads it,
   * and that is not necessarily who it was sent to.
   */
  reason?: string | null;
  onRetry: () => void;
}) => {
  const content: Record<
    ContextFault,
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
 * Already answered.
 *
 * A separate screen from the dead end, and a warmer one: this person did what
 * was asked of them, and the only reason they are here is that they clicked
 * the link twice or kept the email. Telling them the link is dead would read
 * as their feedback having been lost.
 */
export const FeedbackAlreadySubmitted = ({
  voice = DEFAULT_VOICE,
}: {
  voice?: FeedbackVoice;
}) => (
  <Shell tone="sweep">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
      <Check className="h-6 w-6 text-teal-400" aria-hidden="true" />
    </div>
    <h1 className="mt-6 text-h4 font-bold tracking-snug text-ink-900">{copy.alreadyHeading}</h1>
    <p className="measure mt-3 text-body text-steel-700">{voice.alreadyBody}</p>
  </Shell>
);

/**
 * Sent.
 *
 * No ClickUp link and no reference number: a candidate has no account, and a
 * link they cannot open reads as a broken system. The rating is shown back
 * because it is the one thing they might want to check they got right, and
 * because it is theirs.
 */
export const FeedbackSubmitted = ({
  rating,
  voice = DEFAULT_VOICE,
}: {
  rating: number | null;
  voice?: FeedbackVoice;
}) => (
  <Shell tone="sweep">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
      <Check className="h-6 w-6 text-teal-400" aria-hidden="true" />
    </div>
    <h1 className="mt-6 text-h3 font-bold tracking-snug text-ink-900" role="status">
      {copy.successHeading}
    </h1>
    <p className="measure mt-3 text-body text-steel-700">{voice.successBody}</p>
    {rating !== null ? (
      <p className="measure mt-2 text-body text-steel-700">{voice.successRating(rating)}</p>
    ) : null}
  </Shell>
);

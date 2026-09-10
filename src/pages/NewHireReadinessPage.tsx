import * as React from "react";
import { PageShell, SectionLabel } from "@/components/AppShell";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import {
  FeedbackAlreadySubmitted,
  FeedbackDeadEnd,
  FeedbackLoading,
} from "@/components/feedback/FeedbackStates";
import { useFeedbackContext } from "@/hooks/useFeedbackContext";
import { useDocumentMeta } from "@/lib/seo";
import { logFeedback } from "@/feedback/log";
import { NEW_HIRE_READINESS } from "@/feedback/newHireReadiness";
import { servesFormType } from "@/feedback/schema";
import { readToken } from "@/feedback/session";

/**
 * F4 — the new-hire readiness review. Build C.
 *
 * Reached from the link WF-24 emails a line manager 30 and 90 days after one
 * of their reports joined. The same manager receives this form twice about
 * the same person, so the token carries the review point and the header
 * shows it: `Month 1` and `Month 3` are two different questions wearing the
 * same words.
 *
 * `noindex`, and the token is a credential. Stronger than elsewhere here:
 * this page names a specific employee and carries a manager's frank
 * assessment of them, so a crawled URL is a personnel record on the web.
 */
const NewHireReadinessPage = () => {
  const token = React.useMemo(() => readToken(), []);
  const { context, fault, reason, isLoading, refetch } = useFeedbackContext(token);
  const spec = NEW_HIRE_READINESS;

  useDocumentMeta({
    title: "New hire review — Kenafric",
    description: "Tell the Kenafric HR team how one of your new team members is settling in.",
    path: "/feedback/new-hire-readiness",
    noindex: true,
  });

  React.useEffect(() => {
    if (context) logFeedback("opened", { formType: context.formType });
    else if (fault) logFeedback("context-refused", { code: fault });
  }, [context, fault]);

  return (
    <PageShell
      crumbs={[{ label: "Feedback" }]}
      trail={<SectionLabel>Kenafric Group</SectionLabel>}
      mainClassName="pb-20"
    >
      <div className="mx-auto w-full max-w-form">
        <section className="surface-flow-light has-grain mt-5 overflow-hidden rounded-lg border border-frost-200 [--grain-strength:0.5]">
          <div className="relative z-raised px-5 py-4 sm:px-6 sm:py-5">
            <p className="text-overline font-semibold uppercase text-steel-600">
              {spec.voice.eyebrow}
            </p>
            <h1 className="mt-1 max-w-measure text-h5 font-extrabold tracking-tight text-ink-900">
              {spec.title}
            </h1>
            {context && !context.alreadySubmitted ? (
              <p className="measure mt-1.5 text-caption text-steel-700">{spec.intro}</p>
            ) : null}
          </div>
        </section>

        <div className="mt-5">
          {isLoading ? (
            <FeedbackLoading />
          ) : fault || !context || !servesFormType(spec, context.formType) ? (
            <FeedbackDeadEnd
              /*
               * A verified token for another instrument is its own dead end.
               * Folding it into `unreachable` told the reader to try again,
               * which can never work, and hid the real fault — a send
               * workflow that built the wrong link.
               */
              fault={fault ?? (context ? "wrong-form" : "unreachable")}
              reason={reason}
              onRetry={() => void refetch()}
            />
          ) : context.alreadySubmitted ? (
            <FeedbackAlreadySubmitted voice={spec.voice} />
          ) : (
            <FeedbackForm token={token} context={context} spec={spec} />
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default NewHireReadinessPage;

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
import { CANDIDATE_REVIEW } from "@/feedback/candidateReview";
import { copy } from "@/feedback/locale";
import { logFeedback } from "@/feedback/log";
import { readToken } from "@/feedback/session";

/**
 * F1 / F2 — the candidate recruitment review.
 *
 * Reached only from the link WF-15 emails a candidate the day after their
 * first attended interview. The `?t=` on that link is a signed token; the
 * candidate has no ClickUp account and never will, so there is no login in
 * front of this.
 *
 * `noindex` is not decoration, and neither is the `referrer: no-referrer` in
 * `index.html`. The URL carries a credential that identifies a person, so it
 * must not be crawled and it must not travel to another host in a `Referer`
 * header.
 *
 * The same route serves the internal variant. `formType` comes back from the
 * context endpoint as `CRR` or `ICRR`, and that is the only difference on
 * screen — the payroll number an internal applicant is shown. Splitting them
 * into two pages is how Airtable ended up with an internal form that carries
 * no form tag and reports as nothing.
 */
const CandidateReviewPage = () => {
  // Read once, on mount. Re-reading on every render would make the form's
  // identity depend on a history entry a link preview could change.
  const token = React.useMemo(() => readToken(), []);
  const { context, fault, isLoading, refetch } = useFeedbackContext(token);

  useDocumentMeta({
    title: "Your recruitment experience — Kenafric",
    description: "Tell the Kenafric HR team how your recruitment experience went.",
    path: "/feedback/candidate-review",
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
        {/* The one landmark gradient: cropped, Water-led, grain-welded and
            deliberately shallow — every row it takes is a row of the form
            pushed below the fold on a 360px screen. */}
        <section className="surface-flow-light has-grain mt-5 overflow-hidden rounded-lg border border-frost-200 [--grain-strength:0.5]">
          <div className="relative z-raised px-5 py-4 sm:px-6 sm:py-5">
            <p className="text-overline font-semibold uppercase text-steel-600">
              {copy.pageEyebrow}
            </p>
            <h1 className="mt-1 max-w-measure text-h5 font-extrabold tracking-tight text-ink-900">
              {CANDIDATE_REVIEW.title}
            </h1>
            {/* The intro is only true once we know the form will open. On a
                dead end it would promise three minutes and then refuse. */}
            {context && !context.alreadySubmitted ? (
              <p className="measure mt-1.5 text-caption text-steel-700">
                {CANDIDATE_REVIEW.intro}
              </p>
            ) : null}
          </div>
        </section>

        <div className="mt-5">
          {isLoading ? (
            <FeedbackLoading />
          ) : fault || !context ? (
            <FeedbackDeadEnd fault={fault ?? "unreachable"} onRetry={() => void refetch()} />
          ) : context.alreadySubmitted ? (
            <FeedbackAlreadySubmitted />
          ) : (
            <FeedbackForm token={token} context={context} spec={CANDIDATE_REVIEW} />
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default CandidateReviewPage;

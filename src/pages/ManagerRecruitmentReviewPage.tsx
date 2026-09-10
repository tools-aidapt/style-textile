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
import { MANAGER_RECRUITMENT_REVIEW } from "@/feedback/managerRecruitmentReview";
import { servesFormType } from "@/feedback/schema";
import { readToken } from "@/feedback/session";

/**
 * F3 — the manager recruitment review. Build B.
 *
 * Reached only from the link WF-23 emails the requesting manager on the day
 * their position closes as filled. Once per position, ever.
 *
 * The manager does have a ClickUp account, unlike a candidate — and this is
 * still a signed public link rather than anything behind a login. Two
 * reasons: it is opened from an email on a phone, where a ClickUp form is a
 * login wall; and the token is what carries *which position* is being
 * reviewed, so a manager who raised three requisitions this quarter answers
 * about the right one without choosing from a list.
 *
 * `noindex`, and `referrer: no-referrer` in `index.html`: the URL carries a
 * credential, so it must not be crawled and must not travel in a `Referer`.
 */
const ManagerRecruitmentReviewPage = () => {
  // Read once, on mount. Re-reading on every render would make the form's
  // identity depend on a history entry a link preview could change.
  const token = React.useMemo(() => readToken(), []);
  const { context, fault, reason, isLoading, refetch } = useFeedbackContext(token);
  const spec = MANAGER_RECRUITMENT_REVIEW;

  useDocumentMeta({
    title: "Recruitment review — Kenafric",
    description: "Tell the Kenafric HR team how the recruitment for this role went.",
    path: "/feedback/manager-recruitment-review",
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
            {/* Only true once we know the form will open. On a dead end it
                would promise three minutes and then refuse. */}
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
              fault={fault ?? "unreachable"}
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

export default ManagerRecruitmentReviewPage;

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
import { EMPLOYEE_CHECK_IN } from "@/feedback/employeeCheckIn";
import { logFeedback } from "@/feedback/log";
import { servesFormType } from "@/feedback/schema";
import { readToken } from "@/feedback/session";

/**
 * F5 — the employee experience and engagement check-in. Build D.
 *
 * Reached from the link WF-25 emails a new hire at Day 30, 60, 90, 120, 150
 * and 180 from joining. Six sends, so the header shows which check-in this
 * is — the same nine questions arrive six times and "Day 30" is not "Day
 * 180".
 *
 * **The questions are withheld until their ClickUp fields exist**, so this
 * route currently renders "not finished being set up" rather than a form.
 * See `feedback/employeeCheckIn.ts`.
 *
 * `noindex`, and the token is a credential: this page carries an employee
 * saying their supervisor does not support them.
 */
const EmployeeCheckInPage = () => {
  const token = React.useMemo(() => readToken(), []);
  const { context, fault, reason, isLoading, refetch } = useFeedbackContext(token);
  const spec = EMPLOYEE_CHECK_IN;

  useDocumentMeta({
    title: "Your check-in — Kenafric",
    description: "Tell the Kenafric HR team how you are finding your new role.",
    path: "/feedback/employee-check-in",
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

export default EmployeeCheckInPage;

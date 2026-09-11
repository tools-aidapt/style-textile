import * as React from "react";
import { PageShell, SectionLabel } from "@/components/AppShell";
import { ReviewForm } from "@/components/kpi/ReviewForm";
import {
  KpiAlreadySubmitted,
  KpiDeadEnd,
  KpiLoading,
  KpiSampleBanner,
  KpiWarningBanner,
} from "@/components/kpi/KpiStates";
import { useKpiContext } from "@/hooks/useKpiContext";
import { useDocumentMeta } from "@/lib/seo";
import { copy } from "@/kpi/locale";
import { logKpi } from "@/kpi/log";
import { readToken, servesFormType } from "@/kpi/session";

/**
 * Build F — the KPI review form. `/kpi/review?t=<token>`
 *
 * Reached from the link WF-26a emails at mid-probation and again a
 * fortnight before the probation end date. **One route, two modes**, and
 * which one is the context endpoint's word — not the address's and not the
 * token's as this app reads it, because the mode decides whether a manager
 * is asked to score somebody.
 *
 * `noindex`, and the token is a credential. This page carries a manager's
 * frank assessment of a named employee and the score a probation decision
 * rests on; a crawled URL here is worse than a leaked form.
 */
const KpiReviewPage = () => {
  const token = React.useMemo(() => readToken(), []);
  const { context, fault, reason, isLoading, refetch } = useKpiContext(token, "KPIR");
  const final = context?.mode === "final";

  useDocumentMeta({
    title: "Probation KPI review — Kenafric",
    description: "Review a team member against their agreed probation KPIs.",
    path: "/kpi/review",
    noindex: true,
  });

  React.useEffect(() => {
    if (context) logKpi("opened", { formType: context.formType, mode: context.mode });
    else if (fault) logKpi("context-refused", { code: fault });
  }, [context, fault]);

  return (
    <PageShell
      crumbs={[{ label: "Performance" }]}
      trail={<SectionLabel>Kenafric Group</SectionLabel>}
      mainClassName="pb-20"
    >
      <div className="mx-auto w-full max-w-form">
        <section className="surface-flow-light has-grain mt-5 overflow-hidden rounded-lg border border-frost-200 [--grain-strength:0.5]">
          <div className="relative z-raised px-5 py-4 sm:px-6 sm:py-5">
            <p className="text-overline font-semibold uppercase text-steel-600">{copy.eyebrow}</p>
            <h1 className="mt-1 max-w-measure text-h5 font-extrabold tracking-tight text-ink-900">
              {final ? copy.review.finalTitle : copy.review.midTitle}
            </h1>
            {context && !context.alreadySubmitted ? (
              <p className="measure mt-1.5 text-caption text-steel-700">
                {final ? copy.review.finalIntro : copy.review.midIntro}
              </p>
            ) : null}
          </div>
        </section>

        <div className="mt-5 space-y-4">
          {context?.sample ? <KpiSampleBanner /> : null}
          {context?.warning ? <KpiWarningBanner warning={context.warning} /> : null}

          {isLoading ? (
            <KpiLoading />
          ) : fault || !context ? (
            <KpiDeadEnd fault={fault ?? "unreachable"} reason={reason} onRetry={() => void refetch()} />
          ) : !servesFormType("KPIR", context) ? (
            <KpiDeadEnd fault="wrong-form" onRetry={() => void refetch()} />
          ) : context.alreadySubmitted ? (
            <KpiAlreadySubmitted body={copy.review.alreadyBody} />
          ) : context.kpis.length === 0 ? (
            /*
             * A review link for an employee with no KPIs. WF-26a is supposed
             * to make this unreachable — an event due but not ready is
             * neither fired nor marked — but a review form with nothing to
             * review must refuse rather than collect answers about nothing.
             */
            <KpiDeadEnd fault="empty-set" onRetry={() => void refetch()} />
          ) : (
            <ReviewForm token={token} context={context} />
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default KpiReviewPage;

import * as React from "react";
import { PageShell, SectionLabel } from "@/components/AppShell";
import { DefineForm } from "@/components/kpi/DefineForm";
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
 * Build E — the KPI definition form. `/kpi/define?t=<token>`
 *
 * Reached from the link WF-18a emails a line manager once a new hire's
 * record is ready. One per employee per review cycle: WF-18a will not send a
 * second, and WF-18b refuses a second set at the same cycle.
 *
 * `noindex`, and the token is a credential. This page names an employee, a
 * position and a probation end date, so a crawled URL is a personnel record
 * on the web.
 */
const KpiDefinePage = () => {
  const token = React.useMemo(() => readToken(), []);
  const { context, fault, reason, isLoading, refetch } = useKpiContext(token, "KPID");

  useDocumentMeta({
    title: "Set probation KPIs — Kenafric",
    description: "Agree and record probation KPIs for a new team member.",
    path: "/kpi/define",
    noindex: true,
  });

  React.useEffect(() => {
    if (context) logKpi("opened", { formType: context.formType });
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
              {copy.define.title}
            </h1>
            {context && !context.alreadySubmitted ? (
              <p className="measure mt-1.5 text-caption text-steel-700">{copy.define.intro}</p>
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
          ) : !servesFormType("KPID", context) ? (
            /*
             * A verified token for the review form, opened here. Its own
             * dead end rather than folded into `unreachable`, because
             * retrying can never fix it and because it means a send workflow
             * built the wrong link — our bug, and one that must fail
             * visibly the first time.
             */
            <KpiDeadEnd fault="wrong-form" onRetry={() => void refetch()} />
          ) : context.alreadySubmitted ? (
            <KpiAlreadySubmitted body={copy.define.alreadyBody} />
          ) : (
            <DefineForm token={token} context={context} />
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default KpiDefinePage;

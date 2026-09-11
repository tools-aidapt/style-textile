import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { Eyebrow } from "@/components/careers/primitives";
import { cn } from "@/lib/utils";
import { readableDate, type AgreedKpi, type KpiContext } from "@/kpi/session";
import { copy } from "@/kpi/locale";
import { PrefilledFact } from "./fields";

/** The panel every block on both KPI forms sits in. */
export const Panel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={cn("overflow-hidden rounded-lg border border-mist-200 bg-white shadow-sm", className)}
  >
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

/**
 * Everything Kenafric already knows, shown back rather than asked for.
 *
 * This block is the reason the KPI layer is being rebuilt at all. In V1 a
 * manager typed the employee's name, position and dates into a spreadsheet,
 * and a sheet with a typed name is attached to nothing: it cannot be scored,
 * reported on, or found three months later when the confirmation decision
 * is due. **If either KPI form ever asks for one of these, we have rebuilt
 * the V1 problem in React.**
 *
 * The probation end date is rendered as a sentence rather than as a date
 * cell, because it is the deadline the KPIs are written against and a
 * manager skim-reading a grid of dates will not register which one that is.
 */
export const KpiHeader = ({
  context,
  heading,
  privacyNote,
}: {
  context: KpiContext;
  heading: string;
  privacyNote: string;
}) => {
  const { prefill } = context;
  const end = readableDate(prefill.probationEndDate);

  return (
    <Panel>
      <Eyebrow>{heading}</Eyebrow>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <PrefilledFact label="Employee" value={prefill.employeeName} />
        <PrefilledFact label="Position" value={prefill.positionTitle} />
        <PrefilledFact label="Department" value={prefill.department} />
        <PrefilledFact label="Company" value={prefill.company} />
        <PrefilledFact label="Line manager" value={prefill.lineManager} />
        <PrefilledFact label="Joining date" value={readableDate(prefill.joiningDate)} />
        <PrefilledFact label="Review cycle" value={prefill.reviewCycle} />
      </dl>

      {end ? (
        <p className="measure mt-5 text-body-sm text-ink-900">
          These KPIs are reviewed on or before <strong className="font-semibold">{end}</strong>.
        </p>
      ) : null}

      <p className="measure mt-4 flex gap-2.5 text-[0.8125rem] leading-5 text-steel-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
        <span>{privacyNote}</span>
      </p>
    </Panel>
  );
};

/**
 * The agreed KPI set, read-only, above the review answers.
 *
 * A manager reviewing from memory reviews the last fortnight. This is the
 * whole set as HR approved it — including how each KPI was to be measured,
 * which is the part that decides whether an actual figure means anything.
 *
 * A table on a wide screen because that is how the KIL sheet reads and HR
 * recognises it; stacked cards below `lg`, because a five-column table at
 * 360px is a horizontal scroll nobody performs.
 */
export const AgreedSet = ({ kpis }: { kpis: AgreedKpi[] }) => (
  <Panel>
    <Eyebrow>{copy.review.agreedHeading}</Eyebrow>
    <p className="measure mt-2 text-body-sm text-steel-600">{copy.review.agreedIntro}</p>

    <div className="mt-5 hidden overflow-x-auto lg:block">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-mist-200">
            {["Key result area", "KPI", "How it is measured", "Target", "Weight"].map((head) => (
              <th
                key={head}
                scope="col"
                className="py-2 pr-4 text-caption font-medium text-steel-700 last:pr-0"
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {kpis.map((kpi) => (
            <tr key={kpi.taskId} className="border-b border-mist-100 last:border-b-0">
              <td className="py-3 pr-4 align-top text-body-sm text-steel-700">
                {kpi.keyResultArea}
              </td>
              <td className="py-3 pr-4 align-top text-body-sm font-medium text-ink-900">
                {kpi.kpi}
              </td>
              <td className="py-3 pr-4 align-top text-[0.8125rem] leading-5 text-steel-600">
                {kpi.howMeasured}
              </td>
              <td className="py-3 pr-4 align-top text-body-sm text-steel-700">
                {kpi.target}
                {kpi.targetFigure !== null ? (
                  <span className="mt-0.5 block font-mono text-caption tabular-nums text-steel-600">
                    {kpi.targetFigure.toLocaleString()} {kpi.unitOfMeasure ?? ""}
                  </span>
                ) : null}
              </td>
              <td className="py-3 align-top font-mono text-body-sm tabular-nums text-ink-900">
                {kpi.weight}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <ul className="mt-5 space-y-3 lg:hidden">
      {kpis.map((kpi) => (
        <li key={kpi.taskId} className="rounded-md border border-mist-200 p-3">
          <p className="text-overline font-semibold uppercase text-steel-600">
            {kpi.keyResultArea}
          </p>
          <p className="mt-1 text-body-sm font-medium text-ink-900">{kpi.kpi}</p>
          <p className="mt-1.5 text-[0.8125rem] leading-5 text-steel-600">{kpi.howMeasured}</p>
          <p className="mt-1.5 text-[0.8125rem] leading-5 text-steel-700">{kpi.target}</p>
          <p className="mt-1.5 font-mono text-caption tabular-nums text-steel-600">
            {kpi.targetFigure !== null
              ? `${kpi.targetFigure.toLocaleString()} ${kpi.unitOfMeasure ?? ""} · `
              : ""}
            {kpi.weight}% weight
          </p>
        </li>
      ))}
    </ul>
  </Panel>
);

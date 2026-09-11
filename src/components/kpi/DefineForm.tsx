import * as React from "react";
import { AlertTriangle, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/careers/primitives";
import { cn } from "@/lib/utils";
import { config } from "@/lib/config";
import { useKpiSubmit } from "@/hooks/useKpiSubmit";
import { copy } from "@/kpi/locale";
import { logKpi } from "@/kpi/log";
import { buildDefinition } from "@/kpi/payload";
import {
  emptyRow,
  isQuantitative,
  startingRows,
  weightTotal,
  type KpiRow,
} from "@/kpi/form";
import {
  KRA_SUGGESTIONS,
  MAX_KPIS,
  MAX_KPI_LENGTH,
  MEASUREMENT_TYPES,
  MIN_KPIS,
  UNIT_SUGGESTIONS,
  WEIGHT_TOTAL,
  controlDomId,
  errorKey,
} from "@/kpi/schema";
import type { KpiContext } from "@/kpi/session";
import { validateDefinition, weightDelta } from "@/kpi/validation";
import { ChoiceField, NumberField, TextField, LongTextField } from "./fields";
import { KpiHeader, Panel } from "./KpiHeader";
import { KpiSubmitted } from "./KpiStates";

/**
 * Build E — the KPI definition form.
 *
 * Three to five KPIs, weights totalling 100. The field order inside a row is
 * the order it must render and is not a layout preference:
 *
 *   1 Key result area · 2 KPI · 3 **Measurement type** · 4 How measured ·
 *   5 Target figure · 6 Unit · 7 Target · 8 Weight
 *
 * **Measurement type sits at 3, ahead of the targets.** It decides whether 5
 * and 6 render at all, and asking for a target figure before knowing whether
 * the KPI is numeric is exactly how `Improve communication, target 100,
 * unit %` gets typed — a number that means nothing, on a row nobody can
 * score.
 */

const ROW_GAP = "space-y-5";

export const DefineForm = ({ token, context }: { token: string; context: KpiContext }) => {
  const [rows, setRows] = React.useState<KpiRow[]>(() => startingRows());
  /**
   * Which controls may show an error.
   *
   * Errors appear on blur, never on keystroke — a manager typing `4` on the
   * way to `45` must not be told 4 is below the minimum. A radio group is
   * complete the instant it is chosen, so those touch immediately; a submit
   * attempt touches everything at once.
   */
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = React.useState(false);
  const { state, submit } = useKpiSubmit();

  const total = weightTotal(rows);
  const delta = weightDelta(rows);
  const { errors, missing } = React.useMemo(() => validateDefinition(rows), [rows]);

  /** What WF-18b said was wrong, keyed the same way the local errors are. */
  const serverErrors = React.useMemo(() => {
    if (state.status !== "rejected") return {} as Record<string, string>;
    return state.issues.reduce<Record<string, string>>((all, issue) => {
      if (issue.field) all[issue.field] = issue.message;
      return all;
    }, {});
  }, [state]);

  const errorFor = (row: KpiRow, name: string): string | undefined => {
    const key = errorKey(row.id, name);
    return serverErrors[key] ?? (attempted || touched[key] ? errors[key] : undefined);
  };

  const touch = (row: KpiRow, name: string) =>
    setTouched((current) => ({ ...current, [errorKey(row.id, name)]: true }));

  const setCell = (row: KpiRow, name: keyof KpiRow, value: string) =>
    setRows((current) =>
      current.map((candidate) =>
        candidate.id === row.id ? { ...candidate, [name]: value } : candidate,
      ),
    );

  const focusKey = (key: string) => {
    const [rowId, name] = key.split(".");
    const target = document.getElementById(`${controlDomId(rowId, name)}-field`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true });
  };

  const addRow = () => {
    if (rows.length >= MAX_KPIS) return;
    setRows((current) => [...current, emptyRow()]);
  };

  const removeRow = (row: KpiRow) => {
    if (rows.length <= MIN_KPIS) return;
    setRows((current) => current.filter((candidate) => candidate.id !== row.id));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAttempted(true);

    if (missing.length) {
      focusKey(missing[0]);
      return;
    }
    // Belt and braces: Submit is disabled until the total is exact, so this
    // is only reachable by a keyboard submit on a form mid-edit
    if (total !== WEIGHT_TOTAL) return;

    void submit(buildDefinition({ token, rows }), {
      url: config.kpiDefineSubmitUrl,
      sample: context.sample,
    });
  };

  React.useEffect(() => {
    if (state.status === "succeeded") {
      logKpi("submitted", { formType: "KPID", kpis: rows.length });
    }
  }, [state.status, rows.length]);

  if (state.status === "succeeded") {
    return (
      <KpiSubmitted
        heading={copy.define.successHeading}
        body={copy.define.successBody}
      />
    );
  }

  const busy = state.status === "submitting";
  const ready = total === WEIGHT_TOTAL;
  /** Unattributed rejections — the ones no single control owns. */
  const looseIssues =
    state.status === "rejected" ? state.issues.filter((issue) => !issue.field) : [];

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <KpiHeader
        context={context}
        heading={copy.define.detailsHeading}
        privacyNote={copy.define.privacyNote}
      />

      <Panel>
        <Eyebrow>{copy.define.sectionTitle}</Eyebrow>
        <SectionHeading className="mt-2">{copy.define.title}</SectionHeading>
        <p className="measure mt-2 text-body-sm text-steel-600">{copy.define.sectionIntro}</p>

        <ol className="mt-6 space-y-4">
          {rows.map((row, index) => {
            const quantitative = isQuantitative(row);
            const kpiLength = row.kpi.trim().length;

            return (
              <li
                key={row.id}
                className="rounded-lg border border-mist-200 bg-white p-4 sm:p-5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-body-sm font-semibold text-ink-900">
                    {copy.define.rowHeading(index + 1)}
                  </p>
                  {/*
                   * Removal disappears at the minimum rather than being
                   * disabled with an explanation. The rule "three at least"
                   * does not need stating if it cannot be broken.
                   */}
                  {rows.length > MIN_KPIS ? (
                    <button
                      type="button"
                      onClick={() => removeRow(row)}
                      aria-label={copy.define.removeRowLabel(index + 1)}
                      className="press tap-44 inline-flex items-center gap-1.5 rounded-sm text-caption font-medium text-steel-600 hover:text-ember-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {copy.define.removeRow}
                    </button>
                  ) : null}
                </div>

                <div className={cn("mt-4", ROW_GAP)}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      row={row.id}
                      name="keyResultArea"
                      label="Key result area"
                      help="The area of the business this KPI sits in."
                      required
                      suggestions={KRA_SUGGESTIONS}
                      value={row.keyResultArea}
                      onChange={(value) => setCell(row, "keyResultArea", value)}
                      onBlur={() => touch(row, "keyResultArea")}
                      error={errorFor(row, "keyResultArea")}
                    />

                    <TextField
                      row={row.id}
                      name="kpi"
                      label="Key performance indicator"
                      help="One sentence. This becomes the name of the KPI on the employee's record."
                      required
                      maxLength={MAX_KPI_LENGTH}
                      value={row.kpi}
                      onChange={(value) => setCell(row, "kpi", value)}
                      onBlur={() => touch(row, "kpi")}
                      error={errorFor(row, "kpi")}
                      suffix={
                        // Only in the last stretch, where it is a warning
                        // rather than an instruction to write to length
                        kpiLength > MAX_KPI_LENGTH - 25 ? (
                          <span className="font-mono text-caption tabular-nums text-steel-500">
                            {MAX_KPI_LENGTH - kpiLength} left
                          </span>
                        ) : null
                      }
                    />
                  </div>

                  {/*
                   * Third, and ahead of the targets, because it decides
                   * whether they render at all. See the module header.
                   */}
                  <ChoiceField
                    row={row.id}
                    name="measurementType"
                    label="How is this measured?"
                    help="Quantitative KPIs are scored against a figure. Qualitative ones are scored on a 1 to 5 rating at the final review."
                    required
                    options={MEASUREMENT_TYPES}
                    value={row.measurementType}
                    onChange={(value) => {
                      setCell(row, "measurementType", value);
                      touch(row, "measurementType");
                    }}
                    columns={false}
                  />

                  <LongTextField
                    row={row.id}
                    name="howMeasured"
                    label="Where does the measurement come from?"
                    help="The report, register or system the figure is read from, and how often."
                    required
                    rows={2}
                    value={row.howMeasured}
                    onChange={(value) => setCell(row, "howMeasured", value)}
                    onBlur={() => touch(row, "howMeasured")}
                    error={errorFor(row, "howMeasured")}
                  />

                  {/*
                   * Hidden, not disabled, on a qualitative KPI. A greyed-out
                   * target figure invites a manager to wonder what they did
                   * wrong; an absent one says the question does not apply.
                   */}
                  {quantitative ? (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <NumberField
                        row={row.id}
                        name="targetFigure"
                        label="Target figure"
                        help="The number to be reached. It cannot be zero — the score is worked out against it."
                        required
                        value={row.targetFigure}
                        onChange={(value) => setCell(row, "targetFigure", value)}
                        onBlur={() => touch(row, "targetFigure")}
                        error={errorFor(row, "targetFigure")}
                      />
                      <TextField
                        row={row.id}
                        name="unitOfMeasure"
                        label="Unit of measure"
                        help="What the figure is counted in."
                        required
                        suggestions={UNIT_SUGGESTIONS}
                        value={row.unitOfMeasure}
                        onChange={(value) => setCell(row, "unitOfMeasure", value)}
                        onBlur={() => touch(row, "unitOfMeasure")}
                        error={errorFor(row, "unitOfMeasure")}
                      />
                    </div>
                  ) : null}

                  <LongTextField
                    row={row.id}
                    name="target"
                    label="Target"
                    help="The target as a sentence — this is what the review is read against."
                    required
                    rows={2}
                    value={row.target}
                    onChange={(value) => setCell(row, "target", value)}
                    onBlur={() => touch(row, "target")}
                    error={errorFor(row, "target")}
                  />

                  <NumberField
                    row={row.id}
                    name="weight"
                    label="Weight"
                    help={copy.define.weightCap}
                    required
                    unit="%"
                    className="max-w-[12rem]"
                    value={row.weight}
                    onChange={(value) => setCell(row, "weight", value)}
                    onBlur={() => touch(row, "weight")}
                    error={errorFor(row, "weight")}
                  />
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={addRow}
            disabled={rows.length >= MAX_KPIS}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {copy.define.addRow}
          </Button>
          {rows.length >= MAX_KPIS ? (
            <p className="text-caption text-steel-600">{copy.define.atMax}</p>
          ) : null}
        </div>
      </Panel>

      <Panel>
        {/*
         * The weight total, live.
         *
         * A running figure with its distance to 100, not an error: a manager
         * distributing five weights is mid-calculation for the whole
         * exercise, and an error that appears and disappears on every
         * keystroke is noise. Submit stays disabled until it reads 100.
         */}
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Eyebrow>{copy.define.weightHeading}</Eyebrow>
          <p
            className={cn(
              "font-mono text-h5 font-semibold tabular-nums",
              ready ? "text-teal-700" : "text-ink-900",
            )}
            aria-live="polite"
          >
            {copy.define.weightTotal(total)}
          </p>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist-100">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-normal",
              delta > 0 ? "bg-ember-500" : ready ? "bg-teal-400" : "bg-steel-300",
            )}
            style={{ width: `${Math.min(Math.abs(total), WEIGHT_TOTAL)}%` }}
            aria-hidden="true"
          />
        </div>

        <p className="mt-2 text-body-sm text-steel-700">
          {ready
            ? copy.define.weightExact
            : delta < 0
              ? copy.define.weightShort(Math.abs(delta))
              : copy.define.weightOver(delta)}
        </p>
      </Panel>

      <Panel>
        {/* Announced, because a submit that refused is a change of state a
            screen reader user has no other way to notice */}
        <div aria-live="polite">
          {attempted && missing.length ? (
            <div className="mb-5 flex gap-3 rounded-md border border-ember-200 bg-ember-50/50 p-4">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-ember-500"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-body-sm font-semibold text-ink-900">
                  {copy.incompleteHeading(missing.length)}
                </p>
                <p className="mt-1 text-[0.8125rem] leading-5 text-steel-700">
                  {copy.incompleteBody}
                </p>
                <button
                  type="button"
                  onClick={() => focusKey(missing[0])}
                  className="press mt-2 rounded-sm text-[0.8125rem] font-semibold text-teal-700 underline underline-offset-4"
                >
                  {copy.incompleteJump}
                </button>
              </div>
            </div>
          ) : null}

          {looseIssues.length ? (
            <div className="mb-5 rounded-md border border-ember-200 bg-ember-50/50 p-4">
              <ul className="space-y-1.5">
                {looseIssues.map((issue, index) => (
                  <li key={index} className="text-body-sm text-ink-900">
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {state.status === "failed" ? (
            <div className="mb-5 flex gap-3 rounded-md border border-ember-200 bg-ember-50/50 p-4">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-ember-500"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-body-sm font-semibold text-ink-900">{copy.failedHeading}</p>
                <p className="measure mt-1 text-[0.8125rem] leading-5 text-steel-700">
                  {state.message}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-caption tabular-nums text-steel-600">
            {rows.length} KPIs · {copy.define.weightTotal(total)}
          </p>
          {/*
           * Disabled until the weights are exact, and it stays disabled once
           * pressed: the token is single-use, and a second POST would be
           * refused by WF-18b's dedupe guard rather than land twice. The
           * guard is the insurance, not the design.
           */}
          <Button type="submit" size="lg" disabled={busy || !ready}>
            <Send className="h-4 w-4" aria-hidden="true" />
            {busy ? copy.define.submitting : copy.define.submit}
          </Button>
        </div>

        <p className="mt-3 text-caption text-steel-500">
          {ready ? copy.requiredNote : copy.define.submitBlocked}
        </p>
      </Panel>
    </form>
  );
};

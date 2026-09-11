import * as React from "react";
import { AlertTriangle, PenLine, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/careers/primitives";
import { config } from "@/lib/config";
import { useKpiSubmit } from "@/hooks/useKpiSubmit";
import { copy } from "@/kpi/locale";
import { logKpi } from "@/kpi/log";
import { buildReview } from "@/kpi/payload";
import {
  emptyFinalRow,
  emptyMidRow,
  emptyTalent,
  parseNumber,
  type FinalRowState,
  type MidRowState,
  type TalentState,
} from "@/kpi/form";
import {
  MAX_CAPACITY_BUILDING,
  MAX_CAREER_ASPIRATIONS,
  MAX_NOTES_LENGTH,
  PROGRESS_NEEDS_NOTE,
  PROGRESS_VALUES,
  controlDomId,
  errorKey,
} from "@/kpi/schema";
import { asPercent, finalIndividualScore, totalsFor } from "@/kpi/score";
import type { AgreedKpi, KpiContext } from "@/kpi/session";
import { validateFinal, validateMid } from "@/kpi/validation";
import { ChoiceField, LongTextField, NumberField, RatingField, TextField } from "./fields";
import { AgreedSet, KpiHeader, Panel } from "./KpiHeader";
import { KpiSubmitted } from "./KpiStates";

/**
 * Build F — the KPI review form, mid and final.
 *
 * **One route, two modes.** The mid review is the final review with the
 * scoring block hidden. Two codebases would drift the way the Airtable
 * candidate forms already did, and the drift would land on the half that
 * decides somebody's probation.
 *
 * Which mode this is comes from the CONTEXT, never from the URL and never
 * from the token as this app reads it: a manager who edited `mode=mid` to
 * `mode=final` in the address bar would otherwise be handed the scoring
 * block three months early.
 */

const ratingOf = (row: FinalRowState): number | null => parseNumber(row.rating);

export const ReviewForm = ({ token, context }: { token: string; context: KpiContext }) => {
  const mode = context.mode ?? "mid";
  const final = mode === "final";
  const kpis = context.kpis;

  const [midRows, setMidRows] = React.useState<Record<string, MidRowState>>(() =>
    Object.fromEntries(kpis.map((kpi) => [kpi.taskId, emptyMidRow()])),
  );
  const [finalRows, setFinalRows] = React.useState<Record<string, FinalRowState>>(() =>
    Object.fromEntries(kpis.map((kpi) => [kpi.taskId, emptyFinalRow()])),
  );
  const [talent, setTalent] = React.useState<TalentState>(() => emptyTalent());
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = React.useState(false);
  const { state, submit } = useKpiSubmit();

  const { errors, missing } = React.useMemo(
    () =>
      final
        ? validateFinal(kpis, finalRows, talent, context.hr)
        : validateMid(kpis, midRows),
    [final, kpis, finalRows, midRows, talent, context.hr],
  );

  /**
   * The score as it stands.
   *
   * Recomputed on every keystroke and shown per row and in total, because a
   * manager who enters 30 against a target of 45 should see 67% before they
   * rate it a 4. **None of it is sent** — WF-26b computes what gets stored,
   * and the ClickUp formula recomputes each row's weighted score.
   */
  const totals = React.useMemo(
    () =>
      totalsFor(
        kpis,
        kpis.map((kpi) => ({
          taskId: kpi.taskId,
          actual: parseNumber(finalRows[kpi.taskId]?.actual ?? ""),
          rating: ratingOf(finalRows[kpi.taskId] ?? emptyFinalRow()),
        })),
      ),
    [kpis, finalRows],
  );

  const adjustment = context.hr ? parseNumber(talent.panelAdjustment) : null;
  const finalScore = finalIndividualScore(totals.weighted, adjustment);

  const serverErrors = React.useMemo(() => {
    if (state.status !== "rejected") return {} as Record<string, string>;
    return state.issues.reduce<Record<string, string>>((all, issue) => {
      if (issue.field) all[issue.field] = issue.message;
      return all;
    }, {});
  }, [state]);

  const errorFor = (row: string, name: string): string | undefined => {
    const key = errorKey(row, name);
    return serverErrors[key] ?? (attempted || touched[key] ? errors[key] : undefined);
  };

  const touch = (row: string, name: string) =>
    setTouched((current) => ({ ...current, [errorKey(row, name)]: true }));

  const setMid = (taskId: string, patch: Partial<MidRowState>) =>
    setMidRows((current) => ({
      ...current,
      [taskId]: { ...(current[taskId] ?? emptyMidRow()), ...patch },
    }));

  const setFinal = (taskId: string, patch: Partial<FinalRowState>) =>
    setFinalRows((current) => ({
      ...current,
      [taskId]: { ...(current[taskId] ?? emptyFinalRow()), ...patch },
    }));

  const setTalentLine = (
    key: "capacityBuilding" | "careerAspirations",
    index: number,
    value: string,
  ) =>
    setTalent((current) => ({
      ...current,
      [key]: current[key].map((line, i) => (i === index ? value : line)),
    }));

  const focusKey = (key: string) => {
    const [row, name] = key.split(".");
    const target = document.getElementById(`${controlDomId(row, name)}-field`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true });
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAttempted(true);

    if (missing.length) {
      focusKey(missing[0]);
      return;
    }

    void submit(
      buildReview({
        mode,
        token,
        kpis,
        midRows,
        finalRows,
        talent,
        hr: context.hr,
      }),
      { url: config.kpiReviewSubmitUrl, sample: context.sample },
    );
  };

  React.useEffect(() => {
    if (state.status === "succeeded") {
      logKpi("submitted", { formType: "KPIR", mode, kpis: kpis.length });
    }
  }, [state.status, mode, kpis.length]);

  if (state.status === "succeeded") {
    return (
      <KpiSubmitted
        heading={copy.review.successHeading}
        body={final ? copy.review.finalSuccessBody : copy.review.midSuccessBody}
        detail={
          final && finalScore !== null
            ? `${copy.review.totalFinal}: ${finalScore} of ${totals.weightBasis}`
            : null
        }
      />
    );
  }

  const busy = state.status === "submitting";
  const looseIssues =
    state.status === "rejected" ? state.issues.filter((issue) => !issue.field) : [];

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <KpiHeader
        context={context}
        heading={copy.review.detailsHeading}
        privacyNote={final ? copy.review.finalPrivacyNote : copy.review.midPrivacyNote}
      />

      <AgreedSet kpis={kpis} />

      <Panel>
        <Eyebrow>{copy.review.answersHeading}</Eyebrow>
        <SectionHeading className="mt-2">
          {final ? copy.review.finalTitle : copy.review.midTitle}
        </SectionHeading>

        <ol className="mt-6 space-y-4">
          {kpis.map((kpi, index) => (
            <li key={kpi.taskId} className="rounded-lg border border-mist-200 p-4 sm:p-5">
              <ReviewRow
                kpi={kpi}
                index={index + 1}
                final={final}
                mid={midRows[kpi.taskId] ?? emptyMidRow()}
                finalRow={finalRows[kpi.taskId] ?? emptyFinalRow()}
                score={totals.rows.find((row) => row.taskId === kpi.taskId) ?? null}
                onMid={(patch) => setMid(kpi.taskId, patch)}
                onFinal={(patch) => setFinal(kpi.taskId, patch)}
                onTouch={(name) => touch(kpi.taskId, name)}
                errorFor={(name) => errorFor(kpi.taskId, name)}
              />
            </li>
          ))}
        </ol>
      </Panel>

      {final ? (
        <>
          <Panel>
            {/*
             * The talent block, KIL rows 20-42, in the sheet's own order.
             *
             * The helper text is the client's, kept verbatim where they
             * wrote it: it carries the approval criteria — strategic
             * direction, succession planning, budget allocation — and a
             * manager paraphrasing from memory loses them.
             */}
            <Eyebrow>{copy.review.talentHeading}</Eyebrow>
            <p className="measure mt-2 text-body-sm text-steel-600">{copy.review.talentIntro}</p>

            <div className="mt-6 space-y-6">
              <fieldset>
                <legend className="text-caption font-medium text-ink-900">
                  {copy.review.capacityLabel}
                </legend>
                <p className="measure mt-1 text-[0.75rem] leading-4 text-steel-600">
                  {copy.review.capacityHelp}
                </p>
                <div className="mt-3 space-y-3">
                  {Array.from({ length: MAX_CAPACITY_BUILDING }, (_, index) => (
                    <TextField
                      key={index}
                      row="talent"
                      name={`capacity${index}`}
                      label={copy.review.capacityLine(index + 1)}
                      value={talent.capacityBuilding[index] ?? ""}
                      onChange={(value) => setTalentLine("capacityBuilding", index, value)}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-caption font-medium text-ink-900">
                  {copy.review.aspirationsLabel}
                </legend>
                <p className="measure mt-1 text-[0.75rem] leading-4 text-steel-600">
                  {copy.review.aspirationsHelp}
                </p>
                <div className="mt-3 space-y-3">
                  {Array.from({ length: MAX_CAREER_ASPIRATIONS }, (_, index) => (
                    <TextField
                      key={index}
                      row="talent"
                      name={`aspiration${index}`}
                      label={copy.review.aspirationsLine(index + 1)}
                      value={talent.careerAspirations[index] ?? ""}
                      onChange={(value) => setTalentLine("careerAspirations", index, value)}
                    />
                  ))}
                </div>
              </fieldset>

              <LongTextField
                row="talent"
                name="employeeComments"
                label={copy.review.employeeCommentsLabel}
                help={copy.review.employeeCommentsHelp}
                maxLength={MAX_NOTES_LENGTH}
                value={talent.employeeComments}
                onChange={(value) => setTalent((c) => ({ ...c, employeeComments: value }))}
                onBlur={() => touch("talent", "employeeComments")}
                error={errorFor("talent", "employeeComments")}
              />

              <LongTextField
                row="talent"
                name="managerComments"
                label={copy.review.managerCommentsLabel}
                required
                maxLength={MAX_NOTES_LENGTH}
                value={talent.managerComments}
                onChange={(value) => setTalent((c) => ({ ...c, managerComments: value }))}
                onBlur={() => touch("talent", "managerComments")}
                error={errorFor("talent", "managerComments")}
              />

              {/*
               * HR only, and absent rather than disabled for everybody else.
               * A line manager who can see a control that moves somebody's
               * final score will ask why they cannot use it.
               */}
              {context.hr ? (
                <NumberField
                  row="talent"
                  name="panelAdjustment"
                  label={copy.review.panelAdjustmentLabel}
                  help={copy.review.panelAdjustmentHelp}
                  className="max-w-[14rem]"
                  value={talent.panelAdjustment}
                  onChange={(value) => setTalent((c) => ({ ...c, panelAdjustment: value }))}
                  onBlur={() => touch("talent", "panelAdjustment")}
                  error={errorFor("talent", "panelAdjustment")}
                />
              ) : null}
            </div>
          </Panel>

          <Panel>
            <Eyebrow>{copy.review.totalsHeading}</Eyebrow>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-caption text-steel-600">{copy.review.totalWeighted}</dt>
                <dd
                  className="mt-0.5 font-mono text-h5 font-semibold tabular-nums text-ink-900"
                  aria-live="polite"
                >
                  {totals.weighted === null
                    ? copy.review.scorePending
                    : `${totals.weighted} / ${totals.weightBasis}`}
                </dd>
              </div>
              {context.hr ? (
                <div>
                  <dt className="text-caption text-steel-600">{copy.review.totalFinal}</dt>
                  <dd className="mt-0.5 font-mono text-h5 font-semibold tabular-nums text-ink-900">
                    {finalScore === null
                      ? copy.review.scorePending
                      : `${finalScore} / ${totals.weightBasis}`}
                  </dd>
                </div>
              ) : null}
            </dl>

            {totals.weighted === null ? (
              <p className="mt-3 text-body-sm text-steel-700">{copy.review.totalPending}</p>
            ) : null}

            {/*
             * A voided KPI drops out of the numerator AND the denominator.
             * Said out loud whenever the live set is not 100, so nobody
             * reads 62 as out of 100 when it is out of 80.
             */}
            {totals.weightBasis !== 100 ? (
              <p className="measure mt-3 text-body-sm text-ember-500">
                {copy.review.totalBasis(totals.weightBasis)}
              </p>
            ) : null}

            <p className="measure mt-4 flex gap-2.5 text-[0.8125rem] leading-5 text-steel-600">
              <PenLine className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
              <span>{copy.review.signOffNote}</span>
            </p>
          </Panel>
        </>
      ) : null}

      <Panel>
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
            {kpis.length} KPIs · {totals.weightBasis}% of weight
          </p>
          <Button type="submit" size="lg" disabled={busy}>
            <Send className="h-4 w-4" aria-hidden="true" />
            {busy
              ? copy.review.submitting
              : final
                ? copy.review.submitFinal
                : copy.review.submitMid}
          </Button>
        </div>

        <p className="mt-3 text-caption text-steel-500">{copy.requiredNote}</p>
      </Panel>
    </form>
  );
};

/**
 * One KPI's answers.
 *
 * The read-only recap at the top of the row is not a duplicate of the
 * agreed-set table above: that table is the set, this is the one line the
 * manager is answering about right now, and on a phone the table is several
 * screens away by the time they reach row four.
 */
const ReviewRow = ({
  kpi,
  index,
  final,
  mid,
  finalRow,
  score,
  onMid,
  onFinal,
  onTouch,
  errorFor,
}: {
  kpi: AgreedKpi;
  index: number;
  final: boolean;
  mid: MidRowState;
  finalRow: FinalRowState;
  score: { score: number | null; weighted: number | null; uncapped: number | null } | null;
  onMid: (patch: Partial<MidRowState>) => void;
  onFinal: (patch: Partial<FinalRowState>) => void;
  onTouch: (name: string) => void;
  errorFor: (name: string) => string | undefined;
}) => {
  const quantitative = kpi.measurementType === "Quantitative";
  const rating = parseNumber(finalRow.rating);
  const needsNote = mid.progress !== "" && PROGRESS_NEEDS_NOTE.includes(mid.progress);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-overline font-semibold uppercase text-steel-600">
          {index}. {kpi.keyResultArea}
        </p>
        <p className="mt-1 text-body-sm font-semibold text-ink-900">{kpi.kpi}</p>
        <p className="mt-1 text-[0.8125rem] leading-5 text-steel-600">{kpi.target}</p>
        <p className="mt-1 font-mono text-caption tabular-nums text-steel-600">
          {kpi.targetFigure !== null
            ? `Target ${kpi.targetFigure.toLocaleString()} ${kpi.unitOfMeasure ?? ""} · `
            : `${kpi.measurementType} · `}
          {kpi.weight}% weight
        </p>

        {/*
         * What the mid review said, on the final form.
         *
         * Read-only, and the note is not editable here: WF-26b appends the
         * final comment under a dated heading rather than overwriting,
         * because the mid note and the final note are both evidence.
         */}
        {final && (kpi.progress || kpi.midReviewNotes) ? (
          <div className="mt-3 rounded-md border border-mist-200 bg-mist-50 p-3">
            <p className="text-caption font-medium text-steel-700">
              At the mid review{kpi.progress ? `: ${kpi.progress}` : ""}
            </p>
            {kpi.midReviewNotes ? (
              <p className="measure mt-1 text-[0.8125rem] leading-5 text-steel-600">
                {kpi.midReviewNotes}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {final ? (
        <>
          {quantitative ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField
                row={kpi.taskId}
                name="actual"
                label={copy.review.actualLabel}
                required
                unit={kpi.unitOfMeasure}
                value={finalRow.actual}
                onChange={(value) => onFinal({ actual: value })}
                onBlur={() => onTouch("actual")}
                error={errorFor("actual")}
              />

              {/*
               * The score, live and read-only.
               *
               * This is the point of the whole screen: a manager who enters
               * 30 against a target of 45 sees 67% before they rate it a 4.
               */}
              <div className="self-end">
                <p className="text-caption font-medium text-ink-900">{copy.review.scoreLabel}</p>
                <p
                  className="mt-1.5 flex h-11 items-center rounded-md border border-mist-200 bg-mist-50 px-3 font-mono text-body tabular-nums text-ink-900"
                  aria-live="polite"
                >
                  {asPercent(score?.score ?? null) ?? copy.review.scorePending}
                </p>
                {score?.uncapped ? (
                  <p className="mt-1 text-[0.75rem] leading-4 text-steel-600">
                    {copy.review.scoreCapped(`${Math.round(score.uncapped * 100)}%`)}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <RatingField
            row={kpi.taskId}
            name="rating"
            label={copy.review.ratingLabel}
            help={
              quantitative
                ? undefined
                : "Qualitative KPIs are scored from this rating — 5 out of 5 is full marks."
            }
            value={finalRow.rating}
            onChange={(value) => {
              onFinal({ rating: value });
              onTouch("rating");
            }}
            error={errorFor("rating")}
          />

          <LongTextField
            row={kpi.taskId}
            name="comment"
            label={copy.review.commentLabel}
            help={copy.review.commentHelp}
            required={rating !== null && rating <= 2}
            maxLength={MAX_NOTES_LENGTH}
            rows={2}
            value={finalRow.comment}
            onChange={(value) => onFinal({ comment: value })}
            onBlur={() => onTouch("comment")}
            error={errorFor("comment")}
          />
        </>
      ) : (
        <>
          {/*
           * Mid review: progress and a note, and nothing else.
           *
           * **No ratings at a mid review.** A mid review that asks for a
           * score is a final review held early, and managers then anchor the
           * real one to it.
           */}
          <ChoiceField
            row={kpi.taskId}
            name="progress"
            label="Progress"
            required
            options={PROGRESS_VALUES}
            value={mid.progress}
            onChange={(value) => {
              onMid({ progress: value as MidRowState["progress"] });
              onTouch("progress");
            }}
          />

          <LongTextField
            row={kpi.taskId}
            name="notes"
            label={copy.review.midNotesLabel}
            help={copy.review.midNotesHelp}
            required={needsNote}
            maxLength={MAX_NOTES_LENGTH}
            rows={2}
            value={mid.notes}
            onChange={(value) => onMid({ notes: value })}
            onBlur={() => onTouch("notes")}
            error={errorFor("notes")}
          />
        </>
      )}
    </div>
  );
};

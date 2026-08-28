import * as React from "react";
import { AlertTriangle, ArrowRight, Loader2, RotateCcw, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FIELDS,
  SECTIONS,
  coversSeveralOpenings,
  emptyValues,
  fieldSpec,
  isFieldActive,
  needsAgencyName,
  needsReplacingEmployee,
  type FieldKey,
  type RequisitionValues,
  type SectionId,
} from "@/requisition/form";
import { NOT_APPLICABLE } from "@/requisition/form";
import { optionsFor, type RequisitionSchema, type SchemaOption } from "@/requisition/schema";
import { advise, unacknowledged, validate } from "@/requisition/validation";
import { fieldForPath } from "@/requisition/payload";
import type { SubmissionIssue } from "@/requisition/contract";
import { buildPayload } from "@/requisition/payload";
import {
  clearDraft,
  clearSubmissionId,
  readDraft,
  readOrCreateSubmissionId,
  relativeTime,
  writeDraft,
} from "@/requisition/draft";
import { useRequisitionSubmit } from "@/hooks/useRequisitionSubmit";
import { useEmployees, useUsers } from "@/hooks/useDirectory";
import { isPrefillEnabled, sampleValues } from "@/requisition/sample";
import {
  CheckboxField,
  ListField,
  InlineNote,
  NumberStepper,
  RadioField,
  Reveal,
  SelectField,
  TextField,
  TextareaField,
} from "./fields";
import { EmployeeField, PeopleField, PersonField, ReportsToField } from "./PeoplePicker";
import { ResponsibilityRepeater } from "./ResponsibilityRepeater";
import { focusField } from "@/requisition/review";
import { RequisitionSubmitted } from "./RequisitionStates";

/**
 * The new job requisition.
 *
 * One scrolling page, sections A to F in the job description's own order, and no
 * wizard: managers write section C and then remember something for section A,
 * and a wizard makes that a fight.
 *
 * The manager describes the role; HR sets the terms, so there is no salary,
 * benefit, leave or approver field anywhere in here.
 *
 * The fields sit on a three-column grid inside each section, in one centred
 * column of the page. One field per line put Submit a long way down a very
 * tall page; three across lets a manager see a whole section at once, which is
 * how they think about it — "identity", not "field 4 of 30". The grid collapses
 * to two columns below `lg` and to one below `sm`, and a control that owns a
 * table or a long essay still spans the full width, because a two-column table
 * squeezed into a third of the page is worse than no grid at all.
 *
 * The page previously carried a section rail on the left, a live
 * job-description preview on the right, and a "review and submit" summary at
 * the end; all three were removed by request. What the submit itself depends
 * on — advisories that have to be acknowledged, the server's objections, and
 * the list of fields still needing attention — stays, as a plain closing
 * block.
 */

const AUTOSAVE_MS = 800;
const LAST_MANAGER_KEY = "aidapt.requisition.manager.v1";

const Card = ({
  id,
  letter,
  title,
  intro,
  children,
}: {
  id: SectionId;
  letter: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) => (
  <section
    id={`section-${id}`}
    data-section={id}
    /*
     * No `overflow-hidden` here.
     *
     * It was clipping the people pickers' option lists: a combobox in section
     * B opened downward and was cut off at the card's bottom edge, showing a
     * row and a half. The only thing the clip was doing was rounding the
     * gradient header's top corners, which the header can do itself — 11px,
     * because the section's own 12px radius has a 1px border inside it.
     */
    className="scroll-mt-24 rounded-lg border border-mist-200 bg-white shadow-sm"
  >
    {/*
      The header earns a gradient, and it is the diagonal sweep rather than the
      flow gradient the page hero carries.

      The sweep is the system's panel-strength recipe — frost into white at
      135°, which over a wide short strip reads as a wash on the leading edge
      fading out to the right, so it carries the eye forward the way the
      chevron does. The richer flow gradient is a landmark, used once on a
      view; six of them under one hero would be six things competing to be the
      focal point, and the section title is not the focal point of a form.

      Grain is welded over it at a third strength: every gradient in the system
      carries film grain, and on a band this shallow full strength reads as
      noise rather than texture. The hairline moves to frost so the header's
      bottom edge belongs to the surface above it rather than cutting it off.
    */}
    <header className="surface-sweep-light has-grain rounded-t-[11px] border-b border-frost-200 px-4 py-3 [--grain-strength:0.35] sm:px-5">
      <div className="relative z-raised">
        <p className="text-overline font-semibold uppercase text-steel-600">Section {letter}</p>
        <h2 className="mt-0.5 text-h6 font-bold tracking-snug text-ink-900">{title}</h2>
        {intro ? (
          <p className="measure mt-1 text-[0.75rem] leading-4 text-steel-700">{intro}</p>
        ) : null}
      </div>
    </header>
    <div className="space-y-5 p-4 sm:p-5">{children}</div>
  </section>
);

/**
 * A row of the section grid: three fields across on a desk, two on a tablet,
 * one on a phone.
 *
 * `items-start` matters more than it looks. The fields in a row are different
 * heights — one carries a line of help, its neighbour carries an error, a
 * third is a person picker with a list under it — and stretching them to match
 * would make a select 200px tall next to a directory.
 */
const Row = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "grid grid-cols-1 items-start gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3",
      className,
    )}
  >
    {children}
  </div>
);

/** A field that owns its whole row — a table, or an essay worth the width. */
const SPAN_ALL = "sm:col-span-2 lg:col-span-3";
/** Two thirds: a long-text answer that would be cramped in one column. */
const SPAN_TWO = "lg:col-span-2";

export const RequisitionForm = ({ schema }: { schema: RequisitionSchema }) => {
  const [values, setValues] = React.useState<RequisitionValues>(emptyValues);
  const [touched, setTouched] = React.useState<Set<FieldKey>>(new Set());
  const [attempted, setAttempted] = React.useState(false);
  const [acknowledged, setAcknowledged] = React.useState<string[]>([]);
  const [restored, setRestored] = React.useState<string | null>(null);
  /** A 422's issues, held until the manager edits the field each one names. */
  const [serverIssues, setServerIssues] = React.useState<SubmissionIssue[]>([]);
  const submissionId = React.useRef(readOrCreateSubmissionId());
  const { state, submit, reset } = useRequisitionSubmit();

  // Two directories, because they answer different questions: the employee
  // register says who can raise a requisition, the user list says who can be
  // reported to or sit on a panel
  const employees = useEmployees();
  const users = useUsers();

  // ---- draft ------------------------------------------------------------
  React.useEffect(() => {
    const draft = readDraft();
    if (!draft) {
      // TODO(sso): "defaults to you" is honoured from the last manager this
      // browser used. Replace with the signed-in identity once SSO is wired.
      try {
        const last = Number(window.localStorage.getItem(LAST_MANAGER_KEY));
        if (Number.isFinite(last) && last > 0) {
          setValues((current) => ({ ...current, requestingManager: last }));
        }
      } catch {
        /* storage is optional */
      }
      return;
    }
    setValues(draft.values);
    setRestored(draft.savedAt);
  }, []);

  const isSubmitted = state.status === "succeeded";

  React.useEffect(() => {
    if (isSubmitted) return;
    const timer = window.setTimeout(
      () => writeDraft(values, String(values.requestingManager ?? "anonymous")),
      AUTOSAVE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [values, isSubmitted]);

  // ---- conditional fields ----------------------------------------------
  // Clearing the condition clears the value: orphaned data must never reach HR
  React.useEffect(() => {
    if (!needsAgencyName(values) && values.agencyName) {
      setValues((current) => ({ ...current, agencyName: "" }));
    }
    if (!needsReplacingEmployee(values) && values.replacingEmployee) {
      setValues((current) => ({ ...current, replacingEmployee: "" }));
    }
  }, [values]);

  // ---- validation -------------------------------------------------------
  const { errors, rowErrors } = React.useMemo(
    () => validate(values, schema, employees.people),
    [values, schema, employees.people],
  );
  const advisories = React.useMemo(() => advise(values), [values]);
  const standing = unacknowledged(advisories, acknowledged);

  /**
   * Errors are shown on blur, never on keystroke — telling someone their job
   * title is wrong before they have finished typing it is just noise. After a
   * failed submit, everything shows.
   */
  const visible: Partial<Record<FieldKey, string>> = React.useMemo(() => {
    const shown: Partial<Record<FieldKey, string>> = {};
    (Object.keys(errors) as FieldKey[]).forEach((key) => {
      if (attempted || touched.has(key)) shown[key] = errors[key];
    });
    // A server issue is always shown, and its message is shown verbatim — the
    // app never rewords something written for the manager to read
    serverIssues.forEach((issue) => {
      const key = fieldForPath(issue.path);
      if (key) shown[key] = issue.message;
    });
    return shown;
  }, [errors, attempted, touched, serverIssues]);

  /** Issues the server raised against something with no field of its own. */
  const looseIssues = serverIssues.filter((issue) => !fieldForPath(issue.path));

  const visibleRowErrors = attempted || touched.has("keyResponsibilitiesRows") ? rowErrors : {};

  const invalidFields = (Object.keys(errors) as FieldKey[]).filter((key) =>
    isFieldActive(key, values),
  );

  // ---- helpers ----------------------------------------------------------
  const set = <K extends FieldKey>(key: K, value: RequisitionValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    // The server's objection stops applying the moment the answer changes
    setServerIssues((current) =>
      current.length === 0 ? current : current.filter((issue) => fieldForPath(issue.path) !== key),
    );
  };

  const blur = (key: FieldKey) => setTouched((current) => new Set(current).add(key));

  /** A select commits on change, so it is touched the moment it is answered. */
  const setAndTouch = <K extends FieldKey>(key: K) => (value: RequisitionValues[K]) => {
    set(key, value);
    blur(key);
  };

  const options = (key: FieldKey): SchemaOption[] => optionsFor(schema, key);

  /**
   * Fill the form with sample content.
   *
   * Guarded — see `isPrefillEnabled`. It is not a default: the form arrives
   * empty and this is an explicit act, because the content is invented and a
   * requisition raised from it would reach HR looking like a real one.
   *
   * It waits for the directories, because the sample has to name people the
   * register actually returned: the manager and the panel are ClickUp ids, and
   * an id the directory has never heard of is not a filled field, it is a
   * broken one.
   */
  const directoriesReady = employees.people.length > 0 && users.people.length > 0;
  const canPrefill = isPrefillEnabled() && !isSubmitted;

  const prefill = React.useCallback(() => {
    setValues(sampleValues({ schema, employees: employees.people, users: users.people }));
    // Everything is answered, so every field is fair game for an error
    setTouched(new Set(FIELDS.map((field) => field.key)));
    setServerIssues([]);
  }, [schema, employees.people, users.people]);

  /**
   * `?prefill=1` fills on arrival, so a filled form can be linked to rather
   * than reached by remembering to press a button. It runs once, and only
   * once the directories have landed.
   */
  const prefilledFromUrl = React.useRef(false);
  React.useEffect(() => {
    if (prefilledFromUrl.current || !canPrefill || !directoriesReady) return;
    if (new URLSearchParams(window.location.search).get("prefill") === null) return;
    prefilledFromUrl.current = true;
    prefill();
  }, [canPrefill, directoriesReady, prefill]);

  const send = (extraAck: string[] = []) => {
    const ack = Array.from(new Set([...acknowledged, ...extraAck]));
    void submit(
      buildPayload({
        values,
        employees: employees.people,
        users: users.people,
        employeeRecords: employees.records,
        submissionId: submissionId.current,
        submittedAt: new Date().toISOString(),
        advisoriesAcknowledged: ack,
      }),
    );
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAttempted(true);

    if (invalidFields.length > 0 || Object.keys(rowErrors).length > 0) {
      const first = FIELDS.find((field) => invalidFields.includes(field.key));
      if (first) focusField(first.key);
      return;
    }
    if (standing.length > 0) {
      document.getElementById("requisition-advisories")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    send();
  };

  React.useEffect(() => {
    if (state.status !== "rejected") return;
    setServerIssues(state.issues);
    const first = state.issues.map((issue) => fieldForPath(issue.path)).find(Boolean);
    if (first) focusField(first);
  }, [state]);

  const raiseAnother = () => {
    clearDraft();
    clearSubmissionId();
    submissionId.current = readOrCreateSubmissionId();
    setValues(emptyValues());
    setTouched(new Set());
    setAttempted(false);
    setAcknowledged([]);
    setRestored(null);
    setServerIssues([]);
    reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Remember the manager for next time, in place of an SSO identity
  React.useEffect(() => {
    if (!isSubmitted || values.requestingManager === null) return;
    clearDraft();
    try {
      window.localStorage.setItem(LAST_MANAGER_KEY, String(values.requestingManager));
    } catch {
      /* storage is optional */
    }
  }, [isSubmitted, values.requestingManager]);

  if (state.status === "succeeded") {
    return (
      <RequisitionSubmitted
        jobTitle={values.jobTitle}
        receipt={state.receipt}
        onRaiseAnother={raiseAnother}
      />
    );
  }

  const busy = state.status === "submitting";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="form-dense mx-auto w-full max-w-form space-y-5"
    >
          {/*
        The fill action. Absent in production, so it cannot be the reason a
        made-up requisition reaches ClickUp.
      */}
      {canPrefill ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-mist-200 bg-mist-50 px-4 py-2">
          <p className="text-caption text-steel-600">
            Sample content is available for reviewing this form. It is not real, and this control
            does not exist in production.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={prefill}
            disabled={!directoriesReady}
            className="shrink-0"
          >
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            {directoriesReady ? "Fill with sample content" : "Loading the directory"}
          </Button>
        </div>
      ) : null}

      {/* The draft bar. Quiet, and always offering the way out. */}
          {restored ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-frost-200 bg-frost-50 px-4 py-2">
              <p className="text-caption text-steel-700">
                Draft from {relativeTime(restored)} restored
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearDraft();
                    setValues(emptyValues());
                    setTouched(new Set());
                    setRestored(null);
                  }}
                  className="press tap-44 inline-flex min-h-9 items-center gap-1.5 rounded-md px-1 text-caption font-medium text-teal-700 hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Discard it
                </button>
                <button
                  type="button"
                  onClick={() => setRestored(null)}
                  className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-steel-600 hover:bg-white/60 hover:text-ink-900"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}

          {/* ---- A · Position identity ---------------------------------- */}
          <Card id="identity" letter="A" title="Position identity">
            <Row>
              <TextField
                fieldKey="jobTitle"
                value={values.jobTitle}
                onChange={(v) => set("jobTitle", v)}
                onBlur={() => blur("jobTitle")}
                error={visible.jobTitle}
                placeholder="Depot Supervisor"
              />
              <SelectField
                fieldKey="company"
                value={values.company}
                options={options("company")}
                onChange={setAndTouch("company")}
                error={visible.company}
                placeholder="Select the employing entity"
              />
              <SelectField
                fieldKey="department"
                value={values.department}
                options={options("department")}
                onChange={setAndTouch("department")}
                error={visible.department}
              />
              <SelectField
                fieldKey="costCentre"
                value={values.costCentre}
                options={options("costCentre")}
                onChange={setAndTouch("costCentre")}
                error={visible.costCentre}
              />
              <SelectField
                fieldKey="location"
                value={values.location}
                options={options("location")}
                onChange={setAndTouch("location")}
                error={visible.location}
              />
              <SelectField
                fieldKey="positionType"
                value={values.positionType}
                options={options("positionType")}
                onChange={setAndTouch("positionType")}
                error={visible.positionType}
              />
            </Row>

            <RadioField
              fieldKey="newOrReplacement"
              value={values.newOrReplacement}
              options={options("newOrReplacement")}
              onChange={setAndTouch("newOrReplacement")}
              error={visible.newOrReplacement}
              columns={3}
            />

            <Reveal when={needsReplacingEmployee(values)}>
              {/* The picker carries a filter and a directory list, so it takes
                  two thirds rather than being squeezed into a column. */}
              <Row>
                <div className={SPAN_TWO}>
                  <EmployeeField
                    fieldKey="replacingEmployee"
                    value={values.replacingEmployee}
                    records={employees.records}
                    isLoading={employees.isLoading}
                    isUnavailable={employees.recordsUnavailable}
                    onChange={setAndTouch("replacingEmployee")}
                    error={visible.replacingEmployee}
                  />
                </div>
              </Row>
            </Reveal>

            <Row>
              <div className="space-y-2">
                <NumberStepper
                  fieldKey="totalSubPositions"
                  value={values.totalSubPositions}
                  onChange={(v) => set("totalSubPositions", v)}
                  onBlur={() => blur("totalSubPositions")}
                  error={visible.totalSubPositions}
                />
                <Reveal when={coversSeveralOpenings(values)}>
                  <InlineNote>
                    HR tracks each hire against this requisition. It closes automatically when all
                    are filled.
                  </InlineNote>
                </Reveal>
              </div>
            </Row>

            <CheckboxField
              fieldKey="recruitmentType"
              values={values.recruitmentType}
              options={options("recruitmentType")}
              onChange={setAndTouch("recruitmentType")}
              error={visible.recruitmentType}
              columns={3}
            />

            {/* Revealed by the answer above, so it has to follow it */}
            <Reveal when={needsAgencyName(values)}>
              <Row>
                <TextField
                  fieldKey="agencyName"
                  value={values.agencyName}
                  onChange={(v) => set("agencyName", v)}
                  onBlur={() => blur("agencyName")}
                  error={visible.agencyName}
                  placeholder="Which agency"
                />
              </Row>
            </Reveal>
          </Card>

          {/* ---- B · Reporting lines ------------------------------------ */}
          <Card id="reporting" letter="B" title="Reporting lines">
            <Row>
              <PersonField
                fieldKey="requestingManager"
                value={values.requestingManager}
                people={employees.people}
                isLoading={employees.isLoading}
                isUnavailable={employees.isUnavailable}
                onChange={setAndTouch("requestingManager")}
                error={visible.requestingManager}
              />
              <ReportsToField
                fieldKey="reportingTo"
                value={values.reportingTo}
                people={users.people}
                isLoading={users.isLoading}
                isUnavailable={users.isUnavailable}
                onChange={setAndTouch("reportingTo")}
                error={visible.reportingTo}
              />
              {/* There is deliberately no "others reporting directly" field —
                  that row of the Kenafric JD template is intentionally blank. */}
              <TextareaField
                fieldKey="othersReportingIndirectly"
                value={values.othersReportingIndirectly}
                onChange={(v) => set("othersReportingIndirectly", v)}
                onBlur={() => blur("othersReportingIndirectly")}
                error={visible.othersReportingIndirectly}
                rows={3}
                placeholder="Depot clerks, casual loaders"
              />
            </Row>
          </Card>

          {/* ---- C · Job description ------------------------------------ */}
          <Card
            id="jobDescription"
            letter="C"
            title="Job description"
            intro={SECTIONS.find((s) => s.id === "jobDescription")?.intro}
          >
            {/* C1 to C4 stay in the job description's own order. The
                responsibility table is two columns of its own, so it takes the
                full width rather than a third of it. */}
            <Row>
              <TextareaField
                fieldKey="jobOverview"
                value={values.jobOverview}
                onChange={(v) => set("jobOverview", v)}
                onBlur={() => blur("jobOverview")}
                error={visible.jobOverview}
                rows={4}
                className={SPAN_ALL}
              />
            </Row>
            <ResponsibilityRepeater
              rows={values.keyResponsibilitiesRows}
              onChange={(rows) => set("keyResponsibilitiesRows", rows)}
              onBlur={() => blur("keyResponsibilitiesRows")}
              error={visible.keyResponsibilitiesRows}
              rowErrors={visibleRowErrors}
            />
            {/* C3 and C4 are lists and a paragraph, not two essays. Each owns
                its whole row: a numbered list squeezed into a third of the
                width wraps every entry onto two lines, which is the shape the
                list exists to avoid. */}
            <ListField
              fieldKey="qualifications"
              values={values.qualifications}
              onChange={(v) => set("qualifications", v)}
              onBlur={() => blur("qualifications")}
              error={visible.qualifications}
              addLabel="Add another qualification"
              itemLabel="Qualification"
              placeholders={[
                "Diploma in food technology or a related technical discipline",
                "HACCP or FSSC 22000 certification",
              ]}
            />

            <TextareaField
              fieldKey="experience"
              value={values.experience}
              onChange={(v) => set("experience", v)}
              onBlur={() => blur("experience")}
              error={visible.experience}
              rows={3}
              placeholder="Five years in an FMCG manufacturing plant, at least one of them supervising a packaging or processing line"
            />

            <ListField
              fieldKey="skills"
              values={values.skills}
              onChange={(v) => set("skills", v)}
              onBlur={() => blur("skills")}
              error={visible.skills}
              addLabel="Add another skill"
              itemLabel="Skill"
              placeholders={[
                "Confectionery or high-speed packaging equipment",
                "SAP or an equivalent ERP for production entries",
                "Presence on the floor rather than in an office",
              ]}
            />
          </Card>

          {/* ---- D · Business case -------------------------------------- */}
          <Card id="businessCase" letter="D" title="Business case">
            {/* Every answer here is a paragraph, so every answer takes the
                full row. Three columns gave each of them about a third of the
                width and roughly ten words a line, and the one a manager
                writes most — D1, on what has failed before — became a tall
                narrow ribbon of text beside two much shorter neighbours.

                D3 reads last rather than third because it is the one the
                person hired actually receives; the ref on its label still says
                D3 and the payload order is unchanged. */}
            <TextareaField
              fieldKey="previousFailuresSuccesses"
              value={values.previousFailuresSuccesses}
              onChange={(v) => set("previousFailuresSuccesses", v)}
              onBlur={() => blur("previousFailuresSuccesses")}
              error={visible.previousFailuresSuccesses}
              rows={4}
            />
            <TextareaField
              fieldKey="competitiveAdvantage"
              value={values.competitiveAdvantage}
              onChange={(v) => set("competitiveAdvantage", v)}
              onBlur={() => blur("competitiveAdvantage")}
              error={visible.competitiveAdvantage}
              rows={3}
            />
            <TextareaField
              fieldKey="potentialCareerPath"
              value={values.potentialCareerPath}
              onChange={(v) => set("potentialCareerPath", v)}
              onBlur={() => blur("potentialCareerPath")}
              error={visible.potentialCareerPath}
              rows={3}
            />
            <TextareaField
              fieldKey="sixMonthsObjectives"
              value={values.sixMonthsObjectives}
              onChange={(v) => set("sixMonthsObjectives", v)}
              onBlur={() => blur("sixMonthsObjectives")}
              error={visible.sixMonthsObjectives}
              rows={4}
              emphasis
            />
          </Card>

          {/* ---- E · Provisioning --------------------------------------- */}
          <Card id="provisioning" letter="E" title="Items to be issued to the new joiner">
            {/* TODO(kenafric): the list has no motorcycle or scooter option, which
                a rider or field sales role would plausibly need. Pending the
                client's confirmation. */}
            <CheckboxField
              fieldKey="positionRequirements"
              values={values.positionRequirements}
              options={options("positionRequirements")}
              onChange={setAndTouch("positionRequirements")}
              error={visible.positionRequirements}
              exclusive={NOT_APPLICABLE}
            />
          </Card>

          {/* ---- F · Hiring process ------------------------------------- */}
          <Card id="hiringProcess" letter="F" title="Hiring process">
            <CheckboxField
              fieldKey="assessmentStagesRequired"
              values={values.assessmentStagesRequired}
              options={options("assessmentStagesRequired")}
              onChange={setAndTouch("assessmentStagesRequired")}
              error={visible.assessmentStagesRequired}
              columns={3}
              note="Background check and negotiation stages are always available regardless of what you select."
            />
            <Row>
              {/* A multi-select over the whole user list. A third of the row
                  would show four names at a time. */}
              <div className={SPAN_TWO}>
                <PeopleField
                  fieldKey="interviewPanel"
                  values={values.interviewPanel}
                  people={users.people}
                  isLoading={users.isLoading}
                  isUnavailable={users.isUnavailable}
                  onChange={setAndTouch("interviewPanel")}
                  error={visible.interviewPanel}
                />
              </div>
            </Row>
          </Card>

          {/* ---- Submit ------------------------------------------------- */}
          <div className="space-y-5 rounded-lg border border-mist-200 bg-white p-4 shadow-sm sm:p-5">
          {/* Advisories: a warning the manager can acknowledge and submit
              anyway. A rejected submission means retyping four long-text
              fields, and the next requisition arrives by email instead. */}
          {advisories.length > 0 ? (
            <div id="requisition-advisories" className="space-y-2 scroll-mt-24">
              {advisories.map((advisory) => (
                <div
                  key={advisory.id}
                  className={cn(
                    "rounded-md border px-4 py-3",
                    advisory.needsAck
                      ? "border-sand-200 bg-warmmist-50"
                      : "border-mist-200 bg-mist-50",
                  )}
                >
                  <p className="flex gap-2 text-caption text-ink-900">
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-ember-500"
                      aria-hidden="true"
                    />
                    <span>{advisory.message}</span>
                  </p>
                  {advisory.needsAck ? (
                    <label className="mt-1 flex min-h-10 cursor-pointer items-center gap-2 pl-6 text-[0.75rem] text-steel-700">
                      <input
                        type="checkbox"
                        checked={acknowledged.includes(advisory.id)}
                        onChange={(event) =>
                          setAcknowledged((current) =>
                            event.target.checked
                              ? [...current, advisory.id]
                              : current.filter((id) => id !== advisory.id),
                          )
                        }
                        className="h-[1.125rem] w-[1.125rem] shrink-0 rounded-sm border-mist-300 accent-teal-400"
                      />
                      I've checked this and it's right
                    </label>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {/* Issues the server raised that no single field owns */}
          {looseIssues.length > 0 ? (
            <div
              role="alert"
              className="rounded-md border-l-2 border-ember-300 bg-ember-50 px-4 py-3"
            >
              <p className="text-caption font-medium text-ink-900">
                The requisition was not accepted
              </p>
              <ul className="mt-1 space-y-1">
                {looseIssues.map((issue) => (
                  <li key={`${issue.path}-${issue.code}`} className="text-caption text-steel-700">
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {state.status === "failed" ? (
            <div
              role="alert"
              className="rounded-md border-l-2 border-ember-300 bg-ember-50 px-4 py-3 text-caption text-ink-900"
            >
              <p>{state.message}</p>
              {/* A retry reuses the same submissionId, so it cannot raise a
                  second requisition. Where retrying cannot help, it is not
                  offered — a missing ClickUp field needs HR, not another go. */}
              {state.retryable ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => send()}
                >
                  Try again
                </Button>
              ) : null}
            </div>
          ) : null}

          {/* The summary. Never a bare disabled button with no explanation. */}
          <div
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            role="status"
            aria-live="polite"
          >
            <div className="min-w-0 text-caption">
              {attempted && invalidFields.length > 0 ? (
                <div className="space-y-1">
                  <p className="font-medium text-ember-500">
                    {invalidFields.length} field{invalidFields.length === 1 ? "" : "s"} need
                    {invalidFields.length === 1 ? "s" : ""} attention
                  </p>
                  <ul className="flex flex-wrap gap-x-3 gap-y-1">
                    {invalidFields.map((key) => (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => focusField(key)}
                          className="press tap-44 inline-flex min-h-8 items-center text-caption font-medium text-teal-700 hover:underline"
                        >
                          {fieldSpec(key).label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : standing.length > 0 && attempted ? (
                <p className="text-steel-700">
                  Confirm the {standing.length === 1 ? "warning" : "warnings"} above, then submit.
                </p>
              ) : (
                <p className="text-steel-600">
                  HR reviews this, then the HR Head, then the Director.
                </p>
              )}
            </div>

            {/* The one Ember CTA on the page — Fire is the spark */}
            <Button type="submit" variant="cta" size="lg" disabled={busy} className="w-full sm:w-auto">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Submitting
                </>
              ) : (
                <>
                  Submit requisition
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
          </div>
    </form>
  );
};

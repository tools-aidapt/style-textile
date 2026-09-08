import * as React from "react";
import { AlertTriangle, ArrowRight, CloudOff, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LIMITS, type DocumentManifestEntry } from "@/onboarding/contract";
import { documentSpec, documentTileId, type DocumentKey } from "@/onboarding/documents";
import {
  FIELDS,
  HELB_OPTIONS,
  SECTIONS,
  emptyValues,
  focusField,
  focusSection,
  type FieldKey,
  type OnboardingValues,
  type SectionId,
} from "@/onboarding/form";
import { PRIVACY_NOTICE_URL, copy, formatJoiningDate } from "@/onboarding/locale";
import type { PhotoCheck } from "@/onboarding/media/photo";
import { buildPayload } from "@/onboarding/payload";
import { photoAlreadyReceived, visibleDocuments, type OnboardingSession } from "@/onboarding/session";
import { entryFor, formatSize, isProvided, totalBytes } from "@/onboarding/uploads";
import { advise, splitMobile, unacknowledged, validate } from "@/onboarding/validation";
import { DIAL_CODES } from "@/onboarding/dialCodes";
import {
  clearEverything,
  readDraft,
  readOrCreateSubmissionId,
  relativeTime,
  scopeOf,
  writeDraft,
} from "@/onboarding/draft";
import { useOnboardingSubmit } from "@/hooks/useOnboardingSubmit";
import { useOnboardingUploads } from "@/hooks/useOnboardingUploads";
import { DocumentTile } from "./DocumentTile";
import { PassportPhoto } from "./PassportPhoto";
import { ProgressRail, type SectionProgress, type SectionState } from "./ProgressRail";
import { OnboardingSubmitted } from "./OnboardingStates";
import { PhoneField, RadioField, TextField, TextareaField } from "./fields";

/**
 * The employee onboarding form.
 *
 * One scrolling page, cheapest questions first, uploads last. Each document
 * goes up the moment it is ready, so the final submit is small metadata — and
 * so a closed tab costs nothing.
 *
 * Errors show on blur, never on keystroke. After a failed submit, everything
 * shows and the first problem takes the focus.
 */

const AUTOSAVE_MS = 800;

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
    className="scroll-mt-32 rounded-lg border border-mist-200 bg-white shadow-sm"
  >
    <header className="surface-sweep-light has-grain rounded-t-[11px] border-b border-frost-200 px-4 py-3 [--grain-strength:0.35] sm:px-5">
      <div className="relative z-raised">
        {letter ? (
          <p className="text-overline font-semibold uppercase text-steel-600">Section {letter}</p>
        ) : null}
        <h2 className="mt-0.5 text-h6 font-bold tracking-snug text-ink-900">{title}</h2>
        {intro ? (
          <p className="measure mt-1 text-[0.8125rem] leading-5 text-steel-700">{intro}</p>
        ) : null}
      </div>
    </header>
    <div className="space-y-5 p-4 sm:p-5">{children}</div>
  </section>
);

/** A4 — the trust anchor. It proves the link is theirs, not a phishing attempt. */
const ConfirmPanel = ({ session }: { session: OnboardingSession }) => {
  const rows = [
    { label: "Position", value: session.positionTitle },
    { label: "Company", value: session.company },
    { label: "You start on", value: formatJoiningDate(session.joiningDate) },
  ].filter((row) => !!row.value);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-md border border-frost-200 bg-frost-50/60 p-3.5">
      <p className="text-overline font-semibold uppercase text-steel-600">
        {copy.confirmHeading}
      </p>
      <dl className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap items-baseline gap-x-2">
            <dt className="text-caption text-steel-600">{row.label}</dt>
            <dd className="text-body-sm font-medium text-ink-900">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-caption text-steel-600">{copy.confirmFooter}</p>
    </div>
  );
};

const ReviewRow = ({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) => (
  <div className="flex items-baseline justify-between gap-3 py-2">
    <div className="min-w-0">
      <p className="text-caption text-steel-600">{label}</p>
      <p className="whitespace-pre-wrap break-words text-body-sm text-ink-900">
        {value || <span className="text-steel-400">Not answered</span>}
      </p>
    </div>
    <button
      type="button"
      onClick={onEdit}
      className="press tap-44 inline-flex min-h-9 shrink-0 items-center gap-1 text-caption font-medium text-teal-700 hover:underline print:hidden"
    >
      <Pencil className="h-3 w-3" aria-hidden="true" />
      Edit
    </button>
  </div>
);

export const OnboardingForm = ({
  employeeId,
  session,
}: {
  /** The ClickUp Employee task id the URL carried. */
  employeeId: string;
  session: OnboardingSession;
}) => {
  const [values, setValues] = React.useState<OnboardingValues>(emptyValues);
  const [touched, setTouched] = React.useState<Set<FieldKey>>(new Set());
  const [attempted, setAttempted] = React.useState(false);
  const [acknowledged, setAcknowledged] = React.useState<string[]>([]);
  const [restoredAt, setRestoredAt] = React.useState<string | null>(null);
  const [photoChecks, setPhotoChecks] = React.useState<PhotoCheck[]>([]);

  const submissionId = React.useRef(readOrCreateSubmissionId(employeeId));
  const { state, submit } = useOnboardingSubmit();

  const uploads = useOnboardingUploads({
    submissionId: submissionId.current,
    session,
    fullName: values.fullName,
  });

  // ---- draft, and the details we already know --------------------------
  React.useEffect(() => {
    const draft = readDraft(employeeId);
    if (draft) {
      setValues(draft.values);
      setAcknowledged(draft.acknowledged);
      setRestoredAt(draft.savedAt);
      return;
    }
    // Pre-filled and EDITABLE: the candidate record holds the name as it was
    // typed on an application form, and the employee file should hold the name
    // as it appears on their ID
    // A number on file arrives in E.164 and has to be taken apart again, so
    // the country lands in the select rather than in the digits box
    const onFile = session.mobile ? splitMobile(session.mobile, DIAL_CODES) : null;
    setValues((current) => ({
      ...current,
      fullName: session.fullName || current.fullName,
      personalEmail: session.personalEmail || current.personalEmail,
      mobile: onFile?.national ?? current.mobile,
      mobileCountry: onFile?.country ?? current.mobileCountry,
    }));
  }, [session, employeeId]);

  const isSubmitted = state.status === "succeeded";

  React.useEffect(() => {
    if (isSubmitted) return;
    const timer = window.setTimeout(
      () =>
        writeDraft({
          scope: scopeOf(employeeId),
          submissionId: submissionId.current,
          values,
          acknowledged,
        }),
      AUTOSAVE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [values, acknowledged, isSubmitted, employeeId]);

  // Nothing of this person stays on the device once it is filed
  React.useEffect(() => {
    if (isSubmitted) void clearEverything(employeeId);
  }, [isSubmitted, employeeId]);

  // ---- what this employee owes ----------------------------------------
  const requirements = React.useMemo(() => visibleDocuments(session, values), [session, values]);
  const photoSatisfied = photoAlreadyReceived(session);

  /** One input, read by both tiers of the rules. */
  const input = React.useMemo(
    () => ({ values, session, requirements, entries: uploads.entries, photoChecks }),
    [values, session, requirements, uploads.entries, photoChecks],
  );

  const { errors, blocking } = React.useMemo(() => validate(input), [input]);
  const advisories = React.useMemo(() => advise(input), [input]);
  const standing = unacknowledged(advisories, acknowledged);

  /** On blur, never on keystroke. After a failed submit, everything. */
  const visible: Partial<Record<FieldKey, string>> = React.useMemo(() => {
    const shown: Partial<Record<FieldKey, string>> = {};
    (Object.keys(errors) as FieldKey[]).forEach((key) => {
      if (attempted || touched.has(key)) shown[key] = errors[key];
    });
    return shown;
  }, [errors, attempted, touched]);

  const set = <K extends keyof OnboardingValues>(key: K, value: OnboardingValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const blur = (key: FieldKey) => setTouched((current) => new Set(current).add(key));

  const setNote = (key: DocumentKey, note: string) =>
    setValues((current) => ({
      ...current,
      documentNotes: { ...current.documentNotes, [key]: note.slice(0, LIMITS.note) },
    }));

  const acknowledgeCodes = React.useCallback((codes: string[]) => {
    setAcknowledged((current) => Array.from(new Set([...current, ...codes])));
  }, []);

  // ---- the rail --------------------------------------------------------
  const progress: SectionProgress[] = React.useMemo(() => {
    const filled = (keys: FieldKey[]): SectionState => {
      const answered = keys.filter((key) => String(values[key] ?? "").trim().length > 0).length;
      if (answered === 0) return "empty";
      return answered === keys.length && keys.every((key) => !errors[key]) ? "done" : "partial";
    };

    const owed = requirements.filter((requirement) => requirement.required && !requirement.satisfied);
    const owedDone = owed.filter((requirement) =>
      isProvided(entryFor(uploads.entries, requirement.spec.key)),
    ).length;

    const anyDocument = requirements.some(
      (requirement) => entryFor(uploads.entries, requirement.spec.key).phase !== "empty",
    );

    const photoEntry = entryFor(uploads.entries, "passport-photo");

    return [
      { id: "details", state: filled(["fullName", "personalEmail", "mobile"]) },
      { id: "address", state: filled(["address"]) },
      {
        id: "bank",
        state: filled(["bankNameBranch", "accountName", "accountNumber", "helbLoanStatus"]),
      },
      {
        id: "documents",
        state:
          owed.length > 0 && owedDone === owed.length ? "done" : anyDocument ? "partial" : "empty",
      },
      {
        id: "photo",
        state:
          photoSatisfied || isProvided(photoEntry)
            ? "done"
            : photoEntry.phase === "empty"
              ? "empty"
              : "partial",
      },
      { id: "review", state: values.consent ? "done" : "empty" },
    ];
  }, [errors, photoSatisfied, requirements, uploads.entries, values]);

  // ---- submit ----------------------------------------------------------
  const send = () => {
    // Read in the same tick as the click: the prepared bytes live in a ref
    // precisely so this cannot race a render
    const files = uploads.preparedFiles();
    void submit(
      buildPayload({
        values,
        session,
        requirements,
        entries: uploads.entries,
        submissionId: submissionId.current,
        submittedAt: new Date().toISOString(),
        advisoriesAcknowledged: Array.from(
          new Set(
            advisories
              .filter((advisory) => !advisory.needsAck || acknowledged.includes(advisory.id))
              .map((advisory) => advisory.code),
          ),
        ),
      }),
      files,
    );
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAttempted(true);

    const invalid = (Object.keys(errors) as FieldKey[])[0];
    if (invalid) {
      focusField(invalid);
      return;
    }
    if (blocking.length > 0) {
      const first = blocking.find((issue) => issue.documents?.length);
      if (first?.documents?.[0]) {
        document
          .getElementById(documentTileId(first.documents[0]))
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        document.getElementById("onboarding-submit")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }
    if (standing.length > 0) {
      document
        .getElementById("onboarding-advisories")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    send();
  };

  if (state.status === "succeeded") {
    const received: DocumentManifestEntry[] = [
      ...requirements.map((requirement) => requirement.spec.key),
      "passport-photo" as DocumentKey,
    ]
      .map((key) => entryFor(uploads.entries, key))
      .filter((entry) => isProvided(entry) && entry.output)
      .map((entry, index) => ({
        documentKey: entry.key,
        clickupFieldName: entry.output!.clickupFieldName,
        field: `file${index}`,
        filename: entry.output!.filename,
        bytes: entry.output!.bytes,
        originalBytes: entry.output!.originalBytes,
        sourceCount: entry.output!.sourceCount,
        note: null,
        status: "attached" as const,
      }));

    return (
      <OnboardingSubmitted
        personalEmail={values.personalEmail}
        joiningDate={session.joiningDate}
        documents={received}
      />
    );
  }

  const busy = state.status === "submitting";
  const photoEntry = entryFor(uploads.entries, "passport-photo");

  return (
    <div className="lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-8">
      <ProgressRail progress={progress} />

      <form onSubmit={onSubmit} noValidate className="form-dense min-w-0 space-y-5">
        {restoredAt ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-frost-200 bg-frost-50 px-4 py-2.5 print:hidden">
            <p className="text-caption text-steel-700">{copy.restore(relativeTime(restoredAt))}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-steel-600"
              onClick={() => {
                if (!window.confirm(copy.discardConfirm)) return;
                setValues(emptyValues());
                setAcknowledged([]);
                setTouched(new Set());
                setRestoredAt(null);
              }}
            >
              {copy.discard}
            </Button>
          </div>
        ) : null}

        {uploads.isRestoring ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-md border border-mist-200 bg-mist-50 px-4 py-2.5 text-caption text-steel-700 print:hidden"
          >
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-teal-400" aria-hidden="true" />
            {copy.restoring}
          </p>
        ) : null}

        {/* One calm banner, never a modal. Nothing is mid-flight to interrupt. */}
        {uploads.offline ? (
          <div
            role="status"
            className="flex gap-2 rounded-md border border-sand-200 bg-warmmist-50 px-4 py-2.5 text-caption text-ink-900 print:hidden"
          >
            <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-steel-600" aria-hidden="true" />
            <span>{copy.offline}</span>
          </div>
        ) : null}

        {/* ---- A · Your details ---------------------------------------- */}
        <Card id="details" letter="A" title="Your details">
          <TextField
            fieldKey="fullName"
            value={values.fullName}
            onChange={(value) => set("fullName", value)}
            onBlur={() => blur("fullName")}
            error={visible.fullName}
            autoComplete="name"
          />
          <TextField
            fieldKey="personalEmail"
            type="email"
            inputMode="email"
            value={values.personalEmail}
            onChange={(value) => set("personalEmail", value)}
            onBlur={() => blur("personalEmail")}
            error={visible.personalEmail}
            autoComplete="email"
          />
          <PhoneField
            fieldKey="mobile"
            value={values.mobile}
            country={values.mobileCountry}
            onChange={(value) => set("mobile", value)}
            onCountryChange={(country) => {
              set("mobileCountry", country);
              // The number is re-checked against the new country's rule, so a
              // Kenyan number left behind by a country change shows its error
              // rather than passing silently
              blur("mobile");
            }}
            onBlur={() => blur("mobile")}
            error={visible.mobile}
          />
          <ConfirmPanel session={session} />
        </Card>

        {/* ---- B · Where you live -------------------------------------- */}
        <Card id="address" letter="B" title="Where you live">
          <TextareaField
            fieldKey="address"
            value={values.address}
            onChange={(value) => set("address", value)}
            onBlur={() => blur("address")}
            error={visible.address}
            rows={4}
          />
        </Card>

        {/* ---- C · Bank and statutory ---------------------------------- */}
        <Card id="bank" letter="C" title="Bank and statutory" intro={copy.bankIntro}>
          <TextField
            fieldKey="bankNameBranch"
            value={values.bankNameBranch}
            onChange={(value) => set("bankNameBranch", value)}
            onBlur={() => blur("bankNameBranch")}
            error={visible.bankNameBranch}
            autoComplete="off"
          />
          <TextField
            fieldKey="accountName"
            value={values.accountName}
            onChange={(value) => set("accountName", value)}
            onBlur={() => blur("accountName")}
            error={visible.accountName}
            autoComplete="off"
          />
          {/* The number is masked after blur, showing the last four; the name
              is not, because a name is not the thing worth hiding from the
              person sitting next to you on a matatu. */}
          <TextField
            fieldKey="accountNumber"
            value={values.accountNumber}
            onChange={(value) => set("accountNumber", value)}
            onBlur={() => blur("accountNumber")}
            error={visible.accountNumber}
            mask
          />
          <RadioField
            fieldKey="helbLoanStatus"
            value={values.helbLoanStatus}
            options={HELB_OPTIONS}
            onChange={(value) => {
              set("helbLoanStatus", value);
              blur("helbLoanStatus");
            }}
            error={visible.helbLoanStatus}
          />
        </Card>

        {/* ---- D · Your documents -------------------------------------- */}
        <Card
          id="documents"
          letter="D"
          title="Your documents"
          intro={SECTIONS.find((section) => section.id === "documents")?.intro}
        >
          <ul className="space-y-3">
            {requirements.map((requirement) => (
              <DocumentTile
                key={requirement.spec.key}
                requirement={requirement}
                entry={entryFor(uploads.entries, requirement.spec.key)}
                note={values.documentNotes[requirement.spec.key] ?? ""}
                onNote={(note) => setNote(requirement.spec.key, note)}
                onAdd={(files) => uploads.addFiles(requirement.spec.key, files)}
                onRemoveSource={(sourceId) =>
                  uploads.removeSource(requirement.spec.key, sourceId)
                }
                onMoveSource={(sourceId, direction) =>
                  uploads.reorderSource(requirement.spec.key, sourceId, direction)
                }
                onClear={() => uploads.clear(requirement.spec.key)}
                onRetry={() => uploads.retry(requirement.spec.key)}
              />
            ))}
          </ul>
        </Card>

        {/* ---- E · Passport photo -------------------------------------- */}
        <Card id="photo" letter="E" title="Passport photo">
          <PassportPhoto
            entry={photoEntry}
            satisfied={photoSatisfied}
            onPrepared={(blob, originalBytes) =>
              uploads.putPrepared("passport-photo", blob, { originalBytes, extension: "jpg" })
            }
            onClear={() => uploads.clear("passport-photo")}
            onChecks={setPhotoChecks}
            onAcknowledge={acknowledgeCodes}
          />
        </Card>

        {/* ---- Check and submit ---------------------------------------- */}
        <Card id="review" letter="" title="Check and submit">
          <div className="divide-y divide-mist-100">
            {FIELDS.filter((field) => field.key !== "consent").map((field) => (
              <ReviewRow
                key={field.key}
                label={field.label}
                value={String(values[field.key] ?? "")}
                onEdit={() => focusField(field.key)}
              />
            ))}
          </div>

          <div>
            <p className="text-overline font-semibold uppercase text-steel-600">Documents</p>
            <ul className="mt-1 divide-y divide-mist-100">
              {[...requirements.map((item) => item.spec.key), "passport-photo" as DocumentKey].map(
                (key) => {
                  const entry = entryFor(uploads.entries, key);
                  const requirement = requirements.find((item) => item.spec.key === key);
                  const state = requirement?.satisfied
                    ? "Already on file"
                    : entry.phase === "ready"
                      ? "Ready to send"
                      : entry.phase === "preparing"
                        ? "Preparing"
                        : entry.phase === "rejected"
                          ? "Not accepted"
                          : "Not added";
                  return (
                    <li key={key} className="flex items-baseline justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className="text-body-sm text-ink-900">{documentSpec(key).label}</p>
                        {entry.output ? (
                          <p className="break-all font-mono text-caption text-steel-600">
                            {entry.output.filename}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          key === "passport-photo"
                            ? focusSection("photo")
                            : document
                                .getElementById(documentTileId(key))
                                ?.scrollIntoView({ behavior: "smooth", block: "center" })
                        }
                        className="press shrink-0 text-caption font-medium text-teal-700 hover:underline print:hidden"
                      >
                        {state}
                      </button>
                    </li>
                  );
                },
              )}
            </ul>
          </div>

          {/* ---- advisories ------------------------------------------- */}
          {advisories.length > 0 ? (
            <div id="onboarding-advisories" className="space-y-2 scroll-mt-32">
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
                    <label className="mt-1 flex min-h-11 cursor-pointer items-center gap-2 pl-6 text-[0.8125rem] text-steel-700">
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
                      I've checked this and I want to carry on
                    </label>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {/* ---- consent --------------------------------------------- */}
          <div
            id={`${"onboarding-consent"}-field`}
            className="scroll-mt-32 rounded-md border border-mist-200 bg-mist-50/60 p-3.5"
          >
            <label className="flex cursor-pointer gap-3 text-body-sm text-ink-900">
              {/* Never pre-ticked, and never implied by submitting */}
              <input
                id="onboarding-consent"
                type="checkbox"
                checked={values.consent}
                onChange={(event) => {
                  set("consent", event.target.checked);
                  set("consentAt", event.target.checked ? new Date().toISOString() : null);
                  blur("consent");
                }}
                aria-invalid={visible.consent ? true : undefined}
                aria-describedby={visible.consent ? "onboarding-consent-error" : undefined}
                className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 rounded-sm border-mist-300 accent-teal-400"
              />
              <span>{copy.consent}</span>
            </label>
            <p className="mt-2 pl-8 text-caption">
              <a
                href={PRIVACY_NOTICE_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="font-medium text-teal-700 underline underline-offset-4"
              >
                {copy.privacyLink}
              </a>
            </p>
            {visible.consent ? (
              <p
                id="onboarding-consent-error"
                className="mt-2 pl-8 text-[0.8125rem] font-medium text-ember-500"
              >
                {visible.consent}
              </p>
            ) : null}
          </div>

          {/* ---- server objections and failures ---------------------- */}
          {state.status === "rejected" ? (
            <div
              role="alert"
              className="rounded-md border-l-2 border-ember-300 bg-ember-50 px-4 py-3"
            >
              <p className="text-caption font-medium text-ink-900">This wasn't accepted</p>
              <ul className="mt-1 space-y-1">
                {state.issues.map((issue) => (
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
              <p className="font-medium">{copy.failureHeading}</p>
              <p className="mt-1">{state.message}</p>
              {state.retryable ? (
                <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={send}>
                  Try again
                </Button>
              ) : null}
            </div>
          ) : null}

          {/* ---- the button, never bare and disabled ------------------ */}
          <div
            id="onboarding-submit"
            className="flex flex-col gap-4 scroll-mt-32 sm:flex-row sm:items-center sm:justify-between"
            role="status"
            aria-live="polite"
          >
            <div className="min-w-0 text-caption">
              {attempted && blocking.length > 0 ? (
                <div className="space-y-1">
                  <p className="font-medium text-ember-500">{blocking[0].message}</p>
                  {blocking[0].documents?.length ? (
                    <ul className="flex flex-wrap gap-x-3 gap-y-1">
                      {blocking[0].documents.map((key) => (
                        <li key={key}>
                          <button
                            type="button"
                            onClick={() =>
                              document
                                .getElementById(documentTileId(key))
                                ?.scrollIntoView({ behavior: "smooth", block: "center" })
                            }
                            className="press tap-44 inline-flex min-h-8 items-center font-medium text-teal-700 hover:underline"
                          >
                            {documentSpec(key).label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : attempted && Object.keys(errors).length > 0 ? (
                <p className="font-medium text-ember-500">
                  {Object.keys(errors).length} answer
                  {Object.keys(errors).length === 1 ? "" : "s"} need attention
                </p>
              ) : attempted && standing.length > 0 ? (
                <p className="text-steel-700">
                  Confirm the {standing.length === 1 ? "warning" : "warnings"} above, then submit.
                </p>
              ) : (
                <p className="text-steel-600">
                  HR checks your documents after you submit. They'll email you if anything needs
                  redoing.
                </p>
              )}
            </div>

            {/* The one Ember CTA on the page */}
            <Button
              type="submit"
              variant="cta"
              size="lg"
              disabled={busy}
              className="w-full sm:w-auto"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {copy.submitting}
                </>
              ) : (
                <>
                  {copy.submit}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>

          {/*
            The only upload on the page, and it can run for minutes on mobile
            data. A spinner alone gets the page reloaded halfway through, so
            this is a real figure with the total beside it — and it says out
            loud not to close the tab.
          */}
          {state.status === "submitting" ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-caption font-medium text-ink-900">
                  {state.progress >= 0.99
                    ? copy.sendingSettling
                    : copy.sendingProgress(
                        Math.round(state.progress * 100),
                        formatSize(totalBytes(uploads.entries)),
                      )}
                </p>
                <p className="text-caption text-steel-600">{copy.sendingWarning}</p>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-mist-100"
                role="progressbar"
                aria-label="Sending your documents"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(state.progress * 100)}
              >
                <div
                  className="h-full rounded-full bg-teal-400 transition-[width] duration-base ease-out"
                  style={{ width: `${Math.max(2, Math.round(state.progress * 100))}%` }}
                />
              </div>
            </div>
          ) : null}
        </Card>
      </form>
    </div>
  );
};

import { AlertTriangle, Check, Clock, Printer, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { documentSpec } from "@/onboarding/documents";
import { copy, formatJoiningDate } from "@/onboarding/locale";
import type { DocumentManifestEntry } from "@/onboarding/contract";
import { formatSize } from "@/onboarding/uploads";
import type { SessionFault } from "@/onboarding/session";

/** What the page can be instead of, before, and after the form. */

const Shell = ({
  tone = "plain",
  children,
}: {
  tone?: "plain" | "sweep";
  children: React.ReactNode;
}) => (
  <div
    className={
      tone === "sweep"
        ? "surface-sweep-light overflow-hidden rounded-lg border border-frost-200"
        : "overflow-hidden rounded-lg border border-mist-200 bg-white shadow-sm"
    }
  >
    <div className="relative z-10 p-6 sm:p-8">{children}</div>
  </div>
);

export const OnboardingLoading = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading your onboarding form">
    <div className="rounded-lg border border-mist-200 bg-white p-6 shadow-sm">
      <div className="h-5 w-48 rounded-sm bg-mist-100" />
      <div className="mt-3 h-4 w-64 rounded-sm bg-mist-50" />
    </div>
    {[0, 1].map((index) => (
      <div key={index} className="rounded-lg border border-mist-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-32 rounded-sm bg-mist-100" />
        <div className="mt-5 space-y-3">
          <div className="h-11 rounded-md bg-mist-50" />
          <div className="h-11 rounded-md bg-mist-50" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * The dead end.
 *
 * Renders this and NOTHING else — no form, no field list, no name. An id that
 * does not belong to somebody currently onboarding gets nothing back at all,
 * which is the app's half of the bargain in `session.ts`: the id in the URL is
 * a name rather than a secret, so the screen behind it must give nothing away.
 */
export const OnboardingDeadEnd = ({
  fault,
  onRetry,
}: {
  fault: SessionFault;
  onRetry: () => void;
}) => {
  const content: Record<SessionFault, { heading: string; body: string; retry: boolean }> = {
    unknown: { heading: copy.unknownHeading, body: copy.unknownBody, retry: false },
    "no-id": { heading: copy.noIdHeading, body: copy.noIdBody, retry: false },
    unreachable: { heading: copy.unreachableHeading, body: copy.unreachableBody, retry: true },
    unconfigured: {
      heading: copy.unreachableHeading,
      // A deployment fault, said plainly rather than blamed on the employee
      body: "This form isn't finished being set up. Nothing you do here will help — please tell HR.",
      retry: false,
    },
  };
  const shown = content[fault];

  return (
    <Shell>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mist-50">
        {fault === "unknown" ? (
          <Clock className="h-6 w-6 text-steel-600" aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-steel-600" aria-hidden="true" />
        )}
      </div>
      <h1 className="mt-6 text-h4 font-bold tracking-snug text-ink-900">{shown.heading}</h1>
      <p className="measure mt-3 text-body text-steel-600">{shown.body}</p>
      {shown.retry ? (
        <div className="mt-8">
          <Button type="button" variant="secondary" onClick={onRetry}>
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : null}
    </Shell>
  );
};

/**
 * Submitted.
 *
 * This person is about to start a job and is quietly anxious about all of it,
 * so the screen says what happens next, when they start, and who will email
 * them if something needs redoing. No ClickUp link: they have no account, and
 * a link they cannot open reads as a broken system.
 */
export const OnboardingSubmitted = ({
  personalEmail,
  joiningDate,
  documents,
}: {
  personalEmail: string;
  joiningDate: string | null;
  documents: DocumentManifestEntry[];
}) => {
  const joining = formatJoiningDate(joiningDate);

  return (
    <Shell tone="sweep">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
        <Check className="h-6 w-6 text-teal-400" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-h3 font-bold tracking-snug text-ink-900" role="status">
        {copy.successHeading}
      </h1>
      <p className="measure mt-3 text-body text-steel-700">{copy.successBody(personalEmail)}</p>
      <p className="measure mt-2 text-body text-steel-700">
        {joining ? copy.successStart(joining) : copy.successStartUnknown}
      </p>

      <div className="mt-8">
        <p className="text-overline font-semibold uppercase text-steel-600">
          {copy.successReceived}
        </p>
        <ul className="mt-2 divide-y divide-mist-100">
          {documents.map((document) => (
            <li
              key={document.documentKey}
              className="flex items-baseline justify-between gap-4 py-2"
            >
              <span className="min-w-0 text-body-sm text-ink-900">
                {documentSpec(document.documentKey).label}
              </span>
              <span className="shrink-0 font-mono text-caption tabular-nums text-steel-600">
                {formatSize(document.bytes)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* The summary, not the files. Re-downloading thirteen documents from a
          page anyone with the link can open is not a feature. */}
      <div className="mt-8 print:hidden">
        <Button type="button" variant="ghost" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          {copy.successPrint}
        </Button>
      </div>
    </Shell>
  );
};

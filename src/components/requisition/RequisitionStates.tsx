import { AlertTriangle, ArrowRight, Check, ExternalLink, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FIELDS } from "@/requisition/form";
import type { SchemaFault } from "@/requisition/schema";
import type { SubmissionSuccess } from "@/requisition/contract";

/** The states the form can be in before, instead of, and after the form itself. */

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
    <div className="relative z-10 p-6 sm:p-10">{children}</div>
  </div>
);

/** Field keys read better as the label the manager would recognise. */
const humanKey = (key: string): string =>
  FIELDS.find((field) => field.key === key)?.label ?? key;

export const RequisitionLoading = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading the requisition form">
    <div className="h-32 rounded-lg border border-mist-200 bg-white p-6 shadow-sm">
      <div className="h-5 w-56 rounded-sm bg-mist-100" />
      <div className="mt-3 h-4 w-80 rounded-sm bg-mist-50" />
    </div>
    {[0, 1, 2].map((i) => (
      <div key={i} className="h-56 rounded-lg border border-mist-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-40 rounded-sm bg-mist-100" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-11 rounded-md bg-mist-50" />
          <div className="h-11 rounded-md bg-mist-50" />
          <div className="h-11 rounded-md bg-mist-50" />
          <div className="h-11 rounded-md bg-mist-50" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * The schema is short a field.
 *
 * Nine of the fields this form writes to are still being built in the ClickUp
 * workspace. Rendering a smaller form would drop whatever a manager typed into
 * the missing one without telling anybody, so the form refuses to open and
 * names exactly what HR still has to create.
 */
export const SchemaFaultNotice = ({
  fault,
  onRetry,
}: {
  fault: SchemaFault;
  onRetry: () => void;
}) => (
  <Shell>
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ember-50">
      <AlertTriangle className="h-6 w-6 text-ember-500" aria-hidden="true" />
    </div>
    <h2 className="mt-6 text-h4 font-bold tracking-snug text-ink-900">
      The requisition form can't open yet
    </h2>
    <p className="measure mt-3 text-body text-steel-600">
      The ClickUp workspace is missing fields this form writes to. Submitting now would drop those
      answers silently, so the form stays closed until they exist. Send this list to whoever is
      building the Positions list.
    </p>

    {fault.missing.length > 0 ? (
      <div className="mt-6">
        <p className="text-overline font-semibold uppercase text-steel-600">Fields not found</p>
        <ul className="mt-2 space-y-1">
          {fault.missing.map((key) => (
            <li key={key} className="text-body-sm text-ink-900">
              <span className="font-mono text-caption text-steel-500">{key}</span> — {humanKey(key)}
            </li>
          ))}
        </ul>
      </div>
    ) : null}

    {fault.optionless.length > 0 ? (
      <div className="mt-6">
        <p className="text-overline font-semibold uppercase text-steel-600">Fields with no options</p>
        <ul className="mt-2 space-y-1">
          {fault.optionless.map((key) => (
            <li key={key} className="text-body-sm text-ink-900">
              <span className="font-mono text-caption text-steel-500">{key}</span> — {humanKey(key)}
            </li>
          ))}
        </ul>
      </div>
    ) : null}

    <div className="mt-8">
      <Button type="button" variant="secondary" onClick={onRetry}>
        <RotateCw className="h-4 w-4" aria-hidden="true" />
        Check again
      </Button>
    </div>
  </Shell>
);

/** The schema endpoint itself is unreachable or was never configured. */
export const SchemaUnavailable = ({
  isUnconfigured,
  onRetry,
}: {
  isUnconfigured: boolean;
  onRetry: () => void;
}) => (
  <Shell>
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mist-50">
      <AlertTriangle className="h-6 w-6 text-steel-600" aria-hidden="true" />
    </div>
    <h2 className="mt-6 text-h4 font-bold tracking-snug text-ink-900">
      {isUnconfigured ? "This form isn't connected yet" : "We can't reach the workspace"}
    </h2>
    <p className="measure mt-3 text-body text-steel-600">
      {isUnconfigured
        ? "VITE_REQUISITION_SCHEMA_URL is not set, so the form has no option lists to draw. That is a deployment fault rather than something you can fix from here."
        : "The service that serves the company, department and location lists didn't answer. Your draft is safe. Try again in a moment."}
    </p>
    {isUnconfigured ? null : (
      <div className="mt-8">
        <Button type="button" variant="secondary" onClick={onRetry}>
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      </div>
    )}
  </Shell>
);

/**
 * Submitted. The manager's next question is always "what happens now", so the
 * three approval steps are named rather than implied.
 */
export const RequisitionSubmitted = ({
  jobTitle,
  receipt,
  onRaiseAnother,
}: {
  jobTitle: string;
  receipt: SubmissionSuccess;
  onRaiseAnother: () => void;
}) => (
  <Shell tone="sweep">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
      <Check className="h-6 w-6 text-teal-400" aria-hidden="true" />
    </div>
    <h2 className="mt-6 text-h3 font-bold tracking-snug text-ink-900">Requisition submitted</h2>
    <p className="measure mt-3 text-body text-steel-700">
      <span className="font-medium text-ink-900">{jobTitle}</span> is with HR.
      {receipt.duplicate ? " We already had this one, so nothing was raised twice." : ""}
    </p>

    <ol className="measure mt-8 space-y-3">
      {[
        "HR reviews it and adds the terms — salary, benefits and leave.",
        "The HR Head approves.",
        "The Director approves, and the role goes live.",
      ].map((step, index) => (
        <li key={step} className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-circle bg-white font-mono text-caption font-medium text-teal-700 ring-1 ring-teal-100">
            {index + 1}
          </span>
          <span className="text-body-sm text-ink-900">{step}</span>
        </li>
      ))}
    </ol>

    {/* A-6 and anything like it arrive alongside the 201: the requisition is
        filed, and the manager is told what HR will also see. */}
    {receipt.advisories?.length ? (
      <ul className="mt-8 space-y-2">
        {receipt.advisories.map((advisory) => (
          <li
            key={advisory.code}
            className="flex gap-2 rounded-md border border-sand-200 bg-warmmist-50 px-4 py-3 text-body-sm text-ink-900"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" aria-hidden="true" />
            <span>
              {advisory.message}{" "}
              {advisory.taskUrl ? (
                <a
                  className="font-medium text-teal-700 underline underline-offset-4"
                  href={advisory.taskUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  See the requisition
                </a>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    ) : null}

    {receipt.reference || receipt.taskId ? (
      <p className="mt-8 text-caption text-steel-600">
        Reference{" "}
        <span className="font-mono font-medium text-ink-900">
          {receipt.reference ?? receipt.taskId}
        </span>
      </p>
    ) : null}

    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      {receipt.taskUrl ? (
        <Button asChild variant="secondary">
          <a href={receipt.taskUrl} target="_blank" rel="noreferrer">
            Open it in ClickUp
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
      ) : null}
      <Button type="button" variant="ghost" onClick={onRaiseAnother}>
        Raise another requisition
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  </Shell>
);

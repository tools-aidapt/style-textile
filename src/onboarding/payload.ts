/**
 * Building the final submit.
 *
 * Small, because the documents are already on the server — this call is the
 * metadata plus a manifest of what was sent. It is the last thing that
 * happens, and it is the thing that makes n8n create the Onboarding
 * Submissions task at status `new`.
 *
 * Labels, not option UUIDs. `null` for an empty optional, never `""`.
 */

import {
  CLIENT_APP,
  APP_VERSION,
  CONSENT_VERSION,
  LIMITS,
  SCHEMA_VERSION,
  type DocumentManifestEntry,
  type NotProvidedEntry,
  type NotProvidedReason,
  type OnboardingSubmission,
} from "./contract";
import type { DocumentKey } from "./documents";
import { needsHelbDocument, type OnboardingValues } from "./form";
import type { DocumentRequirement, OnboardingSession } from "./session";
import {
  entryFor,
  formatSize,
  isProvided,
  type DocumentEntries,
  type DocumentEntry,
} from "./uploads";
import { normaliseMobile } from "./validation";
import { dialFor } from "./dialCodes";

export interface PayloadInput {
  values: OnboardingValues;
  session: OnboardingSession;
  requirements: DocumentRequirement[];
  entries: DocumentEntries;
  submissionId: string;
  submittedAt: string;
  advisoriesAcknowledged: string[];
}

const trimmed = (value: string): string => value.trim();

const noteFor = (values: OnboardingValues, key: DocumentKey): string | null => {
  const note = (values.documentNotes[key] ?? "").trim();
  return note ? note.slice(0, LIMITS.note) : null;
};

const manifestEntry = (
  entry: DocumentEntry,
  values: OnboardingValues,
  field: string,
): DocumentManifestEntry | null => {
  if (!isProvided(entry) || !entry.output) return null;
  return {
    documentKey: entry.key,
    // The pairing key, carried through from the spec. Never re-derived here,
    // and never parsed back out of the filename.
    clickupFieldName: entry.output.clickupFieldName,
    // Which multipart part holds the bytes
    field,
    filename: entry.output.filename,
    bytes: entry.output.bytes,
    originalBytes: entry.output.originalBytes,
    sourceCount: entry.output.sourceCount,
    note: noteFor(values, entry.key),
    status: "attached",
  };
};

/**
 * Why a document is missing.
 *
 * HR reads this list, so it says something. "skipped" and "too-large" lead to
 * different conversations, and a document refused at 6.8 MB is a conversation
 * about email rather than about chasing the employee again.
 */
const reasonFor = (entry: DocumentEntry, requirement: DocumentRequirement): NotProvidedReason => {
  if (entry.error?.code === "still-too-large") return "too-large";
  if (requirement.spec.key === "payslips") return "first-job";
  if (!requirement.required) return requirement.spec.tier === "conditional" ? "not-applicable" : "skipped";
  return "skipped";
};

export const buildPayload = ({
  values,
  session,
  requirements,
  entries,
  submissionId,
  submittedAt,
  advisoriesAcknowledged,
}: PayloadInput): OnboardingSubmission => {
  const keys: DocumentKey[] = [
    ...requirements.map((requirement) => requirement.spec.key),
    "passport-photo",
  ];

  // Numbered in this order, which is the order the request's parts are added
  // in — see `preparedFiles` in useOnboardingUploads
  const documents: DocumentManifestEntry[] = [];
  keys.forEach((key) => {
    const entry = manifestEntry(entryFor(entries, key), values, `file${documents.length}`);
    if (entry) documents.push(entry);
  });

  const notProvided: NotProvidedEntry[] = requirements.flatMap((requirement) => {
    const entry = entryFor(entries, requirement.spec.key);
    if (isProvided(entry) || requirement.satisfied) return [];

    // The HELB document is not "missing" when the employee has no loan — it
    // was never owed, and filing it as a gap sends HR chasing it
    if (requirement.spec.key === "helb-status" && !needsHelbDocument(values)) {
      return [{ documentKey: requirement.spec.key, reason: "not-applicable" as const }];
    }

    const reason = reasonFor(entry, requirement);
    const note =
      reason === "too-large" && entry.error?.bytes
        ? `${formatSize(entry.error.bytes)} after compressing`
        : noteFor(values, requirement.spec.key) ?? undefined;

    return [{ documentKey: requirement.spec.key, reason, ...(note ? { note } : {}) }];
  });

  const personalEmail = trimmed(values.personalEmail);

  return {
    schemaVersion: SCHEMA_VERSION,
    submissionId,
    submittedAt,
    client: { app: CLIENT_APP, appVersion: APP_VERSION },
    // Echoed from the session, which is the only place the app learns it
    employee: { clickupTaskId: session.clickupTaskId },
    personal: {
      fullName: trimmed(values.fullName),
      personalEmail,
      personalEmailChanged:
        !!session.personalEmail &&
        session.personalEmail.trim().toLowerCase() !== personalEmail.toLowerCase(),
      // The two fields become one E.164 string, so ClickUp holds one shape of
      // number whatever the employee typed into the box
      mobile:
        normaliseMobile(values.mobile, dialFor(values.mobileCountry)) ??
        `${dialFor(values.mobileCountry)}${trimmed(values.mobile)}`,
      address: trimmed(values.address),
    },
    bank: {
      // Three answers on the wire. n8n concatenates them into the single
      // `Bank Account Details` text field the workspace has — asking for them
      // in one box produced "equity 0110…" and a phone call.
      bankNameBranch: trimmed(values.bankNameBranch),
      accountName: trimmed(values.accountName),
      // Whitespace out: people group the digits, and a payroll file cannot
      accountNumber: values.accountNumber.replace(/\s+/g, ""),
      helbLoanStatus: values.helbLoanStatus,
    },
    documents,
    notProvided,
    advisoriesAcknowledged: Array.from(new Set(advisoriesAcknowledged)),
    consent: {
      given: true,
      at: values.consentAt ?? submittedAt,
      version: CONSENT_VERSION,
    },
  };
};

import type { OnboardingSession } from "@/onboarding/session";
import type { DocumentKey } from "@/onboarding/documents";
import { documentSpec } from "@/onboarding/documents";
import { emptyEntry, type DocumentEntries, type DocumentEntry } from "@/onboarding/uploads";
import { emptyValues, type OnboardingValues } from "@/onboarding/form";

/** A session in the shape n8n serves, with everything overridable. */
export const testSession = (
  overrides: Partial<OnboardingSession> = {},
): OnboardingSession => ({
  clickupTaskId: "869evrmhx",
  fullName: "Stephen Gachoka Wahito",
  personalEmail: "stephen.wahito@gmail.com",
  mobile: "",
  joiningDate: "2026-10-01",
  positionTitle: "Production Supervisor",
  company: "Kenafric Industries",
  requiredDocuments: [],
  optionalDocuments: [],
  alreadyReceived: [],
  expiresAt: "2026-09-29T00:00:00.000Z",
  ...overrides,
});

/** Answers that pass every blocking rule, so a test can break one at a time. */
export const testValues = (overrides: Partial<OnboardingValues> = {}): OnboardingValues => ({
  ...emptyValues(),
  fullName: "Stephen Gachoka Wahito",
  personalEmail: "stephen.wahito@gmail.com",
  // The national part only; the country is a separate answer
  mobile: "0712 345 678",
  mobileCountry: "KE",
  address: "House 14, Kiambu Road, Runda, Nairobi",
  bankNameBranch: "Equity Bank, Thika Road branch",
  accountName: "Stephen G Wahito",
  accountNumber: "0110123456789",
  helbLoanStatus: "Cleared Loan",
  consent: true,
  consentAt: "2026-09-08T09:14:18.000Z",
  ...overrides,
});

/** A prepared document, as the compression step would have left it. */
export const uploaded = (
  key: DocumentKey,
  overrides: Partial<DocumentEntry> = {},
): DocumentEntry => ({
  ...emptyEntry(key),
  phase: "ready",
  output: {
    clickupFieldName: documentSpec(key).clickupFieldName,
    filename: `869evrmhx_${key}_wahito-stephen_20260908.pdf`,
    bytes: 1_204_551,
    originalBytes: 8_812_345,
    sourceCount: 1,
    pageCount: 1,
  },
  ...overrides,
});

export const entriesFor = (keys: DocumentKey[]): DocumentEntries =>
  keys.reduce<DocumentEntries>((entries, key) => ({ ...entries, [key]: uploaded(key) }), {});

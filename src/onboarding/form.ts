/**
 * The onboarding form's shape, in one place.
 *
 * Labels and help text live here rather than in the components because four
 * things need them and must agree: the field itself, the progress rail, the
 * check-and-submit block, and the submit-time error summary.
 *
 * Section order is cheapest-first. The uploads are the part that takes twenty
 * minutes and a hunt through a drawer, so they come last, after the employee
 * has already spent five minutes and is far less likely to walk away.
 *
 * Every string an employee reads is either here or in `locale.ts`. Swahili is
 * out of scope for v1 (§15.7), and that only stays true if translating it
 * never means reading the components.
 */

import type { DocumentKey } from "./documents";

export type SectionId = "details" | "address" | "bank" | "documents" | "photo" | "review";

export interface SectionSpec {
  id: SectionId;
  /** The letter, so HR and the employee can refer to a section on the phone. */
  letter: string;
  title: string;
  intro?: string;
  /** The rail's own wording, which has less room than the heading. */
  railLabel: string;
}

export const SECTIONS: SectionSpec[] = [
  { id: "details", letter: "A", title: "Your details", railLabel: "Your details" },
  { id: "address", letter: "B", title: "Where you live", railLabel: "Address" },
  {
    id: "bank",
    letter: "C",
    title: "Bank and statutory",
    railLabel: "Bank",
    intro:
      "Kenafric uses these to pay you and to register you correctly. They are visible only to HR.",
  },
  {
    id: "documents",
    letter: "D",
    title: "Your documents",
    railLabel: "Documents",
    intro:
      "Photos of the documents are fine — they don't need to be scans. Each one uploads as soon as you add it, so you can close this and come back.",
  },
  { id: "photo", letter: "E", title: "Passport photo", railLabel: "Photo" },
  { id: "review", letter: "", title: "Check and submit", railLabel: "Check and submit" },
];

export type FieldKey =
  | "fullName"
  | "personalEmail"
  | "mobile"
  | "address"
  | "bankNameBranch"
  | "accountName"
  | "accountNumber"
  | "helbLoanStatus"
  | "consent";

export interface FieldSpec {
  key: FieldKey;
  section: SectionId;
  /** The reference the brief and HR use — A1, C3. Shown beside the label. */
  ref: string;
  label: string;
  help?: string;
  required: boolean;
}

export const FIELDS: FieldSpec[] = [
  {
    key: "fullName",
    section: "details",
    ref: "A1",
    label: "Full name",
    help: "Exactly as it appears on your National ID",
    required: true,
  },
  {
    key: "personalEmail",
    section: "details",
    ref: "A2",
    label: "Personal email",
    help: "We'll use this until your Kenafric email is ready",
    required: true,
  },
  {
    key: "mobile",
    section: "details",
    ref: "A3",
    label: "Mobile number",
    // The country is chosen, so the example no longer needs to carry it
    help: "Without the leading zero, e.g. 712 345 678",
    required: true,
  },
  {
    key: "address",
    section: "address",
    ref: "B1",
    label: "Home address",
    help: "Estate or building, road, area, town. Enough for a courier to find you",
    required: true,
  },
  {
    key: "bankNameBranch",
    section: "bank",
    ref: "C1",
    label: "Bank name and branch",
    help: "e.g. Equity Bank, Thika Road branch",
    required: true,
  },
  {
    key: "accountName",
    section: "bank",
    ref: "C2",
    label: "Account name",
    help: "The name the account is held in. It must match the name on your ID",
    required: true,
  },
  {
    key: "accountNumber",
    section: "bank",
    ref: "C3",
    label: "Account number",
    help: "Just the account number, no spaces",
    required: true,
  },
  {
    key: "helbLoanStatus",
    section: "bank",
    ref: "C4",
    label: "HELB loan status",
    required: true,
  },
  {
    key: "consent",
    section: "review",
    ref: "",
    label:
      "I confirm these documents are mine and I agree to Kenafric holding them for employment and statutory purposes.",
    required: true,
  },
];

const BY_KEY = new Map(FIELDS.map((field) => [field.key, field]));

export const fieldSpec = (key: FieldKey): FieldSpec => {
  const spec = BY_KEY.get(key);
  if (!spec) throw new Error(`Unknown onboarding field: ${key}`);
  return spec;
};

/** The control's DOM id. The wrapper is `${id}-field`, which is what scrolls. */
export const fieldId = (key: FieldKey): string => `onboarding-${key}`;

/** C3, verbatim and in this order. n8n resolves the label, not an index. */
export const HELB_OPTIONS = ["Pending Clearance", "Cleared Loan", "No Loan"] as const;
export type HelbLoanStatus = (typeof HELB_OPTIONS)[number];

/** The one answer that changes what Section D asks for. */
export const NO_HELB_LOAN = "No Loan";

/** Kenya leads, because that is where the hiring is. */
export const DEFAULT_DIAL_COUNTRY = "KE";

export interface OnboardingValues {
  fullName: string;
  personalEmail: string;
  /**
   * The national part only, as typed. The country is `mobileCountry`, and the
   * two are composed into one E.164 string at submit — see payload.ts.
   *
   * Asked as two questions because one box produces "0712345678" from somebody
   * in Kampala and "+254 0712" from somebody being careful, and neither is a
   * number anyone can ring.
   */
  mobile: string;
  /** ISO 3166-1 alpha-2, matching a row of DIAL_CODES. */
  mobileCountry: string;
  address: string;
  bankNameBranch: string;
  /**
   * Asked separately from the number, because one box produced
   * "Stephen Wahito 0110123456789" and HR could not tell where the name ended
   * and the account began — which is the one thing that field exists to say.
   */
  accountName: string;
  accountNumber: string;
  helbLoanStatus: string;
  consent: boolean;
  /** When the box was ticked, for the consent record. Cleared when unticked. */
  consentAt: string | null;
  /** Optional per-document free text, 200 chars, keyed by document. */
  documentNotes: Partial<Record<DocumentKey, string>>;
}

export const emptyValues = (): OnboardingValues => ({
  fullName: "",
  personalEmail: "",
  mobile: "",
  mobileCountry: DEFAULT_DIAL_COUNTRY,
  address: "",
  bankNameBranch: "",
  accountName: "",
  accountNumber: "",
  helbLoanStatus: "",
  consent: false,
  consentAt: null,
  documentNotes: {},
});

/**
 * Whether the HELB status document is owed.
 *
 * "No Loan" makes it optional and shows a note saying why. Any other answer —
 * including no answer yet — leaves it required, because the default has to be
 * the one that does not quietly let a required document through.
 */
export const needsHelbDocument = (values: OnboardingValues): boolean =>
  values.helbLoanStatus !== NO_HELB_LOAN;

/** Scrolls a field into view and puts the caret in it. */
export const focusField = (key: FieldKey): void => {
  const wrapper = document.getElementById(`${fieldId(key)}-field`);
  wrapper?.scrollIntoView({ behavior: "smooth", block: "center" });
  const control = document.getElementById(fieldId(key));
  // A smooth scroll and a focus fight each other, so let the scroll start first
  window.setTimeout(() => control?.focus({ preventScroll: true }), 220);
};

/** Scrolls a section heading into view — the rail and the Edit links both do this. */
export const focusSection = (id: SectionId): void => {
  document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

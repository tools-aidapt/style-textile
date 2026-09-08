/**
 * Two tiers.
 *
 * **Blocking** stops the submit. **Advisory** warns, and lets the employee
 * submit once they have explicitly acknowledged it — because the alternative
 * is a nineteen-year-old with no payslips, no HELB loan and a slightly soft
 * photo who cannot start their job, at 22:00, with nobody to ring.
 *
 * The acknowledged codes travel in the payload, so HR sees exactly which
 * warnings the employee waved through.
 */

import { LIMITS } from "./contract";
import { documentSpec, type DocumentKey } from "./documents";
import { NO_HELB_LOAN, needsHelbDocument, type FieldKey, type OnboardingValues } from "./form";
import { dialFor } from "./dialCodes";
import type { DocumentRequirement, OnboardingSession } from "./session";
import {
  entryFor,
  formatSize,
  isBusy,
  isProvided,
  totalBytes,
  type DocumentEntries,
} from "./uploads";
import { advisoryFailures, blockingFailures, type PhotoCheck } from "./media/photo";

export type FieldErrors = Partial<Record<FieldKey, string>>;

/** An objection no single field owns. Carries what to jump to. */
export interface FormIssue {
  code: string;
  message: string;
  documents?: DocumentKey[];
}

export interface ValidationResult {
  errors: FieldErrors;
  blocking: FormIssue[];
}

export interface Advisory {
  /** Unique per warning shown, so two A-1s have two checkboxes. */
  id: string;
  /** What goes in `advisoriesAcknowledged`. Shared by warnings of a kind. */
  code: string;
  message: string;
  needsAck: boolean;
}

export interface ValidationInput {
  values: OnboardingValues;
  session: OnboardingSession;
  /** What this employee sees, and owes — served, not guessed. See session.ts. */
  requirements: DocumentRequirement[];
  entries: DocumentEntries;
  /** Empty until a photo has been analysed. */
  photoChecks: PhotoCheck[];
}

const REQUIRED = "Required";

const blank = (value: string | null | undefined) => !String(value ?? "").trim();

/**
 * Deliberately loose. The job of an email check in a form is to catch a typo
 * and a missing @, not to re-implement RFC 5322 and reject somebody's real
 * address on the day they start work.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isEmail = (value: string): boolean => EMAIL.test(value.trim());

export const KENYA_DIAL = "+254";

/**
 * A mobile number, normalised to E.164.
 *
 * `input` is the national part as typed and `dial` the chosen country code.
 * Anything the employee put in for punctuation is thrown away, along with a
 * leading zero and a re-typed country code — people write their own number as
 * `0712 345 678` or `+254 712 345 678` regardless of what the field asked for,
 * and refusing that is pedantry rather than validation.
 *
 * Kenyan numbers are checked properly: nine digits after the code, starting 7
 * (Safaricom, Airtel) or 1 (the newer range). Everywhere else gets a length
 * check only — this app has no business deciding what a valid Ugandan mobile
 * looks like, and getting that wrong would block somebody's first day.
 */
export const normaliseMobile = (input: string, dial: string = KENYA_DIAL): string | null => {
  const code = dial.startsWith("+") ? dial : `+${dial}`;
  const codeDigits = code.slice(1);

  const national = input
    .replace(/[^\d+]/g, "")
    .replace(/^\+/, "")
    // A re-typed country code, then a trunk zero. In that order: +254 0712 is
    // a real thing people write.
    .replace(new RegExp(`^${codeDigits}`), "")
    .replace(/^0+/, "");

  if (code === KENYA_DIAL) {
    return /^[71]\d{8}$/.test(national) ? `${code}${national}` : null;
  }
  return /^\d{6,14}$/.test(national) ? `${code}${national}` : null;
};

/** Splits an E.164 number the session already holds back into the two fields. */
export const splitMobile = (
  e164: string,
  dials: { country: string; dial: string }[],
): { country: string; national: string } | null => {
  const trimmed = e164.replace(/[^\d+]/g, "");
  if (!trimmed.startsWith("+")) return null;

  // Longest code first, so +25 never wins over +254
  const match = [...dials]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((candidate) => trimmed.startsWith(candidate.dial));
  if (!match) return null;

  return { country: match.country, national: trimmed.slice(match.dial.length) };
};

/** Two words, so "Stephen" alone does not become the name on a bank mandate. */
const looksLikeFullName = (value: string): boolean =>
  value.trim().split(/\s+/).filter(Boolean).length >= 2;

export const validate = ({
  values,
  session,
  requirements,
  entries,
  photoChecks,
}: ValidationInput): ValidationResult => {
  const errors: FieldErrors = {};
  const blocking: FormIssue[] = [];

  // ---- B-1 · every required field carries a value ----------------------
  const required: FieldKey[] = [
    "fullName",
    "personalEmail",
    "mobile",
    "address",
    "bankNameBranch",
    "accountName",
    "accountNumber",
  ];
  required.forEach((key) => {
    if (blank(values[key] as string)) errors[key] = REQUIRED;
  });

  // ---- B-2 · the name on the ID ---------------------------------------
  if (!errors.fullName) {
    const name = values.fullName.trim();
    if (
      name.length < LIMITS.fullName.min ||
      name.length > LIMITS.fullName.max ||
      !looksLikeFullName(name)
    ) {
      errors.fullName = "Enter your full name as it appears on your ID.";
    }
  }

  // ---- B-3 · the email ------------------------------------------------
  if (!errors.personalEmail && !isEmail(values.personalEmail)) {
    errors.personalEmail = "Check this email address.";
  }

  // ---- B-4 · the mobile number ----------------------------------------
  if (!errors.mobile && !normaliseMobile(values.mobile, dialFor(values.mobileCountry))) {
    errors.mobile =
      dialFor(values.mobileCountry) === KENYA_DIAL
        ? "Enter a Kenyan mobile number, e.g. 0712 345 678."
        : "Check this number — digits only, without the country code.";
  }

  // ---- B-6 · HELB answered --------------------------------------------
  if (blank(values.helbLoanStatus)) errors.helbLoanStatus = "Choose one.";

  // ---- B-9 · consent ---------------------------------------------------
  if (!values.consent) errors.consent = "Tick the box to continue.";

  // ---- B-5 · every required document ----------------------------------
  const outstanding = requirements
    .filter((requirement) => requirement.required && !requirement.satisfied)
    .filter((requirement) => !isProvided(entryFor(entries, requirement.spec.key)))
    // B-7 says its own thing about the HELB document, so it is not also
    // counted here — one problem, one message
    .filter((requirement) => requirement.spec.key !== "helb-status");

  if (outstanding.length > 0) {
    blocking.push({
      code: "B-5",
      message: `${outstanding.length} document${outstanding.length === 1 ? "" : "s"} still needed`,
      documents: outstanding.map((requirement) => requirement.spec.key),
    });
  }

  // ---- B-7 · the HELB document, if there is a loan ---------------------
  const helbRequirement = requirements.find((item) => item.spec.key === "helb-status");
  if (
    helbRequirement &&
    !helbRequirement.satisfied &&
    needsHelbDocument(values) &&
    !blank(values.helbLoanStatus) &&
    !isProvided(entryFor(entries, "helb-status"))
  ) {
    blocking.push({
      code: "B-7",
      message: "Add your HELB status document, or change your answer above.",
      documents: ["helb-status"],
    });
  }

  // ---- B-8 · the photo passes P-1 and P-2 ------------------------------
  const photoEntry = entryFor(entries, "passport-photo");
  // WF-14 can pre-fill the photo the same way it pre-fills the offer letter.
  // Asking for one Kenafric already holds is the same failure as asking for a
  // document it already holds.
  const photoOnFile = session.alreadyReceived.includes("passport-photo");
  if (!photoOnFile && !isProvided(photoEntry)) {
    blocking.push({
      code: "B-8",
      message: "Add your passport photo",
      documents: ["passport-photo"],
    });
  }
  blockingFailures(photoChecks).forEach((check) => {
    blocking.push({ code: check.code, message: check.message, documents: ["passport-photo"] });
  });

  // ---- B-10 · nothing still being prepared -----------------------------
  const all = requirements.map((requirement) => entryFor(entries, requirement.spec.key));
  all.push(photoEntry);

  const busy = all.filter(isBusy);
  if (busy.length > 0) {
    blocking.push({
      code: "B-10",
      message:
        busy.length === 1
          ? "One document is still being prepared"
          : `${busy.length} documents are still being prepared`,
      documents: busy.map((entry) => entry.key),
    });
  }

  // ---- B-11 · it all has to fit in one request -------------------------
  //
  // Everything goes up together, and the webhook has a body limit. Checked
  // here so the employee is told BEFORE a four-minute upload is refused at the
  // end of it — and told which documents are the heavy ones, because "make it
  // smaller" with no target is not an instruction anybody can follow.
  const weight = totalBytes(entries);
  if (weight > LIMITS.totalBytes) {
    const heaviest = all
      .filter((entry) => isProvided(entry) && entry.output)
      .sort((a, b) => (b.output?.bytes ?? 0) - (a.output?.bytes ?? 0))
      .slice(0, 3);

    blocking.push({
      code: "B-11",
      message: `Your documents come to ${formatSize(weight)}, and ${formatSize(
        LIMITS.totalBytes,
      )} is the most that can be sent at once. Remove the largest one and send it to HR by email.`,
      documents: heaviest.map((entry) => entry.key),
    });
  }

  return { errors, blocking };
};

/** The optional documents, in the words the employee will recognise. */
const emptyOptionalMessage = (key: DocumentKey): string => {
  if (key === "payslips") {
    return "You haven't added your payslips. That's fine if this is your first job.";
  }
  if (key === "separation-letters") {
    return "You haven't added any separation or service letters. That's fine if you don't have them.";
  }
  return `You haven't added your ${documentSpec(key).label.toLowerCase()}. That's fine if it doesn't apply to you.`;
};

export const advise = ({
  values,
  session,
  requirements,
  entries,
  photoChecks,
}: ValidationInput): Advisory[] => {
  const advisories: Advisory[] = [];

  // ---- A-1 · an optional document left empty ---------------------------
  requirements
    .filter((requirement) => !requirement.required && !requirement.satisfied)
    .filter((requirement) => entryFor(entries, requirement.spec.key).phase === "empty")
    .forEach((requirement) => {
      advisories.push({
        id: `A-1:${requirement.spec.key}`,
        code: "A-1",
        message: emptyOptionalMessage(requirement.spec.key),
        // Not worth a tick box: leaving an optional document out is a normal
        // thing to do, and a checkbox on every one of them is friction with
        // no reader
        needsAck: false,
      });
    });

  // ---- A-2 · the photo's advisory checks -------------------------------
  advisoryFailures(photoChecks).forEach((check) => {
    advisories.push({
      id: check.code,
      code: check.code,
      message: check.message,
      needsAck: true,
    });
  });

  // ---- A-5 · the account is not in this person's name ------------------
  //
  // Deliberately loose. Banks hold "S G WAHITO" where the ID says "Stephen
  // Gachoka Wahito", and a strict comparison would fire on almost everybody —
  // which teaches people to click through warnings, including the ones that
  // matter. So this only speaks up when the surname is absent altogether,
  // which is the case worth catching: paying into somebody else's account.
  const surname = values.fullName.trim().split(/\s+/).filter(Boolean).pop() ?? "";
  const accountName = values.accountName.trim().toLowerCase();
  if (surname.length >= 3 && accountName && !accountName.includes(surname.toLowerCase())) {
    advisories.push({
      id: "A-5",
      code: "A-5",
      message:
        "The account name doesn't include your surname. Salary can only be paid into an account in your own name — check this is right.",
      needsAck: true,
    });
  }

  // ---- A-3 · a different name from the one on file ---------------------
  const onFile = session.fullName.trim().toLowerCase();
  const given = values.fullName.trim().toLowerCase();
  if (onFile && given && onFile !== given) {
    advisories.push({
      id: "A-3",
      code: "A-3",
      message:
        "This is different from the name we have on file — that's fine if the one on your ID is different, but HR will check.",
      needsAck: true,
    });
  }

  // ---- A-4 · a suspiciously small file ---------------------------------
  const tiny = [...requirements.map((item) => item.spec.key), "passport-photo" as DocumentKey]
    .map((key) => entryFor(entries, key))
    .filter((entry) => isProvided(entry) && entry.output && entry.output.bytes < LIMITS.smallFileBytes);

  tiny.forEach((entry) => {
    advisories.push({
      id: `A-4:${entry.key}`,
      code: "A-4",
      message: `${documentSpec(entry.key).label} is a very small file and may be hard to read.`,
      needsAck: true,
    });
  });

  // The pipeline's own advisory about a low-resolution photo rides along, so
  // "this looks small" is raised once, wherever it was noticed
  requirements
    .map((item) => entryFor(entries, item.spec.key))
    .forEach((entry) => {
      entry.advisories.forEach((advisory) => {
        advisories.push({
          id: `A-4:${entry.key}:${advisory.code}`,
          code: "A-4",
          message: `${documentSpec(entry.key).label} — ${advisory.message}`,
          needsAck: false,
        });
      });
    });

  return advisories;
};

export const unacknowledged = (advisories: Advisory[], acknowledged: string[]): Advisory[] =>
  advisories.filter((advisory) => advisory.needsAck && !acknowledged.includes(advisory.id));

/** True when the HELB answer means the document is not owed. */
export const helbDocumentWaived = (values: OnboardingValues): boolean =>
  values.helbLoanStatus === NO_HELB_LOAN;

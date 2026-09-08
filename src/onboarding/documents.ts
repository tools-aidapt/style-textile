/**
 * The thirteen documents, and the contract that pairs each one to ClickUp.
 *
 * `clickupFieldName` is the contract. WF-15 Trigger B pairs each string to the
 * identically-named document subtask on the Employee record and flips it
 * `Requested → Received`. A rename on either side breaks that pairing
 * SILENTLY — no error, no unpaired file, just a subtask that stays Requested
 * while the document sits on the submission. So these strings are copied from
 * the field-id register, never retyped:
 *
 *   `NHIF/SHA` keeps the slash.
 *   `Driver's Licence` keeps the apostrophe and the British -ce.
 *   `Last 3 Payslips` keeps the numeral.
 *
 * `src/test/fixtures/onboarding-document-fields.json` holds the same strings
 * and `documents.test.ts` asserts they are byte-identical, so a well-meant
 * spelling correction fails a test rather than a workflow.
 *
 * No ClickUp field UUID appears here or anywhere else in this bundle. n8n
 * resolves each name against the live schema — see docs/onboarding-field-ids.md,
 * which is documentation for whoever builds the workflow, not an import.
 */

export type DocumentKey =
  | "national-id"
  | "kra-pin"
  | "nssf"
  | "nhif-sha"
  | "helb-status"
  | "education-certs"
  | "good-conduct"
  | "public-health-cert"
  | "payslips"
  | "signed-offer-letter"
  | "separation-letters"
  | "drivers-licence"
  | "passport-photo";

/**
 * Which of the two requirement questions a document answers.
 *
 * `required` — everyone owes it.
 * `optional` — nobody owes it; an empty one is an advisory, not an error.
 * `conditional` — the session endpoint decides, per employee, from the
 *   position's requirements. Hidden entirely when it does not apply: showing a
 *   food-handling certificate to an accountant and leaving them to work out
 *   that it is not for them is how a form generates a support call.
 */
export type DocumentTier = "required" | "optional" | "conditional";

export interface DocumentSpec {
  key: DocumentKey;
  /** The pairing key. Sent with every upload. Never derived from the filename. */
  clickupFieldName: string;
  /** What the employee reads. Free to change; `clickupFieldName` is not. */
  label: string;
  /** The one-line note under the label. */
  note?: string;
  tier: DocumentTier;
  /**
   * How many source files this document accepts. Above one, the files are
   * merged into a single PDF — see `media/merge.ts`.
   */
  maxFiles: number;
  /** Reads out in the tile as "PDF or photo", and sets the picker's `accept`. */
  accepts: "image-and-pdf";
  /**
   * The first two slots of the national ID are Front and Back, so the page
   * order of the merged PDF is obvious rather than whatever order the phone
   * handed the files over in.
   */
  slotLabels?: string[];
}

/** Section D, in the order the employee meets them. */
export const DOCUMENTS: DocumentSpec[] = [
  {
    key: "national-id",
    clickupFieldName: "National ID",
    label: "National ID (both sides)",
    note: "Front and back. Add both — they'll be combined into one file",
    tier: "required",
    maxFiles: 8,
    accepts: "image-and-pdf",
    slotLabels: ["Front", "Back"],
  },
  {
    key: "kra-pin",
    clickupFieldName: "KRA PIN",
    label: "KRA PIN certificate",
    note: "The PDF from iTax is fine",
    tier: "required",
    maxFiles: 1,
    accepts: "image-and-pdf",
  },
  {
    key: "nssf",
    clickupFieldName: "NSSF",
    label: "NSSF card or number",
    tier: "required",
    maxFiles: 1,
    accepts: "image-and-pdf",
  },
  {
    key: "nhif-sha",
    clickupFieldName: "NHIF/SHA",
    label: "NHIF / SHA card",
    tier: "required",
    maxFiles: 1,
    accepts: "image-and-pdf",
  },
  {
    /**
     * The only document whose requiredness the employee controls, from C3.
     * It is never hidden: "I have no HELB loan" is an answer worth showing the
     * consequence of, not a reason to remove the row.
     */
    key: "helb-status",
    clickupFieldName: "HELB Status Document",
    label: "HELB status document",
    note: "Only if you have or had a HELB loan",
    tier: "required",
    maxFiles: 1,
    accepts: "image-and-pdf",
  },
  {
    key: "education-certs",
    clickupFieldName: "Educational Certificates",
    label: "Educational certificates",
    note: "Add as many as you have. Highest qualification first",
    tier: "required",
    maxFiles: 8,
    accepts: "image-and-pdf",
  },
  {
    key: "good-conduct",
    clickupFieldName: "Certificate of Good Conduct",
    label: "Certificate of Good Conduct",
    note: "The DCI certificate. If yours is still being processed, note it below",
    tier: "required",
    maxFiles: 1,
    accepts: "image-and-pdf",
  },
  {
    key: "public-health-cert",
    clickupFieldName: "Public Health Certificate",
    label: "Public Health Certificate",
    note: "Food-handling roles only",
    tier: "conditional",
    maxFiles: 1,
    accepts: "image-and-pdf",
  },
  {
    key: "payslips",
    clickupFieldName: "Last 3 Payslips",
    label: "Last 3 payslips",
    note: "From your previous employer. Skip if this is your first job",
    tier: "optional",
    maxFiles: 8,
    accepts: "image-and-pdf",
  },
  {
    key: "signed-offer-letter",
    clickupFieldName: "Signed Offer Letter",
    label: "Signed offer letter",
    note: "Usually already on file — check before uploading",
    tier: "required",
    maxFiles: 1,
    accepts: "image-and-pdf",
  },
  {
    key: "separation-letters",
    clickupFieldName: "Separation Letters",
    label: "Separation or service letters",
    note: "From previous employers, if you have them",
    tier: "optional",
    maxFiles: 8,
    accepts: "image-and-pdf",
  },
  {
    key: "drivers-licence",
    // Apostrophe and British -ce. Both deliberate; see the module note.
    clickupFieldName: "Driver's Licence",
    label: "Driver's licence",
    note: "Driving roles only",
    tier: "conditional",
    maxFiles: 1,
    accepts: "image-and-pdf",
  },
];

/**
 * Section E. Lifted out of the list because it is the only upload with a
 * quality standard and the only one HR routinely sends back.
 */
export const PASSPORT_PHOTO: DocumentSpec = {
  key: "passport-photo",
  clickupFieldName: "Passport Photo",
  label: "Passport size colour photo",
  tier: "required",
  maxFiles: 1,
  accepts: "image-and-pdf",
};

/** All thirteen, for the contract test and for reading a manifest back. */
export const ALL_DOCUMENTS: DocumentSpec[] = [...DOCUMENTS, PASSPORT_PHOTO];

const BY_KEY = new Map(ALL_DOCUMENTS.map((spec) => [spec.key, spec]));

export const documentSpec = (key: DocumentKey): DocumentSpec => {
  const spec = BY_KEY.get(key);
  // A key with no spec has no clickupFieldName, and a file with no
  // clickupFieldName is a hard error rather than a best-effort guess
  if (!spec) throw new Error(`Unknown document key: ${key}`);
  return spec;
};

export const isDocumentKey = (value: string): value is DocumentKey => BY_KEY.has(value as DocumentKey);

/** The DOM id of a document's tile, for the jump links in the submit summary. */
export const documentTileId = (key: DocumentKey): string => `document-${key}`;

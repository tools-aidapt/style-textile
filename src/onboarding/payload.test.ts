import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import { entriesFor, testSession, testValues, uploaded } from "@/test/onboardingSession";
import { DOCUMENTS, type DocumentKey } from "./documents";
import { emptyEntry, type DocumentEntries } from "./uploads";
import { visibleDocuments } from "./session";
import { buildPayload } from "./payload";

/**
 * The wire schema is the authority, not these types. It is
 * `additionalProperties: false` throughout, so a key this builder invents is a
 * 422 in production and a failure here.
 */
const wireSchema = JSON.parse(
  readFileSync("docs/onboarding-submission-1.0.schema.json", "utf8"),
) as object;
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateWire = ajv.compile(wireSchema);

const REQUIRED: DocumentKey[] = DOCUMENTS.filter((spec) => spec.tier === "required").map(
  (spec) => spec.key,
);

const build = ({
  values = testValues(),
  session = testSession(),
  employeeId = "869evrmhx",
  entries = entriesFor([...REQUIRED, "passport-photo"]) as DocumentEntries,
  advisoriesAcknowledged = [] as string[],
} = {}) =>
  buildPayload({
    values,
    employeeId,
    session,
    requirements: visibleDocuments(session, values),
    entries,
    submissionId: "9f1c2e40-0000-4000-8000-000000000000",
    submittedAt: "2026-09-08T09:14:22.000Z",
    advisoriesAcknowledged,
  });

describe("buildPayload", () => {
  it("puts a payload on the wire that the schema accepts", () => {
    const payload = build();
    const valid = validateWire(payload);
    expect(validateWire.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });

  it("stays valid with an empty optional, a refusal and a waived document", () => {
    const values = testValues({
      helbLoanStatus: "No Loan",
      documentNotes: { "good-conduct": "Applied 2026-08-14" },
    });
    const entries: DocumentEntries = {
      ...entriesFor([...REQUIRED.filter((key) => key !== "helb-status"), "passport-photo"]),
      "good-conduct": {
        ...emptyEntry("good-conduct"),
        phase: "rejected",
        error: { code: "still-too-large", message: "too big", bytes: 7_130_316 },
      },
    };
    expect(validateWire(build({ values, entries, advisoriesAcknowledged: ["A-1", "P-4"] }))).toBe(
      true,
    );
  });

  it("carries the id from the URL, not the one the session echoed", () => {
    // The submit is a POST with no query string, so the payload is n8n's only
    // source for who this belongs to — and the answer is the id the
    // employee's own link established
    expect(build().employee).toEqual({ clickupTaskId: "869evrmhx" });

    const payload = build({
      employeeId: "869eykhcg",
      session: testSession({ clickupTaskId: "869evrmhx" }),
    });
    expect(payload.employee).toEqual({ clickupTaskId: "869eykhcg" });
  });

  it("normalises the mobile number", () => {
    expect(build({ values: testValues({ mobile: "0712 345 678" }) }).personal.mobile).toBe(
      "+254712345678",
    );
  });

  it("flags a changed email so WF-15 can write it back", () => {
    expect(build().personal.personalEmailChanged).toBe(false);
    expect(
      build({ values: testValues({ personalEmail: "stephen@aidapt.co" }) }).personal
        .personalEmailChanged,
    ).toBe(true);
  });

  it("keeps the bank, the account name and the number as three answers", () => {
    // n8n concatenates them into the single text field the workspace has.
    // Asking for them in one box produced "Stephen Wahito 0110123456789",
    // which nobody downstream can safely take apart again.
    expect(build().bank).toEqual({
      bankNameBranch: "Equity Bank, Thika Road branch",
      accountName: "Stephen G Wahito",
      accountNumber: "0110123456789",
      helbLoanStatus: "Cleared Loan",
    });
  });

  it("strips the spaces people put in an account number", () => {
    const payload = build({ values: testValues({ accountNumber: "0110 1234 56789 " }) });
    expect(payload.bank.accountNumber).toBe("0110123456789");
  });

  it("sends the label for the dropdown, never an option id", () => {
    expect(build({ values: testValues({ helbLoanStatus: "No Loan" }) }).bank.helbLoanStatus).toBe(
      "No Loan",
    );
  });

  it("names the ClickUp field beside every document", () => {
    const manifest = build().documents;
    expect(manifest).toHaveLength(REQUIRED.length + 1);
    expect(manifest.find((entry) => entry.documentKey === "nhif-sha")?.clickupFieldName).toBe(
      "NHIF/SHA",
    );
    expect(manifest.every((entry) => entry.status === "attached")).toBe(true);
    // Numbered by position in the request, so the manifest and the multipart
    // parts can be read side by side
    expect(manifest.map((entry) => entry.field)).toEqual(
      manifest.map((_, index) => `file${index}`),
    );
  });

  it("sends null for an empty note, never an empty string", () => {
    expect(build().documents[0].note).toBeNull();
    const withNote = build({
      values: testValues({ documentNotes: { "good-conduct": "Applied 2026-08-14" } }),
    });
    expect(withNote.documents.find((entry) => entry.documentKey === "good-conduct")?.note).toBe(
      "Applied 2026-08-14",
    );
  });

  it("says why each missing document is missing", () => {
    const entries: DocumentEntries = {
      ...entriesFor([...REQUIRED, "passport-photo"]),
      "good-conduct": {
        ...emptyEntry("good-conduct"),
        phase: "rejected",
        error: { code: "still-too-large", message: "too big", bytes: 7_130_316 },
      },
    };
    const payload = build({ entries });
    const conduct = payload.notProvided.find((entry) => entry.documentKey === "good-conduct");
    expect(conduct?.reason).toBe("too-large");
    expect(conduct?.note).toBe("6.8 MB after compressing");

    // An untouched optional reads as what it is
    expect(payload.notProvided.find((entry) => entry.documentKey === "payslips")?.reason).toBe(
      "first-job",
    );
  });

  it("does not report the HELB document as missing when there is no loan", () => {
    const values = testValues({ helbLoanStatus: "No Loan" });
    const entries = entriesFor([
      ...REQUIRED.filter((key) => key !== "helb-status"),
      "passport-photo",
    ]);
    const payload = build({ values, entries });
    expect(payload.notProvided.find((entry) => entry.documentKey === "helb-status")?.reason).toBe(
      "not-applicable",
    );
  });

  it("records the consent, when it was given, and which wording", () => {
    expect(build().consent).toEqual({
      given: true,
      at: "2026-09-08T09:14:18.000Z",
      version: "2026-09",
    });
  });

  it("de-duplicates the acknowledged advisory codes", () => {
    expect(build({ advisoriesAcknowledged: ["A-1", "A-1", "P-4"] }).advisoriesAcknowledged).toEqual([
      "A-1",
      "P-4",
    ]);
  });

  it("omits a document that is still being prepared", () => {
    const entries: DocumentEntries = {
      ...entriesFor([...REQUIRED, "passport-photo"]),
      nssf: { ...uploaded("nssf"), phase: "preparing" },
    };
    const payload = build({ entries });
    expect(payload.documents.map((entry) => entry.documentKey)).not.toContain("nssf");
    // And the numbering closes up rather than leaving a gap where it was
    expect(payload.documents.map((entry) => entry.field)).toEqual(
      payload.documents.map((_, index) => `file${index}`),
    );
  });
});

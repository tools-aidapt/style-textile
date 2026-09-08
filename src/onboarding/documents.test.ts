import { describe, expect, it } from "vitest";
import fixture from "@/test/fixtures/onboarding-document-fields.json";
import { ALL_DOCUMENTS, DOCUMENTS, documentSpec, isDocumentKey } from "./documents";

/**
 * The pairing contract. Everything else in the onboarding module can be
 * refactored; these thirteen strings cannot change without a workflow change
 * on the other side, and the failure mode is silent, so it is pinned here.
 */
describe("document field contract", () => {
  const expected = fixture.fields as Record<string, string>;

  it("covers exactly thirteen documents", () => {
    expect(ALL_DOCUMENTS).toHaveLength(13);
    expect(Object.keys(expected)).toHaveLength(13);
  });

  it("sends the field name the workflow matches on, byte for byte", () => {
    ALL_DOCUMENTS.forEach((spec) => {
      expect(spec.clickupFieldName).toBe(expected[spec.key]);
    });
  });

  it("keeps the spellings that would otherwise be corrected", () => {
    expect(documentSpec("nhif-sha").clickupFieldName).toBe("NHIF/SHA");
    expect(documentSpec("drivers-licence").clickupFieldName).toBe("Driver's Licence");
    expect(documentSpec("payslips").clickupFieldName).toBe("Last 3 Payslips");
  });

  it("gives every document a unique key and a unique field name", () => {
    expect(new Set(ALL_DOCUMENTS.map((s) => s.key)).size).toBe(13);
    expect(new Set(ALL_DOCUMENTS.map((s) => s.clickupFieldName)).size).toBe(13);
  });

  it("keeps the passport photo out of section D", () => {
    expect(DOCUMENTS).toHaveLength(12);
    expect(DOCUMENTS.map((s) => s.key)).not.toContain("passport-photo");
  });

  it("refuses a key it has no field name for", () => {
    // A file with no clickupFieldName must never reach n8n as a best-effort guess
    expect(() => documentSpec("passport" as never)).toThrow();
    expect(isDocumentKey("passport")).toBe(false);
    expect(isDocumentKey("passport-photo")).toBe(true);
  });
});

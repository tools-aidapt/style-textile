import { describe, expect, it } from "vitest";
import { asciiSlug, documentFilename, nairobiDate, nameSegment } from "./filename";

describe("nameSegment", () => {
  it("takes the last token as surname and the first as given name", () => {
    expect(nameSegment("Stephen Gachoka Wahito")).toBe("wahito-stephen");
  });

  it("leaves a single-word name as itself", () => {
    expect(nameSegment("Wahito")).toBe("wahito");
  });

  it("transliterates diacritics to ASCII", () => {
    expect(nameSegment("Stéphane Müller")).toBe("muller-stephane");
    expect(nameSegment("Zoë Şahin")).toBe("sahin-zoe");
    expect(asciiSlug("Straße")).toBe("strasse");
  });

  it("turns an apostrophe into a separator rather than dropping a letter", () => {
    expect(nameSegment("Peter Ng'ang'a")).toBe("ng-ang-a-peter");
  });

  it("truncates a long name and never ends on a separator", () => {
    const segment = nameSegment("Wolfeschlegelsteinhausenbergerdorffvoralternwaren Aa");
    expect(segment.length).toBeLessThanOrEqual(40);
    expect(segment.endsWith("-")).toBe(false);
  });

  it("has something to call a name it cannot read at all", () => {
    expect(nameSegment("   ")).toBe("unnamed");
    expect(nameSegment("字字")).toBe("unnamed");
  });
});

describe("nairobiDate", () => {
  it("uses the Nairobi day, not the UTC one", () => {
    // 22:30 UTC on the 7th is already 01:30 on the 8th in Nairobi, and HR
    // sorts by filename
    expect(nairobiDate(new Date("2026-09-07T22:30:00.000Z"))).toBe("20260908");
    expect(nairobiDate(new Date("2026-09-08T09:14:22.000Z"))).toBe("20260908");
  });
});

describe("documentFilename", () => {
  const at = new Date("2026-09-08T09:14:22.000Z");
  const base = { clickupTaskId: "869EVRMHX", fullName: "Stephen Gachoka Wahito", at };

  it("builds the documented name", () => {
    expect(documentFilename({ ...base, documentKey: "national-id", extension: "pdf" })).toBe(
      "869evrmhx_national-id_wahito-stephen_20260908.pdf",
    );
    expect(documentFilename({ ...base, documentKey: "passport-photo", extension: "jpg" })).toBe(
      "869evrmhx_passport-photo_wahito-stephen_20260908.jpg",
    );
    expect(documentFilename({ ...base, documentKey: "payslips", extension: "pdf" })).toBe(
      "869evrmhx_payslips_wahito-stephen_20260908.pdf",
    );
  });

  it("is lowercase ASCII with no spaces or parentheses", () => {
    const name = documentFilename({
      clickupTaskId: "869EVRMHX",
      fullName: "Zoë Şahin (Jr)",
      documentKey: "kra-pin",
      extension: "pdf",
      at,
    });
    // The last token is the surname, so a bracketed suffix takes that slot.
    // Documented rather than special-cased: the name on a Kenyan ID does not
    // carry one, and guessing at suffixes would mis-handle a real surname.
    expect(name).toBe("869evrmhx_kra-pin_jr-zoe_20260908.pdf");
    expect(name).toMatch(/^[a-z0-9_.-]+$/);
  });

  it("stays within 120 characters", () => {
    const name = documentFilename({
      clickupTaskId: "8".repeat(60),
      fullName: "Wolfeschlegelsteinhausenbergerdorff Aaaaaaaaaaaaaaaaaaaa",
      documentKey: "separation-letters",
      extension: "pdf",
      at,
    });
    expect(name.length).toBeLessThanOrEqual(120);
    expect(name.endsWith(".pdf")).toBe(true);
  });

  it("gives a replaced document the same name, so nothing appends (1)", () => {
    const first = documentFilename({ ...base, documentKey: "nssf", extension: "pdf" });
    const second = documentFilename({ ...base, documentKey: "nssf", extension: "pdf" });
    expect(second).toBe(first);
  });
});

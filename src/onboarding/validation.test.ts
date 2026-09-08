import { describe, expect, it } from "vitest";
import { entriesFor, testSession, testValues, uploaded } from "@/test/onboardingSession";
import { DOCUMENTS, type DocumentKey } from "./documents";
import { emptyEntry, type DocumentEntries } from "./uploads";
import { visibleDocuments } from "./session";
import type { PhotoCheck } from "./media/photo";
import { DIAL_CODES } from "./dialCodes";
import {
  advise,
  normaliseMobile,
  splitMobile,
  unacknowledged,
  validate,
  type ValidationInput,
} from "./validation";

/** Everything Section D asks of an employee with no served conditionals. */
const DEFAULT_REQUIRED: DocumentKey[] = DOCUMENTS.filter((spec) => spec.tier === "required").map(
  (spec) => spec.key,
);

const passing: PhotoCheck[] = [
  { code: "P-1", tier: "blocking", passed: true, message: "" },
  { code: "P-2", tier: "blocking", passed: true, message: "" },
  { code: "P-3", tier: "advisory", passed: true, message: "" },
];

const input = (overrides: Partial<ValidationInput> = {}): ValidationInput => {
  const session = overrides.session ?? testSession();
  const values = overrides.values ?? testValues();
  return {
    values,
    session,
    requirements: overrides.requirements ?? visibleDocuments(session, values),
    entries:
      overrides.entries ?? {
        ...entriesFor([...DEFAULT_REQUIRED, "passport-photo"]),
      },
    photoChecks: overrides.photoChecks ?? passing,
  };
};

describe("normaliseMobile", () => {
  it("accepts the ways people write their own number", () => {
    // The field asks for the national part, but people type what they always
    // type — a trunk zero, the country code again, spaces and brackets
    [
      "712 345 678",
      "0712 345 678",
      "0712345678",
      "+254712345678",
      "254 712 345 678",
      "(0712) 345-678",
      "+254 0712 345 678",
    ].forEach((written) => expect(normaliseMobile(written, "+254")).toBe("+254712345678"));
  });

  it("accepts the 01 range as well as 07", () => {
    expect(normaliseMobile("0110123456", "+254")).toBe("+254110123456");
  });

  it("checks a Kenyan number properly", () => {
    ["0812345678", "071234567", "07123456789", "", "abc"].forEach((written) =>
      expect(normaliseMobile(written, "+254")).toBeNull(),
    );
  });

  it("defaults to Kenya when no country is given", () => {
    expect(normaliseMobile("0712345678")).toBe("+254712345678");
  });

  it("takes a length check only for everywhere else", () => {
    // This app has no business deciding what a valid Ugandan mobile looks
    // like, and getting it wrong would block somebody's first day
    expect(normaliseMobile("772 123 456", "+256")).toBe("+256772123456");
    expect(normaliseMobile("07712 345678", "+44")).toBe("+447712345678");
    expect(normaliseMobile("123", "+256")).toBeNull();
    expect(normaliseMobile("1234567890123456", "+256")).toBeNull();
  });

  it("copes with a dial code written without its plus", () => {
    expect(normaliseMobile("712345678", "254")).toBe("+254712345678");
  });
});

describe("splitMobile", () => {
  it("takes a number on file apart so the country lands in the select", () => {
    expect(splitMobile("+254712345678", DIAL_CODES)).toEqual({
      country: "KE",
      national: "712345678",
    });
  });

  it("prefers the longest matching code", () => {
    // +25 is not a country, but +250 and +254 both start with it, and a
    // shortest-first match would put a Rwandan number under Kenya
    expect(splitMobile("+250788123456", DIAL_CODES)?.country).toBe("RW");
    expect(splitMobile("+27821234567", DIAL_CODES)?.country).toBe("ZA");
  });

  it("gives up rather than guessing", () => {
    expect(splitMobile("0712345678", DIAL_CODES)).toBeNull();
    expect(splitMobile("+999123456", DIAL_CODES)).toBeNull();
  });
});

describe("blocking rules", () => {
  it("passes a complete submission", () => {
    const { errors, blocking } = validate(input());
    expect(errors).toEqual({});
    expect(blocking).toEqual([]);
  });

  it("B-1 · names every missing required answer", () => {
    const { errors } = validate(
      input({
        values: testValues({
          address: "",
          bankNameBranch: "",
          accountName: "",
          accountNumber: "",
        }),
      }),
    );
    expect(errors.address).toBe("Required");
    expect(errors.bankNameBranch).toBe("Required");
    // The account name and the number are two answers, so a missing one is
    // named on its own field rather than on a combined box
    expect(errors.accountName).toBe("Required");
    expect(errors.accountNumber).toBe("Required");
  });

  it("B-2 · wants a name that looks like a full name", () => {
    expect(validate(input({ values: testValues({ fullName: "Stephen" }) })).errors.fullName).toBe(
      "Enter your full name as it appears on your ID.",
    );
    expect(validate(input({ values: testValues({ fullName: "St" }) })).errors.fullName).toBeTruthy();
  });

  it("B-3 · checks the email", () => {
    expect(
      validate(input({ values: testValues({ personalEmail: "stephen.wahito" }) })).errors
        .personalEmail,
    ).toBe("Check this email address.");
  });

  it("B-4 · checks the mobile against the country that was chosen", () => {
    expect(validate(input({ values: testValues({ mobile: "0812345678" }) })).errors.mobile).toBe(
      "Enter a Kenyan mobile number, e.g. 0712 345 678.",
    );

    // A Kenyan number left behind by a country change is still wrong, and the
    // message stops naming Kenya once Kenya is not what was picked
    expect(
      validate(input({ values: testValues({ mobile: "12", mobileCountry: "UG" }) })).errors.mobile,
    ).toBe("Check this number — digits only, without the country code.");

    // And a real Ugandan number passes
    expect(
      validate(input({ values: testValues({ mobile: "772123456", mobileCountry: "UG" }) })).errors
        .mobile,
    ).toBeUndefined();
  });

  it("B-5 · counts the documents still needed and says which", () => {
    const entries: DocumentEntries = entriesFor([
      ...DEFAULT_REQUIRED.filter((key) => key !== "nssf" && key !== "kra-pin"),
      "passport-photo",
    ]);
    const { blocking } = validate(input({ entries }));
    const issue = blocking.find((item) => item.code === "B-5");
    expect(issue?.message).toBe("2 documents still needed");
    expect(issue?.documents).toEqual(expect.arrayContaining(["kra-pin", "nssf"]));
  });

  it("B-6 · wants the HELB question answered", () => {
    expect(
      validate(input({ values: testValues({ helbLoanStatus: "" }) })).errors.helbLoanStatus,
    ).toBe("Choose one.");
  });

  it("B-7 · wants the HELB document when there is a loan", () => {
    const entries = entriesFor([
      ...DEFAULT_REQUIRED.filter((key) => key !== "helb-status"),
      "passport-photo",
    ]);
    const { blocking } = validate(
      input({ values: testValues({ helbLoanStatus: "Pending Clearance" }), entries }),
    );
    expect(blocking.find((item) => item.code === "B-7")?.message).toBe(
      "Add your HELB status document, or change your answer above.",
    );
    // And says it once — B-5 does not also count it
    expect(blocking.find((item) => item.code === "B-5")?.documents ?? []).not.toContain(
      "helb-status",
    );
  });

  it("B-7 · does not want it when there is no loan", () => {
    const values = testValues({ helbLoanStatus: "No Loan" });
    const entries = entriesFor([
      ...DEFAULT_REQUIRED.filter((key) => key !== "helb-status"),
      "passport-photo",
    ]);
    const { blocking } = validate(input({ values, entries }));
    expect(blocking).toEqual([]);
  });

  it("B-8 · blocks on the photo's blocking checks only", () => {
    const failedP2: PhotoCheck[] = [
      { code: "P-2", tier: "blocking", passed: false, message: "This photo is too small. Take a new one." },
      { code: "P-4", tier: "advisory", passed: false, message: "This photo looks blurry." },
    ];
    const { blocking } = validate(input({ photoChecks: failedP2 }));
    expect(blocking.map((item) => item.code)).toContain("P-2");
    expect(blocking.map((item) => item.code)).not.toContain("P-4");
  });

  it("B-9 · wants the consent box ticked", () => {
    expect(validate(input({ values: testValues({ consent: false }) })).errors.consent).toBe(
      "Tick the box to continue.",
    );
  });

  it("B-10 · waits while a document is still being prepared", () => {
    const busy: DocumentEntries = {
      ...entriesFor([...DEFAULT_REQUIRED, "passport-photo"]),
      nssf: { ...emptyEntry("nssf"), phase: "preparing" },
    };
    const issue = validate(input({ entries: busy })).blocking.find((item) => item.code === "B-10");
    expect(issue?.message).toBe("One document is still being prepared");
    expect(issue?.documents).toEqual(["nssf"]);
  });

  it("B-11 · refuses before a long upload rather than after it", () => {
    // Everything goes up in one request, and the webhook has a body limit.
    // Being told at 95% of a four-minute upload is the failure worth avoiding.
    const heavy: DocumentEntries = Object.fromEntries(
      ([...DEFAULT_REQUIRED, "passport-photo"] as DocumentKey[]).map((key) => [
        key,
        uploaded(key, {
          output: {
            clickupFieldName: "x",
            filename: `${key}.pdf`,
            bytes: 4 * 1024 * 1024,
            originalBytes: 4 * 1024 * 1024,
            sourceCount: 1,
            pageCount: 1,
          },
        }),
      ]),
    );

    const issue = validate(input({ entries: heavy })).blocking.find(
      (item) => item.code === "B-11",
    );
    expect(issue?.message).toContain("is the most that can be sent at once");
    // And it names the heaviest, because "make it smaller" with no target is
    // not an instruction anybody can act on
    expect(issue?.documents).toHaveLength(3);
  });

  it("B-11 · says nothing when it all fits", () => {
    expect(validate(input()).blocking.find((item) => item.code === "B-11")).toBeUndefined();
  });

  it("does not ask for a document that is already on file", () => {
    const session = testSession({ alreadyReceived: ["signed-offer-letter"] });
    const values = testValues();
    const entries = entriesFor([
      ...DEFAULT_REQUIRED.filter((key) => key !== "signed-offer-letter"),
      "passport-photo",
    ]);
    const { blocking } = validate(
      input({ session, values, requirements: visibleDocuments(session, values), entries }),
    );
    expect(blocking).toEqual([]);
  });

  it("B-8 · does not ask for a photo Kenafric already holds", () => {
    const session = testSession({ alreadyReceived: ["passport-photo"] });
    const values = testValues();
    const { blocking } = validate(
      input({
        session,
        values,
        requirements: visibleDocuments(session, values),
        entries: entriesFor(DEFAULT_REQUIRED),
        photoChecks: [],
      }),
    );
    expect(blocking).toEqual([]);
  });

  it("hides a conditional document until the session says it applies", () => {
    const values = testValues();
    const hidden = visibleDocuments(testSession(), values).map((item) => item.spec.key);
    expect(hidden).not.toContain("public-health-cert");
    expect(hidden).not.toContain("drivers-licence");

    const served = visibleDocuments(
      testSession({ requiredDocuments: ["public-health-cert"] }),
      values,
    );
    expect(served.find((item) => item.spec.key === "public-health-cert")?.required).toBe(true);
  });
});

describe("advisory rules", () => {
  it("A-1 · names an empty optional document without demanding a tick", () => {
    const advisories = advise(input());
    const payslips = advisories.find((advisory) => advisory.id === "A-1:payslips");
    expect(payslips?.message).toBe(
      "You haven't added your payslips. That's fine if this is your first job.",
    );
    expect(payslips?.needsAck).toBe(false);
  });

  it("A-2 · carries the photo's advisory checks, and they need acknowledging", () => {
    const advisories = advise(
      input({
        photoChecks: [
          { code: "P-4", tier: "advisory", passed: false, message: "This photo looks blurry." },
        ],
      }),
    );
    const blurry = advisories.find((advisory) => advisory.code === "P-4");
    expect(blurry?.needsAck).toBe(true);
    expect(unacknowledged(advisories, [])).toContain(blurry);
    expect(unacknowledged(advisories, ["P-4"])).not.toContain(blurry);
  });

  it("A-3 · flags a name that differs from the one on file", () => {
    const values = testValues({ fullName: "Steve Wahito" });
    const advisories = advise(input({ values }));
    expect(advisories.find((advisory) => advisory.code === "A-3")?.needsAck).toBe(true);
  });

  it("A-5 · speaks up when the account is not in this person's name", () => {
    const advisories = advise(
      input({ values: testValues({ accountName: "Mary Njeri Kamau" }) }),
    );
    const warning = advisories.find((advisory) => advisory.code === "A-5");
    expect(warning?.needsAck).toBe(true);
    expect(warning?.message).toContain("account in your own name");
  });

  it("A-5 · stays quiet for the way banks actually hold a name", () => {
    // "S G WAHITO" against "Stephen Gachoka Wahito" is the norm, not a
    // problem. A check that fires on that teaches people to click through.
    ["S G Wahito", "WAHITO STEPHEN G", "Stephen Wahito", "stephen g wahito"].forEach((held) => {
      const advisories = advise(input({ values: testValues({ accountName: held }) }));
      expect(advisories.find((advisory) => advisory.code === "A-5")).toBeUndefined();
    });
  });

  it("A-5 · says nothing before the field has been filled in", () => {
    const advisories = advise(input({ values: testValues({ accountName: "" }) }));
    expect(advisories.find((advisory) => advisory.code === "A-5")).toBeUndefined();
  });

  it("A-4 · flags a document that is suspiciously small", () => {
    const entries: DocumentEntries = {
      ...entriesFor([...DEFAULT_REQUIRED, "passport-photo"]),
      nssf: uploaded("nssf", {
        output: {
          clickupFieldName: "NSSF",
          filename: "869evrmhx_nssf_wahito-stephen_20260908.pdf",
          bytes: 20_000,
          originalBytes: 20_000,
          sourceCount: 1,
          pageCount: 1,
        },
      }),
    };
    const advisories = advise(input({ entries }));
    expect(advisories.find((advisory) => advisory.id === "A-4:nssf")?.message).toContain(
      "very small file",
    );
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { companyName, isInternal, parseContext, readToken } from "./session";

/**
 * The token and the context response.
 *
 * The rule these tests exist to hold is that the app treats the token as an
 * opaque string and takes every fact from the endpoint. A regression here is
 * not a cosmetic bug: `formType` decides which `Form Type` a response is
 * tagged with and whether a payroll number is shown, so reading it out of an
 * unverified token would let a candidate choose both.
 */

const VALID = "eyJmdCI6IkNSUiIsImNpZCI6Ijg2OWV2cm1oeCJ9.dGVzdC1zaWduYXR1cmUtbm90LXJlYWw";

const setSearch = (search: string) => {
  window.history.replaceState({}, "", `/feedback/candidate-review${search}`);
};

afterEach(() => setSearch(""));

describe("readToken", () => {
  it("reads a token-shaped ?t=", () => {
    setSearch(`?t=${VALID}`);
    expect(readToken()).toBe(VALID);
  });

  it("returns nothing when there is no token", () => {
    setSearch("");
    expect(readToken()).toBe("");
    setSearch("?t=");
    expect(readToken()).toBe("");
  });

  it("refuses a token with no signature part", () => {
    // Saves the endpoint a verification, and keeps a URL nobody typed on
    // purpose out of the logs
    setSearch("?t=eyJmdCI6IkNSUiJ9");
    expect(readToken()).toBe("");
  });

  it("refuses a token carrying characters base64url has no business holding", () => {
    setSearch("?t=abcdefghijklmnop.<script>alert(1)</script>");
    expect(readToken()).toBe("");
  });

  it("refuses a token too short to be one", () => {
    setSearch("?t=abc.def");
    expect(readToken()).toBe("");
  });

  it("ignores an id path segment, unlike the onboarding form", () => {
    // A token is long enough that no email client reflows it into a path, so
    // there is no path form to accept — and accepting one would mean two
    // shapes of link to keep working
    window.history.replaceState({}, "", `/feedback/candidate-review/${VALID}`);
    expect(readToken()).toBe("");
  });
});

describe("parseContext", () => {
  const body = (overrides: Record<string, unknown> = {}) => ({
    ok: true,
    formType: "CRR",
    alreadySubmitted: false,
    prefill: {
      fullName: "  Amina Otieno  ",
      email: "amina.otieno.sample@example.com",
      payroll: "",
      positionTitle: "Sales Operations Coordinator",
      company: "Kenafric Manufacturing Limited",
      department: "Sales & Distribution",
      recruitmentType: "External Recruitment",
    },
    ...overrides,
  });

  it("reads the prefill and trims it", () => {
    const context = parseContext(body());
    expect(context?.formType).toBe("CRR");
    expect(context?.prefill.fullName).toBe("Amina Otieno");
    expect(context?.alreadySubmitted).toBe(false);
  });

  it("turns an empty optional into null rather than an empty string", () => {
    expect(parseContext(body())?.prefill.payroll).toBeNull();
    expect(parseContext(body())?.prefill.jobTitle).toBeNull();
  });

  it("refuses a body with no form type", () => {
    // Guessing would tag somebody's answers as the wrong instrument
    expect(parseContext(body({ formType: undefined }))).toBeNull();
    expect(parseContext(body({ formType: "CANDIDATE_SURVEY" }))).toBeNull();
  });

  it("refuses an explicit refusal that arrived with a 200 on it", () => {
    // n8n Respond nodes do this more often than anyone would like
    expect(parseContext(body({ ok: false }))).toBeNull();
  });

  it("refuses a body that is not an object", () => {
    expect(parseContext(null)).toBeNull();
    expect(parseContext("ok")).toBeNull();
    expect(parseContext([])).toBeNull();
  });

  it("treats alreadySubmitted as true only when it really is", () => {
    expect(parseContext(body({ alreadySubmitted: true }))?.alreadySubmitted).toBe(true);
    // A truthy string from a workflow that stringified a boolean must not
    // lock somebody out of a form they have not filled in
    expect(parseContext(body({ alreadySubmitted: "false" }))?.alreadySubmitted).toBe(false);
  });

  it("survives a response with no prefill at all", () => {
    const context = parseContext({ ok: true, formType: "CRR" });
    expect(context?.prefill.fullName).toBe("");
    expect(context?.prefill.company).toBeNull();
  });
});

describe("which variant is rendered", () => {
  const context = (formType: "CRR" | "ICRR", company: string | null) =>
    parseContext({ ok: true, formType, prefill: { company } })!;

  it("shows the payroll block to internal applicants only", () => {
    expect(isInternal(context("ICRR", null))).toBe(true);
    expect(isInternal(context("CRR", null))).toBe(false);
  });

  it("names the employing entity the candidate actually met", () => {
    // G-9: the ClickUp field is named for Kenafric Industries Ltd, but the
    // hire may have been for KML, KBBL or Properties
    expect(companyName(context("CRR", "Kenafric Bakery & Biscuits Limited"))).toBe(
      "Kenafric Bakery & Biscuits Limited",
    );
  });

  it("falls back to the group rather than naming the wrong company", () => {
    expect(companyName(context("CRR", null))).toBe("Kenafric");
  });
});

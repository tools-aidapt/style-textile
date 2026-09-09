import { describe, expect, it } from "vitest";
import {
  allQuestions,
  askableSections,
  FORM_TYPE_LABEL,
  isFieldId,
  isFormType,
  questionDomId,
  renderLabel,
  withheldQuestions,
  type FeedbackFormSpec,
} from "./schema";

/**
 * The safety net, tested on a synthetic spec.
 *
 * Every question in the live candidate review now carries a complete field id,
 * so nothing there exercises the withholding path any more. It still has to
 * work: the next three instruments will each be built from an audit, and an
 * audit is where an abbreviated id comes from. A mechanism only covered by the
 * bug that revealed it stops being covered the moment the bug is fixed.
 */

const spec = (): FeedbackFormSpec => ({
  formTypes: ["MRR"],
  title: "Test",
  intro: "",
  ratingQuestions: [],
  sections: [
    {
      id: "one",
      ordinal: 1,
      title: "Answerable",
      questions: [
        {
          id: "aaaaaaaa-1111-2222-3333-444444444444",
          label: "A storable question",
          type: "text",
          required: true,
        },
      ],
    },
    {
      id: "two",
      ordinal: 2,
      // Every question here is unstorable, so the whole section goes
      title: "Entirely unstorable",
      questions: [
        { id: "bbbbbbbb", label: "An abbreviated id", type: "text", required: true },
      ],
    },
    {
      id: "three",
      ordinal: 3,
      title: "Partly storable",
      questions: [
        { id: "cccccccc-not-a-uuid", label: "A malformed id", type: "text", required: true },
        {
          id: "dddddddd-5555-6666-7777-888888888888",
          label: "Another storable question",
          type: "text",
          required: false,
        },
      ],
    },
  ],
});

describe("isFieldId", () => {
  it("accepts a complete ClickUp field UUID", () => {
    expect(isFieldId("a74b7b20-5e86-4d94-93e2-13e32930b60f")).toBe(true);
  });

  it("rejects anything that is not one", () => {
    // The abbreviation an audit produces, a truncated paste, a made-up id, and
    // the uppercase form ClickUp never returns
    expect(isFieldId("006db82e")).toBe(false);
    expect(isFieldId("006db82e-6dfe-4554-ab17")).toBe(false);
    expect(isFieldId("not-a-uuid-at-all")).toBe(false);
    expect(isFieldId("A74B7B20-5E86-4D94-93E2-13E32930B60F")).toBe(false);
    expect(isFieldId("")).toBe(false);
  });
});

describe("askableSections", () => {
  it("drops a question whose id could not be written to", () => {
    const shown = askableSections(spec()).flatMap((section) => section.questions);
    expect(shown.map((q) => q.id)).toEqual([
      "aaaaaaaa-1111-2222-3333-444444444444",
      "dddddddd-5555-6666-7777-888888888888",
    ]);
  });

  it("drops a section left with nothing to ask", () => {
    // Rather than rendering a heading with no questions under it
    expect(askableSections(spec()).map((section) => section.id)).toEqual(["one", "three"]);
  });

  it("renumbers what survives, so the reader counts 1, 2", () => {
    // Section 3 becomes section 2. "Section 1, 3" reads as a form that lost a
    // page on the way to the candidate.
    expect(askableSections(spec()).map((section) => section.ordinal)).toEqual([1, 2]);
  });

  it("leaves the spec itself untouched", () => {
    const original = spec();
    askableSections(original);
    expect(allQuestions(original)).toHaveLength(4);
    expect(original.sections[0].ordinal).toBe(1);
  });
});

describe("withheldQuestions", () => {
  it("names exactly what was dropped, for the development notice", () => {
    expect(withheldQuestions(spec()).map((q) => q.id)).toEqual([
      "bbbbbbbb",
      "cccccccc-not-a-uuid",
    ]);
  });
});

describe("questionDomId", () => {
  it("prefixes, because a DOM id may not begin with a digit", () => {
    expect(questionDomId("006db82e-6dfe-4554-ab17-29d0fed62b9f")).toBe(
      "q-006db82e-6dfe-4554-ab17-29d0fed62b9f",
    );
  });
});

describe("renderLabel", () => {
  it("substitutes the employing entity", () => {
    expect(renderLabel("Would you recommend {{company}} to others?", "Kenafric Properties")).toBe(
      "Would you recommend Kenafric Properties to others?",
    );
  });

  it("leaves a label with no placeholder alone", () => {
    expect(renderLabel("The preparedness of your interviewers?", "Kenafric")).toBe(
      "The preparedness of your interviewers?",
    );
  });
});

describe("isFormType", () => {
  it("accepts the five instruments and nothing else", () => {
    Object.keys(FORM_TYPE_LABEL).forEach((code) => expect(isFormType(code)).toBe(true));
    expect(isFormType("CANDIDATE_SURVEY")).toBe(false);
    expect(isFormType("crr")).toBe(false);
    expect(isFormType(undefined)).toBe(false);
  });

  it("maps each to the ClickUp Form Type option name", () => {
    // Names, never option UUIDs — WF-14 resolves them against the live schema
    expect(FORM_TYPE_LABEL.CRR).toBe("Candidate Recruitment Review Form");
    expect(FORM_TYPE_LABEL.ICRR).toBe("Internal Candidate Recruitment Review Form");
  });
});

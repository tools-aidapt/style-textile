import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import { CANDIDATE_REVIEW, RATING_QUESTION_IDS } from "./candidateReview";
import type { Answers } from "./contract";
import { buildSubmission, cleanAnswers, localIsoTimestamp } from "./payload";
import type { FeedbackContext } from "./session";

/**
 * The payload is checked against the published wire schema rather than
 * against this file's opinion of it. `additionalProperties: false` at the top
 * level means a key this builder invents is a rejection in production and a
 * failure here.
 */
const wireSchema = JSON.parse(
  readFileSync("docs/feedback-submission-1.0.schema.json", "utf8"),
) as object;
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateWire = ajv.compile(wireSchema);

const conforms = (payload: unknown) => {
  const ok = validateWire(payload);
  // Surface the actual violations rather than a bare false
  return ok ? [] : (validateWire.errors ?? []).map((e) => `${e.instancePath} ${e.message}`);
};

const TOKEN = "eyJmdCI6IkNSUiIsImNpZCI6Ijg2OWV2cm1oeCJ9.dGVzdC1zaWduYXR1cmUtbm90LXJlYWw";

const context = (overrides: Partial<FeedbackContext> = {}): FeedbackContext => ({
  formType: "CRR",
  alreadySubmitted: false,
  fieldIds: {},
  warning: null,
  prefill: {
    fullName: "Amina Otieno",
    email: "amina.otieno.sample@example.com",
    subjectName: null,
    payroll: null,
    positionTitle: "Sales Operations Coordinator",
    hiresMade: null,
    jobTitle: null,
    company: "Kenafric Manufacturing Limited",
    department: "Sales & Distribution",
    recruitmentType: "External Recruitment",
    reviewPoint: null,
  },
  ...overrides,
});

/** Every rating answered, plus both required choices. A complete response. */
const completeAnswers = (): Answers => ({
  ...Object.fromEntries(RATING_QUESTION_IDS.map((id) => [id, 4])),
  "9a21e6ae-5493-47a9-9ab1-87d6002216eb": "Easy and engaging",
  "d27d7a83-c193-4173-a07a-6691b90eea4b": "Yes",
});

describe("localIsoTimestamp", () => {
  it("carries a numeric offset, never Z", () => {
    // Every one of these is submitted in Nairobi. A 09:00 EAT response filed
    // as 06:00 UTC reads as somebody answering before the email went out.
    const stamp = localIsoTimestamp(new Date(2026, 8, 9, 14, 20, 0));
    expect(stamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
    expect(stamp.endsWith("Z")).toBe(false);
    expect(stamp.startsWith("2026-09-09T14:20:00")).toBe(true);
  });
});

describe("cleanAnswers", () => {
  it("drops an unanswered optional question rather than sending it empty", () => {
    // An empty string is a value ClickUp will write, and "skipped" reports
    // differently from "answered nothing"
    const clean = cleanAnswers(
      CANDIDATE_REVIEW,
      { ...completeAnswers(), "f7994a03-2a34-4623-8fa6-065a3fddaf8c": "   " },
      context(),
    );
    expect(clean).not.toHaveProperty("f7994a03-2a34-4623-8fa6-065a3fddaf8c");
  });

  it("trims a text answer that was given", () => {
    const clean = cleanAnswers(
      CANDIDATE_REVIEW,
      {
        ...completeAnswers(),
        "f7994a03-2a34-4623-8fa6-065a3fddaf8c": "  The interviewers were well prepared.\n",
      },
      context(),
    );
    expect(clean["f7994a03-2a34-4623-8fa6-065a3fddaf8c"]).toBe(
      "The interviewers were well prepared.",
    );
  });

  it("refuses an answer keyed by an abbreviated id", () => {
    // An id that is not a complete UUID withholds its own question, so an
    // answer keyed by one could never be stored. It must not reach the wire.
    const clean = cleanAnswers(
      CANDIDATE_REVIEW,
      { ...completeAnswers(), "006db82e": "Everything about it." },
      context(),
    );
    expect(clean).not.toHaveProperty("006db82e");
    // …while the completed id for that same question does go through
    expect(
      cleanAnswers(
        CANDIDATE_REVIEW,
        { ...completeAnswers(), "006db82e-6dfe-4554-ab17-29d0fed62b9f": "Everything about it." },
        context(),
      )["006db82e-6dfe-4554-ab17-29d0fed62b9f"],
    ).toBe("Everything about it.");
  });

  it("refuses an answer to a field the spec does not ask about at all", () => {
    const clean = cleanAnswers(
      CANDIDATE_REVIEW,
      { ...completeAnswers(), "91645423-704c-4e6f-bbae-206b094893ed": 4.2 },
      context(),
    );
    // Overall Rating is WF-21's to compute. The browser does not get a vote.
    expect(clean).not.toHaveProperty("91645423-704c-4e6f-bbae-206b094893ed");
  });

  it("keeps a five-star answer as an integer", () => {
    const clean = cleanAnswers(CANDIDATE_REVIEW, completeAnswers(), context());
    expect(clean[RATING_QUESTION_IDS[0]]).toBe(4);
    expect(typeof clean[RATING_QUESTION_IDS[0]]).toBe("number");
  });
});

describe("a field id the server names", () => {
  const SPEC_ID = "d27d7a83-c193-4173-a07a-6691b90eea4b";
  const REBUILT = "aaaaaaaa-1111-2222-3333-444444444444";

  it("posts the recommend answer to the id the context endpoint gave", () => {
    /**
     * This field has been rebuilt in ClickUp once already, and a rebuild
     * means a new UUID: an answer posted to the retired id is dropped
     * without an error anywhere. So the server names it and the spec's own
     * id is only a fallback.
     */
    const clean = cleanAnswers(
      CANDIDATE_REVIEW,
      completeAnswers(),
      context({ fieldIds: { recommendFieldId: REBUILT } }),
    );
    expect(clean[REBUILT]).toBe("Yes");
    expect(clean).not.toHaveProperty(SPEC_ID);
  });

  it("falls back to the spec's id when the server names none", () => {
    const clean = cleanAnswers(CANDIDATE_REVIEW, completeAnswers(), context());
    expect(clean[SPEC_ID]).toBe("Yes");
  });

  it("ignores an override that is not a complete UUID", () => {
    // The fallback is an id somebody has actually tested. Posting to a
    // malformed one files the answer against nothing.
    const clean = cleanAnswers(
      CANDIDATE_REVIEW,
      completeAnswers(),
      context({ fieldIds: { recommendFieldId: "d27d7a83" } }),
    );
    expect(clean[SPEC_ID]).toBe("Yes");
    expect(clean).not.toHaveProperty("d27d7a83");
  });

  it("substitutes nothing on a question that did not ask for it", () => {
    // Only the question marked `idFrom` is remapped; the other nineteen keep
    // the ids the spec is tested against
    const clean = cleanAnswers(
      CANDIDATE_REVIEW,
      completeAnswers(),
      context({ fieldIds: { recommendFieldId: REBUILT } }),
    );
    expect(clean[RATING_QUESTION_IDS[0]]).toBe(4);
    expect(clean["9a21e6ae-5493-47a9-9ab1-87d6002216eb"]).toBe("Easy and engaging");
  });

  it("still conforms to the wire schema with a substituted key", () => {
    const payload = buildSubmission({
      token: TOKEN,
      context: context({ fieldIds: { recommendFieldId: REBUILT } }),
      spec: CANDIDATE_REVIEW,
      answers: completeAnswers(),
    });
    expect(conforms(payload)).toEqual([]);
  });
});

describe("buildSubmission", () => {
  it("conforms to the published wire schema", () => {
    const payload = buildSubmission({
      token: TOKEN,
      context: context(),
      spec: CANDIDATE_REVIEW,
      answers: {
        ...completeAnswers(),
        "f7994a03-2a34-4623-8fa6-065a3fddaf8c": "Quick and clear throughout.",
      },
    });
    expect(conforms(payload)).toEqual([]);
  });

  it("sends four keys and nothing else", () => {
    const payload = buildSubmission({
      token: TOKEN,
      context: context(),
      spec: CANDIDATE_REVIEW,
      answers: completeAnswers(),
    });
    expect(Object.keys(payload).sort()).toEqual(["answers", "formType", "submittedAt", "t"]);
  });

  it("passes the token through untouched", () => {
    const payload = buildSubmission({
      token: TOKEN,
      context: context(),
      spec: CANDIDATE_REVIEW,
      answers: completeAnswers(),
    });
    // It is the idempotency key and the credential. Rewriting any part of it
    // would have WF-21 reject a legitimate response.
    expect(payload.t).toBe(TOKEN);
  });

  it("takes the form type from the server, never from the app", () => {
    const payload = buildSubmission({
      token: TOKEN,
      context: context({ formType: "ICRR" }),
      spec: CANDIDATE_REVIEW,
      answers: completeAnswers(),
    });
    // This is what makes an internal response countable — the defect carried
    // straight over from Airtable, where the internal form had no tag at all
    expect(payload.formType).toBe("ICRR");
    expect(conforms(payload)).toEqual([]);
  });

  it("carries no ClickUp option UUID and no list id", () => {
    const payload = buildSubmission({
      token: TOKEN,
      context: context(),
      spec: CANDIDATE_REVIEW,
      answers: completeAnswers(),
    });
    // Option names, resolved by WF-21 against the live schema. An option UUID
    // in a public bundle is one that leaks and one that breaks on a rebuild.
    expect(payload.answers["9a21e6ae-5493-47a9-9ab1-87d6002216eb"]).toBe("Easy and engaging");
    expect(JSON.stringify(payload)).not.toContain("901220480198");
  });

  it("is rejected by the schema if an answer key is an abbreviated id", () => {
    // Proves the schema catches what `cleanAnswers` filters, so a future
    // caller that bypasses the builder still cannot post a guessable id
    expect(
      conforms({
        t: TOKEN,
        formType: "CRR",
        submittedAt: localIsoTimestamp(),
        answers: { "006db82e": "Everything." },
      }),
    ).not.toEqual([]);
  });

  it("is rejected by the schema if a rating is out of range", () => {
    expect(
      conforms({
        t: TOKEN,
        formType: "CRR",
        submittedAt: localIsoTimestamp(),
        answers: { [RATING_QUESTION_IDS[0]]: 6 },
      }),
    ).not.toEqual([]);
  });

  it("is rejected by the schema if a stray key is added", () => {
    expect(
      conforms({
        t: TOKEN,
        formType: "CRR",
        submittedAt: localIsoTimestamp(),
        answers: completeAnswers(),
        overallRating: 4.2,
      }),
    ).not.toEqual([]);
  });
});

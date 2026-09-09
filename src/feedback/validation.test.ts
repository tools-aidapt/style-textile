import { describe, expect, it } from "vitest";
import { CANDIDATE_REVIEW, RATING_QUESTION_IDS } from "./candidateReview";
import type { Answers } from "./contract";
import { answeredCount, askableCount, overallRating, validate } from "./validation";

const HIRING_PROCESS = "9a21e6ae-5493-47a9-9ab1-87d6002216eb";
const RECOMMEND = "d27d7a83-c193-4173-a07a-6691b90eea4b";
const COMMENTS = "f7994a03-2a34-4623-8fa6-065a3fddaf8c";

const rated = (score: number): Answers =>
  Object.fromEntries(RATING_QUESTION_IDS.map((id) => [id, score]));

const complete = (): Answers => ({
  ...rated(4),
  [HIRING_PROCESS]: "Easy and engaging",
  [RECOMMEND]: "Yes",
});

describe("validate", () => {
  it("passes a complete response with no prose", () => {
    // The five free-text answers are optional (D-14): mandatory prose is the
    // biggest driver of survey abandonment, and the ratings carry the report
    expect(validate(CANDIDATE_REVIEW, complete())).toEqual({ errors: {}, missing: [] });
  });

  it("names every unanswered required question, in reading order", () => {
    const { missing } = validate(CANDIDATE_REVIEW, {});
    expect(missing).toEqual([...RATING_QUESTION_IDS.slice(0, 12), HIRING_PROCESS, RATING_QUESTION_IDS[12], RECOMMEND]);
  });

  it("puts the first problem first, so the jump lands somewhere useful", () => {
    const { missing } = validate(CANDIDATE_REVIEW, {
      ...complete(),
      [RATING_QUESTION_IDS[3]]: undefined as never,
    });
    expect(missing[0]).toBe(RATING_QUESTION_IDS[3]);
  });

  it("accepts a blank optional text answer", () => {
    expect(validate(CANDIDATE_REVIEW, { ...complete(), [COMMENTS]: "   " }).errors).toEqual({});
  });

  it("refuses a rating outside 1 to 5", () => {
    const { errors } = validate(CANDIDATE_REVIEW, { ...complete(), [RATING_QUESTION_IDS[0]]: 6 });
    expect(errors[RATING_QUESTION_IDS[0]]).toBeTruthy();
  });

  it("refuses a rating that is not a whole number", () => {
    const { errors } = validate(CANDIDATE_REVIEW, { ...complete(), [RATING_QUESTION_IDS[0]]: 3.5 });
    expect(errors[RATING_QUESTION_IDS[0]]).toBeTruthy();
  });

  it("refuses a choice that is not one of the options", () => {
    // ClickUp would reject the option name, and WF-14 resolves names against
    // the live schema — so this has to fail here, not there
    const { errors } = validate(CANDIDATE_REVIEW, { ...complete(), [RECOMMEND]: "Maybe" });
    expect(errors[RECOMMEND]).toBeTruthy();
  });

  it("refuses a text answer over its cap", () => {
    const { errors } = validate(CANDIDATE_REVIEW, {
      ...complete(),
      [COMMENTS]: "a".repeat(2001),
    });
    expect(errors[COMMENTS]).toBeTruthy();
  });
});

describe("the progress figures", () => {
  it("counts every question on screen", () => {
    expect(askableCount(CANDIDATE_REVIEW)).toBe(20);
  });

  it("counts a blank text answer as unanswered", () => {
    // `complete()` answers the 15 required questions and none of the 5 prose
    expect(answeredCount(CANDIDATE_REVIEW, { ...complete(), [COMMENTS]: "  " })).toBe(15);
    expect(answeredCount(CANDIDATE_REVIEW, { ...complete(), [COMMENTS]: "Thanks" })).toBe(16);
  });
});

describe("overallRating", () => {
  it("is the mean of the 13 ratings, to one decimal place", () => {
    expect(overallRating(CANDIDATE_REVIEW, rated(4))).toBe(4);

    const mixed: Answers = { ...rated(4), [RATING_QUESTION_IDS[0]]: 5, [RATING_QUESTION_IDS[1]]: 5 };
    // (11 × 4 + 2 × 5) / 13 = 4.153…
    expect(overallRating(CANDIDATE_REVIEW, mixed)).toBe(4.2);
  });

  it("is null until every rating is answered", () => {
    // A mean of three answers out of thirteen is not a rating of anything,
    // and rounding it would put a confident-looking number on the page
    const partial: Answers = { [RATING_QUESTION_IDS[0]]: 5, [RATING_QUESTION_IDS[1]]: 3 };
    expect(overallRating(CANDIDATE_REVIEW, partial)).toBeNull();
    expect(overallRating(CANDIDATE_REVIEW, {})).toBeNull();
  });

  it("ignores the categorical answers entirely", () => {
    const withChoices: Answers = { ...rated(3), [HIRING_PROCESS]: "Needs improvement", [RECOMMEND]: "No" };
    expect(overallRating(CANDIDATE_REVIEW, withChoices)).toBe(3);
  });
});

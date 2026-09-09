import { describe, expect, it } from "vitest";
import {
  CANDIDATE_REVIEW,
  FREE_TEXT_REQUIRED,
  KENAFRIC_VALUES,
  RATING_QUESTION_IDS,
} from "./candidateReview";
import { allQuestions, askableSections, isFieldId, withheldQuestions } from "./schema";

/**
 * The spec is the contract with ClickUp, so it is pinned here.
 *
 * A wrong or abbreviated field id writes a real answer to the wrong field or
 * to none, and neither fails loudly — which is exactly the class of defect
 * that made V1's feedback data unusable. These tests are the only thing
 * standing between a careless edit and a silently mis-filed survey.
 */

describe("the candidate review spec", () => {
  it("serves both the external and the internal form from one spec", () => {
    // Two specs would drift the way the Airtable pair did, and the internal
    // one shipped with no form tag at all
    expect(CANDIDATE_REVIEW.formTypes).toEqual(["CRR", "ICRR"]);
  });

  it("asks the 20 questions the instrument is made of", () => {
    /**
     * Twenty, not the twenty-two the Airtable form had: the name, the email
     * and the payroll number were three of its questions and are now
     * prefilled facts. That difference IS the rebuild.
     */
    expect(allQuestions(CANDIDATE_REVIEW)).toHaveLength(20);
    expect(CANDIDATE_REVIEW.sections).toHaveLength(6);
  });

  it("numbers its sections from one, in order", () => {
    expect(CANDIDATE_REVIEW.sections.map((s) => s.ordinal)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("gives every question a unique field id", () => {
    const ids = allQuestions(CANDIDATE_REVIEW).map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("averages exactly the 13 five-star questions", () => {
    expect(CANDIDATE_REVIEW.ratingQuestions).toHaveLength(13);
    expect(CANDIDATE_REVIEW.ratingQuestions).toEqual(RATING_QUESTION_IDS);

    const stars = allQuestions(CANDIDATE_REVIEW)
      .filter((q) => q.type === "stars")
      .map((q) => q.id);
    // A categorical dropdown must never be averaged, and every star question
    // must count — the two lists have to be the same list
    expect([...stars].sort()).toEqual([...CANDIDATE_REVIEW.ratingQuestions].sort());
  });

  it("holds every rating question's id as a complete UUID", () => {
    RATING_QUESTION_IDS.forEach((id) => {
      expect(isFieldId(id), `${id} is not a complete field id`).toBe(true);
    });
  });

  it("requires every rating and every choice, and no prose", () => {
    allQuestions(CANDIDATE_REVIEW).forEach((question) => {
      if (question.type === "text") {
        expect(question.required, `${question.label} should follow FREE_TEXT_REQUIRED`).toBe(
          FREE_TEXT_REQUIRED,
        );
      } else {
        expect(question.required, `${question.label} should be required`).toBe(true);
      }
    });
  });

  it("gives every choice question its options, and no other question any", () => {
    allQuestions(CANDIDATE_REVIEW).forEach((question) => {
      if (question.type === "choice") {
        expect(question.options?.length, question.label).toBeGreaterThan(1);
      } else {
        expect(question.options, question.label).toBeUndefined();
      }
    });
  });

  it("spells out the eight Kenafric values on the question that scores them", () => {
    // The field name was truncated for ClickUp's 100-character cap and took
    // the values with it. A candidate cannot score a process against values
    // nobody has told them.
    const values = allQuestions(CANDIDATE_REVIEW).find(
      (q) => q.id === "24e6c339-bcd0-4337-bd5a-9448c7de583d",
    );
    expect(values?.help).toBe(KENAFRIC_VALUES);
    expect(KENAFRIC_VALUES.split("·")).toHaveLength(8);
  });

  it("substitutes the employing entity into the recommend question", () => {
    // G-9: the ClickUp field is named for Kenafric Industries Ltd, but the
    // hire may have been for KML, KBBL or Properties
    const recommend = allQuestions(CANDIDATE_REVIEW).find(
      (q) => q.id === "d27d7a83-c193-4173-a07a-6691b90eea4b",
    );
    expect(recommend?.label).toContain("{{company}}");
    expect(recommend?.label).not.toContain("Kenafric Industries");
  });

  it("asks nothing it cannot store", () => {
    // The standing guarantee, whatever the spec holds: anything on screen has
    // somewhere to be written. `schema.test.ts` covers the withholding itself.
    askableSections(CANDIDATE_REVIEW).forEach((section) => {
      section.questions.forEach((question) => {
        expect(isFieldId(question.id), `${question.id} is on screen but not storable`).toBe(true);
      });
    });
  });

  it("holds a complete UUID for every one of its questions", () => {
    /**
     * Four free-text ids first arrived abbreviated to eight characters and
     * were withheld until they were completed on 2026-09-09. Nothing is
     * withheld now, and this is what says so: a paste that drops half a UUID
     * fails here rather than silently removing a question from the form.
     */
    expect(withheldQuestions(CANDIDATE_REVIEW)).toEqual([]);
    allQuestions(CANDIDATE_REVIEW).forEach((question) => {
      expect(isFieldId(question.id), `${question.id} is not a complete field id`).toBe(true);
    });
  });

  it("asks all twenty questions", () => {
    const shown = askableSections(CANDIDATE_REVIEW).flatMap((s) => s.questions);
    expect(shown).toHaveLength(20);
  });

  it("renumbers the sections that survive, so the reader counts 1, 2, 3", () => {
    const shown = askableSections(CANDIDATE_REVIEW);
    expect(shown.map((s) => s.ordinal)).toEqual(shown.map((_, index) => index + 1));
    expect(shown).toHaveLength(6);
  });
});

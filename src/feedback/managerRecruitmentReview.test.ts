import { describe, expect, it } from "vitest";
import {
  MANAGER_RECRUITMENT_REVIEW as MRR,
  OPEN_FEEDBACK_REQUIRED,
  RATING_QUESTION_IDS,
  SCALE_OPTIONS,
} from "./managerRecruitmentReview";
import { allQuestions, askableSections, isFieldId, withheldQuestions } from "./schema";

/**
 * The spec is the contract with ClickUp, so it is pinned here.
 *
 * A wrong or abbreviated field id writes a real answer to the wrong field or
 * to none, and neither fails loudly. Two of these ten ids reached us
 * abbreviated to eight characters in the phase-plan audit and were completed
 * against the live list on 2026-09-10; this is what stops the next paste
 * from quietly dropping a question.
 */

describe("the manager recruitment review spec", () => {
  it("is one instrument, and not the candidate one", () => {
    expect(MRR.formTypes).toEqual(["MRR"]);
  });

  it("asks the ten questions the instrument is made of", () => {
    /**
     * Ten, not the eleven on the Airtable form: its first question asked the
     * manager to type their own name, and that is prefilled now. That
     * difference IS the rebuild.
     */
    expect(allQuestions(MRR)).toHaveLength(10);
    expect(MRR.sections).toHaveLength(3);
    expect(MRR.sections.map((s) => s.ordinal)).toEqual([1, 2, 3]);
  });

  it("gives every question a unique, complete field id", () => {
    const ids = allQuestions(MRR).map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => {
      expect(isFieldId(id), `${id} is not a complete field id`).toBe(true);
    });
    expect(withheldQuestions(MRR)).toEqual([]);
  });

  it("averages the seven scores and excludes the categorical one", () => {
    expect(MRR.ratingQuestions).toHaveLength(7);
    expect(MRR.ratingQuestions).toEqual(RATING_QUESTION_IDS);

    const scales = allQuestions(MRR)
      .filter((q) => q.type === "scale")
      .map((q) => q.id);
    expect([...scales].sort()).toEqual([...MRR.ratingQuestions].sort());

    // Improved / Stayed the same / Declined is a category. A mean of it
    // would look like a score and mean nothing.
    expect(MRR.ratingQuestions).not.toContain("adf71af4-59d2-4b52-837a-b9002a77ca0a");
  });

  it("scores on the option NAMES ClickUp actually holds", () => {
    // The live drop_down options really are named "1" to "5", so the answer
    // posted is the string "4". A number would resolve to no option at all.
    expect(SCALE_OPTIONS).toEqual(["1", "2", "3", "4", "5"]);
    allQuestions(MRR)
      .filter((q) => q.type === "scale")
      .forEach((q) => expect(q.options, q.topic).toEqual(SCALE_OPTIONS));
  });

  it("says what 1 and 5 mean on every score", () => {
    // A bare 1-5 row is five numbers, not a scale. The anchors are verbatim
    // from the V1 form, so this round stays comparable with the last one.
    allQuestions(MRR)
      .filter((q) => q.type === "scale")
      .forEach((q) => {
        expect(q.anchors?.low, q.topic).toBeTruthy();
        expect(q.anchors?.high, q.topic).toBeTruthy();
      });

    const timeliness = allQuestions(MRR).find(
      (q) => q.id === "fe49981e-1c5f-4b91-aead-834f911be43a",
    );
    expect(timeliness?.anchors).toEqual({ low: "Very inefficient", high: "Very efficient" });
  });

  it("names the ClickUp field HR reads on the report, above the question", () => {
    // Seven questions that all open "On a scale of 1-5, how…" are not
    // scannable; the topic is the field name the report is built from
    allQuestions(MRR).forEach((q) => expect(q.topic, q.label).toBeTruthy());
  });

  it("requires every score, the comparison, and both open answers", () => {
    allQuestions(MRR).forEach((question) => {
      if (question.type === "text") {
        expect(question.required, question.topic).toBe(OPEN_FEEDBACK_REQUIRED);
      } else {
        expect(question.required, question.topic).toBe(true);
      }
    });
  });

  it("holds the comparison options in ClickUp's own order", () => {
    const comparison = allQuestions(MRR).find(
      (q) => q.id === "adf71af4-59d2-4b52-837a-b9002a77ca0a",
    );
    expect(comparison?.type).toBe("choice");
    expect(comparison?.options).toEqual(["Improved", "Stayed the same", "Declined"]);
  });

  it("asks the manager for nothing Kenafric already holds", () => {
    /**
     * The whole point. `fullName` is the manager, not a candidate — one rule
     * across every instrument — and every header line is shown back rather
     * than typed.
     */
    expect(MRR.facts.map((f) => f.key)).toEqual([
      "fullName",
      "positionTitle",
      "hiresMade",
      "department",
      "company",
    ]);

    const asked = allQuestions(MRR).map((q) => q.label.toLowerCase());
    expect(asked.some((label) => label.includes("your name"))).toBe(false);
    expect(asked.some((label) => label.includes("your email"))).toBe(false);
  });

  it("tells the manager this is not an appraisal of their hire", () => {
    // A manager who thinks they are marking their new report answers a
    // different set of questions from the one they were asked
    expect(MRR.voice.privacyNote).toMatch(/not the person who was hired/i);
    expect(MRR.intro).toMatch(/not the person you hired/i);
  });

  it("asks nothing it cannot store", () => {
    askableSections(MRR).forEach((section) => {
      section.questions.forEach((question) => {
        expect(isFieldId(question.id), `${question.id} is on screen but not storable`).toBe(
          true,
        );
      });
    });
    expect(askableSections(MRR).flatMap((s) => s.questions)).toHaveLength(10);
  });
});

import { describe, expect, it } from "vitest";
import { SCALE_OPTIONS } from "./managerRecruitmentReview";
import {
  NEW_HIRE_READINESS as MNHR,
  OPEN_FEEDBACK_REQUIRED,
  RATING_QUESTION_IDS,
} from "./newHireReadiness";
import { allQuestions, askableSections, isFieldId, withheldQuestions } from "./schema";

/**
 * The spec is the contract with ClickUp, so it is pinned here.
 *
 * Four of these ten ids reached us abbreviated to eight characters in the
 * phase-plan audit and were completed against the live list on 2026-09-10.
 * An abbreviated id withholds its own question rather than filing an answer
 * nowhere — but only if somebody notices, which is what this file is for.
 */

describe("the new-hire readiness spec", () => {
  it("is one instrument, and the manager's, not the employee's", () => {
    // F5, the employee's own check-in, is a different form on the same
    // clock and is still blocked on its fourteen question texts
    expect(MNHR.formTypes).toEqual(["MNHR"]);
  });

  it("asks the ten questions the instrument is made of", () => {
    /**
     * Ten, not the fourteen on the Airtable form: manager name, candidate
     * name, job title and department were four of its questions and are
     * prefilled here.
     */
    expect(allQuestions(MNHR)).toHaveLength(10);
    expect(MNHR.sections).toHaveLength(4);
    expect(MNHR.sections.map((s) => s.ordinal)).toEqual([1, 2, 3, 4]);
  });

  it("gives every question a unique, complete field id", () => {
    const ids = allQuestions(MNHR).map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => {
      expect(isFieldId(id), `${id} is not a complete field id`).toBe(true);
    });
    expect(withheldQuestions(MNHR)).toEqual([]);
  });

  it("averages the five readiness scores plus the overall impression", () => {
    expect(MNHR.ratingQuestions).toHaveLength(6);
    expect(MNHR.ratingQuestions).toEqual(RATING_QUESTION_IDS);

    const scales = allQuestions(MNHR)
      .filter((q) => q.type === "scale")
      .map((q) => q.id);
    expect([...scales].sort()).toEqual([...MNHR.ratingQuestions].sort());

    // The overall-impression score counts; it is a 1-5 like the rest
    expect(MNHR.ratingQuestions).toContain("62ca0de5-6f17-464f-a19a-9bec86e705b0");
  });

  it("writes the overall impression to the field named for the question", () => {
    /**
     * G-8, closed. V1 filed this against `Overal Impression` — a section
     * heading, not a question. `835df2a4-…` still exists on the list and is
     * dead for this form; writing to it again would split the answer across
     * two fields.
     */
    const impression = allQuestions(MNHR).find(
      (q) => q.id === "62ca0de5-6f17-464f-a19a-9bec86e705b0",
    );
    expect(impression?.label).toBe(
      "Do you believe the new hire is ready to contribute effectively in their role?",
    );
    expect(impression?.label).not.toMatch(/impression/i);
    // The retired field, which must not come back
    expect(allQuestions(MNHR).map((q) => q.id)).not.toContain(
      "835df2a4-caa4-4dfd-a0f3-e22f52916e8c",
    );
  });

  it("scores 1 to 5 on the option names, with Poor and Excellent written on them", () => {
    allQuestions(MNHR)
      .filter((q) => q.type === "scale")
      .forEach((q) => {
        expect(q.options, q.label).toEqual(SCALE_OPTIONS);
        // Verbatim from the V1 form's own "Score (1 = Poor, 5 = Excellent)"
        expect(q.anchors, q.label).toEqual({ low: "Poor", high: "Excellent" });
      });
  });

  it("requires the scores and the three open answers, but not the last box", () => {
    const optional = allQuestions(MNHR).filter((q) => !q.required);
    // A probation record of six numbers and no sentence tells nobody why,
    // so the three substantive open questions are required
    expect(optional).toHaveLength(1);
    expect(optional[0].id).toBe("70120fb4-8691-4c62-b8a2-b1524d2ae738");
    expect(OPEN_FEEDBACK_REQUIRED).toBe(true);
  });

  it("shows the manager which new hire, and which of the two review points", () => {
    /**
     * The same manager gets this form twice about the same person, eight
     * weeks apart. Without `subjectName` a manager with four reports has to
     * guess; without `reviewPoint` the two responses collapse (G-4).
     */
    expect(MNHR.facts.map((f) => f.key)).toEqual([
      "fullName",
      "subjectName",
      "jobTitle",
      "department",
      "reviewPoint",
    ]);
  });

  it("says where a frank answer about a named colleague goes", () => {
    // The one instrument whose subject is not the person reading it. A
    // manager is entitled to know that before they write, not after.
    expect(MNHR.voice.privacyNote).toMatch(/probation record/i);
    expect(MNHR.voice.privacyNote).toMatch(/not shown to the employee/i);
  });

  it("asks nothing it cannot store", () => {
    askableSections(MNHR).forEach((section) => {
      section.questions.forEach((question) => {
        expect(isFieldId(question.id), `${question.id} is on screen but not storable`).toBe(
          true,
        );
      });
    });
    expect(askableSections(MNHR).flatMap((s) => s.questions)).toHaveLength(10);
  });
});

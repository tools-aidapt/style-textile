import { describe, expect, it } from "vitest";
import { EMPLOYEE_CHECK_IN as EEC } from "./employeeCheckIn";
import { allQuestions, askableSections, canCollect, isFieldId, withheldQuestions } from "./schema";

/**
 * Build D, before its ClickUp fields exist.
 *
 * These tests pin the *unfinished* state on purpose. The nine question
 * fields are not on list 901220480198 — verified live on 2026-09-10 — so
 * every id here is a `TBC-` placeholder and every question is withheld.
 *
 * Two things have to be true while that is the case: the form must refuse to
 * open, and nobody must be able to make it open by accident. The moment the
 * real UUIDs are pasted in, the first four tests here fail loudly and tell
 * whoever did it what else to finish — which is the point.
 */

describe("the employee check-in spec, while it is unfinished", () => {
  it("cannot collect anything, so the form does not open", () => {
    /**
     * The guard that matters. Without it the route would render a header, no
     * questions and a live Submit button, and the empty `answers` object
     * would be refused by the wire schema after somebody pressed it.
     */
    expect(canCollect(EEC)).toBe(false);
    expect(askableSections(EEC)).toEqual([]);
  });

  it("withholds every question, because not one has a real field id", () => {
    expect(withheldQuestions(EEC)).toHaveLength(9);
    allQuestions(EEC).forEach((question) => {
      expect(isFieldId(question.id), `${question.id} should still be a placeholder`).toBe(false);
      expect(question.id.startsWith("TBC-"), question.id).toBe(true);
    });
  });

  it("has no choice question that could render without its options", () => {
    /**
     * The four dropdowns' option lists are not known — the Google Form
     * screenshot shows them collapsed. An option NAME is what WF-21 resolves
     * against the live ClickUp schema, so a guessed one resolves to nothing
     * and the answer is dropped in silence.
     *
     * They are empty and the questions are withheld, so nothing renders. If
     * somebody pastes the ids in without the options, this is what tells
     * them: an askable choice with no options is a question that cannot be
     * answered.
     */
    askableSections(EEC).forEach((section) => {
      section.questions.forEach((question) => {
        if (question.type === "choice") {
          expect(question.options?.length, question.label).toBeGreaterThan(1);
        }
      });
    });
  });

  it("averages nothing, because nothing on this form is a score", () => {
    // Four categorical choices. A mean of "Partially" is a number that looks
    // like a rating and measures nothing.
    expect(EEC.ratingQuestions).toEqual([]);
    expect(allQuestions(EEC).some((q) => q.type === "scale" || q.type === "stars")).toBe(false);
  });
});

describe("the employee check-in spec, as an instrument", () => {
  it("is the employee's own, and only theirs", () => {
    expect(EEC.formTypes).toEqual(["EEC"]);
  });

  it("asks the nine questions that survive from the fourteen", () => {
    /**
     * Fourteen on the Google Form. Q1 name, Q2 payroll number, Q3 department
     * and Q4 company are prefilled instead — all four are data Kenafric
     * already holds, and a typo in any of them made a V1 response
     * unmatchable to the person who sent it. Q6, "Have you signed your Job
     * Description (JD)?", is dropped: JD signing went out of scope on
     * 2026-08-25.
     */
    expect(allQuestions(EEC)).toHaveLength(9);
    expect(EEC.sections).toHaveLength(3);

    const asked = allQuestions(EEC).map((q) => q.label.toLowerCase());
    expect(asked.some((label) => label.includes("job description"))).toBe(false);
    expect(asked.some((label) => label.includes("payroll"))).toBe(false);
    expect(asked.some((label) => label.includes("employee name"))).toBe(false);
  });

  it("shows the four prefilled facts and which check-in this is", () => {
    // Six sends of the same nine questions. Without `reviewPoint` an
    // employee has no way to judge what a fair answer even looks like.
    expect(EEC.facts.map((f) => f.key)).toEqual([
      "fullName",
      "payroll",
      "department",
      "company",
      "reviewPoint",
    ]);
  });

  it("requires the four choices and no prose", () => {
    allQuestions(EEC).forEach((question) => {
      expect(question.required, question.label).toBe(question.type === "choice");
    });
  });

  it("does not imply the answers are anonymous", () => {
    /**
     * The response is linked to the employee record, and the form prefills
     * their payroll number — implying anonymity would be a lie the form
     * itself makes obvious. It says who reads it and what happens next
     * instead.
     */
    expect(EEC.voice.privacyNote).toMatch(/not anonymous/i);
    // Nothing anywhere in the layer should promise confidentiality it cannot
    // keep, and this is the one form where somebody might expect it
    expect(EEC.voice.privacyNote).not.toMatch(/confidential/i);
  });
});

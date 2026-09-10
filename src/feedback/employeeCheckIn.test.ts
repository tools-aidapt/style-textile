import { describe, expect, it } from "vitest";
import { EMPLOYEE_CHECK_IN as EEC } from "./employeeCheckIn";
import { allQuestions, askableSections, canCollect, isFieldId, withheldQuestions } from "./schema";

/**
 * The spec is the contract with ClickUp, so it is pinned here.
 *
 * The nine fields were created on 2026-09-10 and the ids and option lists
 * below were read live the same day. This build's specific hazard is the
 * option NAMES: WF-21 resolves them against the live schema, so a paraphrase
 * resolves to nothing and the answer is dropped with no error anywhere — and
 * the four lists are four different shapes, one of which says `Sometimes`
 * where another says `Partially`.
 */

describe("the employee check-in spec is finished and storable", () => {
  it("can collect, so the form actually opens", () => {
    // `canCollect` is what kept this route shut while the fields did not
    // exist. It has to be true now, or the form silently stays closed.
    expect(canCollect(EEC)).toBe(true);
    expect(askableSections(EEC)).toHaveLength(3);
    expect(askableSections(EEC).flatMap((s) => s.questions)).toHaveLength(9);
  });

  it("gives every question a unique, complete field id", () => {
    const ids = allQuestions(EEC).map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => {
      expect(isFieldId(id), `${id} is not a complete field id`).toBe(true);
    });
    expect(withheldQuestions(EEC)).toEqual([]);
  });

  it("carries each dropdown's live option names, verbatim and in order", () => {
    /**
     * Four questions, four different lists. Q7 offers `Partially` and Q9
     * offers `Sometimes`; swapping them posts a name ClickUp cannot resolve.
     * None of these was guessable from the question text, which is why the
     * build waited for them.
     */
    const optionsOf = (id: string) => allQuestions(EEC).find((q) => q.id === id)?.options;

    expect(optionsOf("f8846fd7-f9aa-4323-b203-ce05651c7e9c")).toEqual([
      "Very Good",
      "Good",
      "Fair",
      "Poor",
    ]);
    expect(optionsOf("9a1a419e-688b-498c-b19e-3c33d4dad339")).toEqual([
      "Yes",
      "Partially",
      "No",
    ]);
    expect(optionsOf("a4419c28-bc18-4f19-85b5-72fceedd787c")).toEqual([
      "Yes",
      "Sometimes",
      "No",
    ]);
    expect(optionsOf("39bbd4ec-28fe-4658-8d1a-3c509392a077")).toEqual(["Yes", "No"]);
  });

  it("leaves no choice question unanswerable", () => {
    allQuestions(EEC).forEach((question) => {
      if (question.type === "choice") {
        expect(question.options?.length, question.label).toBeGreaterThan(1);
      } else {
        expect(question.options, question.label).toBeUndefined();
      }
    });
  });

  it("averages nothing, because nothing on this form is a score", () => {
    // Four categorical choices. A mean of "Partially" is a number that looks
    // like a rating and measures nothing, and a zero written into Overall
    // Rating would drag every average on the report.
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
    /**
     * The JD field WAS created in ClickUp on 2026-09-10
     * (`0562bc83-…`, Yes/No), but the question stays dropped: JD signing went
     * out of scope on 2026-08-25 and a field existing is not a decision to
     * reverse that. Adding it back is one entry in `SECTIONS`.
     */
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

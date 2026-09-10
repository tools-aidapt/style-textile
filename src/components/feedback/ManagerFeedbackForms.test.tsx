import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { routeFetch } from "@/test/fetchRouter";
import { MANAGER_RECRUITMENT_REVIEW } from "@/feedback/managerRecruitmentReview";
import { NEW_HIRE_READINESS } from "@/feedback/newHireReadiness";
import { allQuestions, type FeedbackFormSpec } from "@/feedback/schema";
import { parseContext, type FeedbackContext } from "@/feedback/session";
import { FeedbackForm } from "./FeedbackForm";

/**
 * Builds B and C, as a manager meets them.
 *
 * The specs are pinned in `src/feedback/*.test.ts`; this covers the four
 * things only the rendered form can be wrong about — that a 1-5 score is a
 * row of real radios with its anchors attached rather than V1's blank
 * dropdown, that the header names the right person on each form, that the
 * score reaches the wire as the option NAME, and that the rating averages
 * the right questions.
 */

const TOKEN = "eyJmdCI6Ik1SUiIsInBpZCI6Ijg2OWV0YzA4NSJ9.dGVzdC1zaWduYXR1cmUtbm90LXJlYWw";
const SUBMIT = "kenafric-wf21";

const managerContext = (): FeedbackContext =>
  parseContext({
    ok: true,
    formType: "MRR",
    alreadySubmitted: false,
    prefill: {
      fullName: "Peter Njoroge",
      email: "peter.njoroge.sample@example.com",
      positionTitle: "Sales Operations Coordinator",
      hiresMade: "2 of 2",
      company: "Kenafric Manufacturing Limited",
      department: "Sales & Distribution",
    },
  })!;

const readinessContext = (reviewPoint = "Month 1"): FeedbackContext =>
  parseContext({
    ok: true,
    formType: "MNHR",
    alreadySubmitted: false,
    prefill: {
      fullName: "Peter Njoroge",
      email: "peter.njoroge.sample@example.com",
      subjectName: "Grace Wanjiru",
      jobTitle: "Sales Operations Coordinator",
      company: "Kenafric Manufacturing Limited",
      department: "Sales & Distribution",
      reviewPoint,
    },
  })!;

const bodyOf = (mock: ReturnType<typeof routeFetch>) => {
  const call = mock.mock.calls.find(([url]) => String(url).includes(SUBMIT));
  return JSON.parse(String((call?.[1] as RequestInit).body));
};

type User = ReturnType<typeof userEvent.setup>;

/** A complete response: every score 4, every choice and every prose answer. */
const answerEverything = async (user: User, spec: FeedbackFormSpec) => {
  for (const question of allQuestions(spec)) {
    if (question.type === "scale") {
      // Ambiguous by name alone — five of them say "4 out of 5" — so each
      // is taken from its own group
      const group = screen.getByRole("group", { name: new RegExp(escape(question.label)) });
      const option = Array.from(group.querySelectorAll<HTMLInputElement>("input")).find(
        (input) => input.value === "4",
      )!;
      await user.click(option);
    } else if (question.type === "choice") {
      await user.click(screen.getByRole("radio", { name: question.options![0] }));
    } else if (question.required) {
      await user.type(
        screen.getByRole("textbox", { name: new RegExp(escape(question.label)) }),
        "A real answer.",
      );
    }
  }
};

/** The question text goes into a RegExp, and it is full of ( ) ? and . */
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("Build B · the manager recruitment review", () => {
  it("shows the manager what Kenafric already knows instead of asking", () => {
    // The Airtable form's first question asked the manager to type their own
    // name. That one line is the whole rebuild.
    render(<FeedbackForm token={TOKEN} context={managerContext()} spec={MANAGER_RECRUITMENT_REVIEW} />);

    expect(screen.getByText("Peter Njoroge")).toBeInTheDocument();
    expect(screen.getByText("Sales Operations Coordinator")).toBeInTheDocument();
    // The context that makes "quality of candidate pool" answerable
    expect(screen.getByText("2 of 2")).toBeInTheDocument();
    expect(screen.queryByLabelText(/manager full name/i)).not.toBeInTheDocument();
  });

  it("renders a score as five visible options, not V1's blank dropdown", () => {
    render(<FeedbackForm token={TOKEN} context={managerContext()} spec={MANAGER_RECRUITMENT_REVIEW} />);

    // 7 scores × 5, plus the 3 comparison options
    expect(screen.getAllByRole("radio")).toHaveLength(7 * 5 + 3);
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
  });

  it("attaches each end of the scale to the number it anchors", () => {
    render(<FeedbackForm token={TOKEN} context={managerContext()} spec={MANAGER_RECRUITMENT_REVIEW} />);

    // Printed for everyone, and carried into the accessible name of the end
    // options so a screen reader is not read "1, 2, 3, 4, 5"
    expect(screen.getByText("Very inefficient")).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "1 out of 5 — Very inefficient" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "5 out of 5 — Very efficient" }),
    ).toBeInTheDocument();
  });

  it("keeps the ClickUp field name beside the question it scores", () => {
    // Seven questions all opening "On a scale of 1-5, how…" are not
    // scannable, and the topic is what HR reads on the report
    render(<FeedbackForm token={TOKEN} context={managerContext()} spec={MANAGER_RECRUITMENT_REVIEW} />);
    expect(screen.getByText("Quality of candidate pool")).toBeInTheDocument();
    expect(screen.getByText("Decision-making process")).toBeInTheDocument();
  });

  it("sends each score as the option NAME, and averages the seven", async () => {
    const user = userEvent.setup();
    const mock = routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    render(<FeedbackForm token={TOKEN} context={managerContext()} spec={MANAGER_RECRUITMENT_REVIEW} />);

    await answerEverything(user, MANAGER_RECRUITMENT_REVIEW);
    await user.click(screen.getByRole("button", { name: /send my feedback/i }));

    await waitFor(() => expect(mock).toHaveBeenCalled());
    const body = bodyOf(mock);

    expect(body.formType).toBe("MRR");
    // The string "4", not the number 4: the live option is NAMED "4", and a
    // number would resolve to no option at all
    expect(body.answers["9504832d-2815-422e-a036-4c66e2eaaece"]).toBe("4");
    expect(body.answers["adf71af4-59d2-4b52-837a-b9002a77ca0a"]).toBe("Improved");
    expect(body.answers["674d4bc9-6b4f-4038-8241-e772c4bcf0c7"]).toBe("A real answer.");

    // Every score was 4, and the categorical comparison is excluded
    expect(await screen.findByText(/rated this recruitment round 4 out of 5/i)).toBeInTheDocument();
  });

  it("shows the endpoint's warning banner, and only when there is one", () => {
    /**
     * The only warning that exists means n8n is in TEST_MODE and is not
     * enforcing token signatures — a hand-made link opens any employee's
     * form. Shown to everybody rather than logged in dev, because it has to
     * be noticed and switched off before a real link goes out.
     */
    const warned = parseContext({
      ok: true,
      formType: "MRR",
      alreadySubmitted: false,
      warn: "TEST_MODE is on: token signatures are not being checked.",
      prefill: { fullName: "Peter Njoroge", email: "peter.njoroge.sample@example.com" },
    })!;

    const { unmount } = render(
      <FeedbackForm token={TOKEN} context={warned} spec={MANAGER_RECRUITMENT_REVIEW} />,
    );
    expect(screen.getByText(/TEST_MODE is on/)).toBeInTheDocument();
    unmount();

    render(<FeedbackForm token={TOKEN} context={managerContext()} spec={MANAGER_RECRUITMENT_REVIEW} />);
    expect(screen.queryByText(/TEST_MODE/)).not.toBeInTheDocument();
  });

  it("does not send an incomplete review", async () => {
    const user = userEvent.setup();
    const mock = routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    render(<FeedbackForm token={TOKEN} context={managerContext()} spec={MANAGER_RECRUITMENT_REVIEW} />);

    await user.click(screen.getByRole("button", { name: /send my feedback/i }));

    // All ten are required on this form
    expect(await screen.findAllByText("Please answer this")).toHaveLength(10);
    expect(mock).not.toHaveBeenCalled();
  });
});

describe("Build C · the new-hire readiness review", () => {
  it("names both people, and which of the two review points this is", () => {
    /**
     * The manager and the new hire are two different names on one header,
     * and the same manager receives this form twice about the same person
     * eight weeks apart. Guessing either is an answer filed against the
     * wrong person or the wrong month.
     */
    render(<FeedbackForm token={TOKEN} context={readinessContext()} spec={NEW_HIRE_READINESS} />);

    expect(screen.getByText("Peter Njoroge")).toBeInTheDocument();
    expect(screen.getByText("Grace Wanjiru")).toBeInTheDocument();
    expect(screen.getByText("Month 1")).toBeInTheDocument();
  });

  it("tells the manager the answers form part of a probation record", () => {
    // The one form whose subject is not the person reading it
    render(<FeedbackForm token={TOKEN} context={readinessContext()} spec={NEW_HIRE_READINESS} />);
    expect(screen.getByText(/probation record/i)).toBeInTheDocument();
  });

  it("asks the real question rather than the field's name", () => {
    render(<FeedbackForm token={TOKEN} context={readinessContext()} spec={NEW_HIRE_READINESS} />);
    expect(
      screen.getByText(/ready to contribute effectively in their role/i),
    ).toBeInTheDocument();
    // G-8: `Overal Impression` is the ClickUp field name and a section
    // heading, not something to put to a manager
    expect(screen.queryByText(/overal impression/i)).not.toBeInTheDocument();
  });

  it("averages the five readiness scores and the overall impression", async () => {
    const user = userEvent.setup();
    const mock = routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    render(<FeedbackForm token={TOKEN} context={readinessContext()} spec={NEW_HIRE_READINESS} />);

    await answerEverything(user, NEW_HIRE_READINESS);
    await user.click(screen.getByRole("button", { name: /send my feedback/i }));

    await waitFor(() => expect(mock).toHaveBeenCalled());
    expect(bodyOf(mock).formType).toBe("MNHR");
    expect(bodyOf(mock).answers["62ca0de5-6f17-464f-a19a-9bec86e705b0"]).toBe("4");
    expect(await screen.findByText(/rated their overall readiness 4 out of 5/i)).toBeInTheDocument();
  });

  it("lets the last comments box be left empty, and omits it rather than sending nothing", async () => {
    const user = userEvent.setup();
    const mock = routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    render(<FeedbackForm token={TOKEN} context={readinessContext()} spec={NEW_HIRE_READINESS} />);

    await answerEverything(user, NEW_HIRE_READINESS);
    await user.click(screen.getByRole("button", { name: /send my feedback/i }));

    await waitFor(() => expect(mock).toHaveBeenCalled());
    // "Skipped" and "answered nothing" report differently, and an empty
    // string is a value ClickUp will happily write
    expect(bodyOf(mock).answers).not.toHaveProperty("70120fb4-8691-4c62-b8a2-b1524d2ae738");
  });
});

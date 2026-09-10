import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { routeFetch } from "@/test/fetchRouter";
import { CANDIDATE_REVIEW, RATING_QUESTION_IDS } from "@/feedback/candidateReview";
import { parseContext, type FeedbackContext } from "@/feedback/session";
import { FeedbackForm } from "./FeedbackForm";

/**
 * The form's own behaviour, as a candidate meets it.
 *
 * The model layer is tested in `src/feedback/*.test.ts`; this covers the four
 * things only the rendered form can be wrong about — that it never asks for
 * something Kenafric already holds, that the internal variant shows a payroll
 * number and the external one does not, that an incomplete response cannot be
 * sent, and that what reaches the wire is what was clicked.
 */

const TOKEN = "eyJmdCI6IkNSUiIsImNpZCI6Ijg2OWV2cm1oeCJ9.dGVzdC1zaWduYXR1cmUtbm90LXJlYWw";
const SUBMIT = "kenafric-wf21";

const context = (
  formType: "CRR" | "ICRR" = "CRR",
  overrides: Record<string, unknown> = {},
): FeedbackContext =>
  parseContext({
    ok: true,
    formType,
    alreadySubmitted: false,
    prefill: {
      fullName: "Amina Otieno",
      email: "amina.otieno.sample@example.com",
      payroll: formType === "ICRR" ? "KIL-04182" : null,
      positionTitle: "Sales Operations Coordinator",
      company: "Kenafric Biscuits Limited",
      department: "Sales & Distribution",
      recruitmentType: "External Recruitment",
      ...overrides,
    },
  })!;

const renderForm = (formType: "CRR" | "ICRR" = "CRR") =>
  render(<FeedbackForm token={TOKEN} context={context(formType)} spec={CANDIDATE_REVIEW} />);

type User = ReturnType<typeof userEvent.setup>;

/** Every rating and both required choices — a response that may be sent. */
const answerEverything = async (user: User) => {
  const groups = screen.getAllByRole("radio", { name: "4 out of 5" });
  for (const star of groups) await user.click(star);

  await user.click(screen.getByRole("radio", { name: "Easy and engaging" }));
  await user.click(screen.getByRole("radio", { name: "Yes" }));
};

const bodyOf = (mock: ReturnType<typeof routeFetch>) => {
  const call = mock.mock.calls.find(([url]) => String(url).includes(SUBMIT));
  return JSON.parse(String((call?.[1] as RequestInit).body));
};

describe("FeedbackForm", () => {
  it("shows what Kenafric already knows instead of asking for it", () => {
    renderForm();

    // V1's forms asked for all five of these, and a typo made the response
    // unmatchable to a candidate record for ever
    expect(screen.getByText("Amina Otieno")).toBeInTheDocument();
    expect(screen.getByText("amina.otieno.sample@example.com")).toBeInTheDocument();
    expect(screen.getByText("Sales Operations Coordinator")).toBeInTheDocument();
    expect(screen.getByText("Sales & Distribution")).toBeInTheDocument();

    // And no control anywhere near any of them
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });

  it("shows a payroll number to an internal applicant and to nobody else", () => {
    // The defect carried straight over from Airtable: the internal form was a
    // second copy, and it shipped with no form tag at all
    const { unmount } = renderForm("CRR");
    expect(screen.queryByText(/payroll/i)).not.toBeInTheDocument();
    unmount();

    renderForm("ICRR");
    expect(screen.getByText(/payroll/i)).toBeInTheDocument();
    expect(screen.getByText("KIL-04182")).toBeInTheDocument();
  });

  it("names the entity the candidate actually interviewed with", () => {
    // G-9. The ClickUp field is named for Kenafric Industries Ltd
    renderForm();
    expect(
      screen.getByText(/Would you recommend Kenafric Biscuits Limited/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\{\{company\}\}/)).not.toBeInTheDocument();
  });

  it("spells out the eight values on the question that scores them", () => {
    // G-7. The field name was truncated and took the values with it
    renderForm();
    expect(
      screen.getByText(/Kinetic · Execute · Nimble · Ambitious · Fun · Robust · Innovative · Caring/),
    ).toBeInTheDocument();
  });

  it("asks all twenty questions, each with somewhere to answer it", () => {
    renderForm();

    // The five free-text questions. Four of these were withheld until their
    // ClickUp ids were completed — asking and then dropping the answer is the
    // V1 failure this phase exists to undo.
    expect(screen.getByLabelText(/impressed you the most/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/What could we improve/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/products and culture/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/moments during the process/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Any additional comments or suggestions/i)).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(5);

    // 13 ratings × 5 stars, plus 4 + 2 choice options
    expect(screen.getAllByRole("radio")).toHaveLength(13 * 5 + 6);

    // Nothing is withheld, so the development notice is not on the page
    expect(screen.queryByText(/withheld in this build/i)).not.toBeInTheDocument();
  });

  it("does not send an incomplete response, and says how much is left", async () => {
    const user = userEvent.setup();
    const mock = routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    renderForm();

    await user.click(screen.getByRole("button", { name: /send my feedback/i }));

    expect(await screen.findByText(/questions still need an answer/i)).toBeInTheDocument();
    expect(mock).not.toHaveBeenCalled();
  });

  it("shows an error on the question, not on every question at once", async () => {
    const user = userEvent.setup();
    routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    renderForm();

    // Nothing is complained about before a submit is attempted: telling
    // somebody their answer is wrong before they have given it is noise
    expect(screen.queryByText("Please answer this")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /send my feedback/i }));
    // 20 questions on screen, 15 of them required
    expect(await screen.findAllByText("Please answer this")).toHaveLength(15);
  });

  it("sends the answers keyed by ClickUp field id, and only those", async () => {
    const user = userEvent.setup();
    const mock = routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    renderForm();

    await answerEverything(user);
    await user.click(screen.getByRole("button", { name: /send my feedback/i }));

    await waitFor(() => expect(mock).toHaveBeenCalled());
    const body = bodyOf(mock);

    expect(Object.keys(body).sort()).toEqual(["answers", "formType", "submittedAt", "t"]);
    expect(body.t).toBe(TOKEN);
    expect(body.answers[RATING_QUESTION_IDS[0]]).toBe(4);
    // An option NAME, for WF-21 to resolve against the live schema
    expect(body.answers["9a21e6ae-5493-47a9-9ab1-87d6002216eb"]).toBe("Easy and engaging");
    // The optional comment was left blank, so it is absent rather than ""
    expect(body.answers).not.toHaveProperty("f7994a03-2a34-4623-8fa6-065a3fddaf8c");
  });

  it("tags an internal response as internal", async () => {
    const user = userEvent.setup();
    const mock = routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    renderForm("ICRR");

    await answerEverything(user);
    await user.click(screen.getByRole("button", { name: /send my feedback/i }));

    await waitFor(() => expect(mock).toHaveBeenCalled());
    expect(bodyOf(mock).formType).toBe("ICRR");
  });

  it("thanks the candidate and shows the rating back", async () => {
    const user = userEvent.setup();
    routeFetch([{ match: SUBMIT, body: { ok: true } }]);
    renderForm();

    await answerEverything(user);
    await user.click(screen.getByRole("button", { name: /send my feedback/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/thank you/i);
    expect(screen.getByText(/rated your overall experience 4 out of 5/i)).toBeInTheDocument();
  });

  it("treats an idempotent replay as the success it is", async () => {
    const user = userEvent.setup();
    // The token is single-use, so WF-21 answers 409 for a response already
    // filed. The candidate's answers are in ClickUp; showing them a failure
    // would have them email HR about a survey that went through.
    routeFetch([{ match: SUBMIT, status: 409, body: { ok: false } }]);
    renderForm();

    await answerEverything(user);
    await user.click(screen.getByRole("button", { name: /send my feedback/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/thank you/i);
  });

  it("keeps the answers on screen when the send fails", async () => {
    const user = userEvent.setup();
    routeFetch([{ match: SUBMIT, status: 502, body: {} }]);
    renderForm();

    await answerEverything(user);
    await user.click(screen.getByRole("button", { name: /send my feedback/i }));

    expect(await screen.findByText(/did not send/i)).toBeInTheDocument();
    // Nothing was lost, and the button is live again for a retry
    expect(screen.getByRole("radio", { name: "Yes" })).toBeChecked();
    expect(screen.getByRole("button", { name: /send my feedback/i })).toBeEnabled();
  });
});

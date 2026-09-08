import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationForm } from "./ApplicationForm";
import type { Position } from "./position";

const position: Position = { id: "abc123", name: "AI Operations Lead" };

/** Fills every text field with something valid, leaving one to be overridden. */
const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<Record<string, string>> = {},
) => {
  const values: Record<string, string> = {
    "Full name": "Aisha Khan",
    Email: "aisha@example.com",
    Mobile: "300 000 0000",
    "Current or last salary": "150,000",
    "Expected salary": "200000",
    "Notice period": "30",
    "Current or last benefits": "Medical cover and provident fund",
    ...overrides,
  };

  for (const [label, value] of Object.entries(values)) {
    const field = screen.getByLabelText(new RegExp(`^${label}`, "i"));
    await user.clear(field);
    if (value) await user.type(field, value);
  }
};

/**
 * Typing is done without the inter-keystroke delay. This form re-renders on
 * every keystroke to drive its progress meter, so a seven-field fill at the
 * default delay was pushing the whole test past the 5s timeout once the suite
 * ran under load.
 */
const submit = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: /submit application/i }));

describe("ApplicationForm validation", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("accepts a normally spaced national mobile number", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ApplicationForm position={position} />);

    await fillForm(user, { Mobile: "712 345 678" });
    await submit(user);

    // It fails on the missing resume, not on the phone number
    await waitFor(() =>
      expect(screen.queryByText(/at least 6 digits/i)).not.toBeInTheDocument(),
    );
    expect(screen.queryByText(/digits, spaces/i)).not.toBeInTheDocument();
  });

  it("rejects a mobile number with too few digits", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ApplicationForm position={position} />);

    await fillForm(user, { Mobile: "12345" });
    await submit(user);

    expect(await screen.findByText(/at least 6 digits/i)).toBeInTheDocument();
  });

  it("keeps the country code out of the number field, where it now has its own", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ApplicationForm position={position} />);

    await fillForm(user, { Mobile: "+254 712 345 678" });
    await submit(user);

    expect(await screen.findByText(/digits, spaces, and \( \) - only/i)).toBeInTheDocument();
  });

  it("defaults the country code to Kenya and the salary currency to shillings", () => {
    render(<ApplicationForm position={position} />);

    expect(screen.getByLabelText(/country code/i)).toHaveTextContent("+254");
    expect(screen.getByLabelText(/salary currency/i)).toHaveTextContent("KES");
  });

  it("rejects a salary written as a word", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ApplicationForm position={position} />);

    await fillForm(user, { "Expected salary": "negotiable" });
    await submit(user);

    expect(await screen.findByText(/without words/i)).toBeInTheDocument();
  });

  it("rejects a notice period that is not a whole number of days", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ApplicationForm position={position} />);

    await fillForm(user, { "Notice period": "two months" });
    await submit(user);

    expect(await screen.findByText(/whole number of days/i)).toBeInTheDocument();
  });

  it("rejects an implausible notice period", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ApplicationForm position={position} />);

    await fillForm(user, { "Notice period": "9999" });
    await submit(user);

    expect(await screen.findByText(/365 days or fewer/i)).toBeInTheDocument();
  });

  it("rejects an invalid email address", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ApplicationForm position={position} />);

    await fillForm(user, { Email: "aisha@" });
    await submit(user);

    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
  });

  it("never posts an application while any field is invalid", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ApplicationForm position={position} />);

    await fillForm(user, { "Current or last salary": "" });
    await submit(user);

    await waitFor(() => expect(screen.getByText(/please enter your/i)).toBeInTheDocument());
    expect(fetch).not.toHaveBeenCalled();
  });

  it("hides the honeypot from people while leaving it in the DOM for bots", () => {
    const { container } = render(<ApplicationForm position={position} />);
    const honeypot = container.querySelector("#companyWebsite");

    expect(honeypot).toBeInTheDocument();
    expect(honeypot).not.toBeVisible();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
  });
});

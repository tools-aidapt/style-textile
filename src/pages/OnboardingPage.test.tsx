import { PDFDocument } from "pdf-lib";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeFetch } from "@/test/fetchRouter";
import { DOCUMENTS } from "@/onboarding/documents";
import { nairobiDate } from "@/onboarding/filename";
import type { OnboardingSubmission } from "@/onboarding/contract";
import OnboardingPage from "./OnboardingPage";

/**
 * The page's own job: exchange the ClickUp Employee id in the URL for that one
 * employee's details, or render a dead end; then take the documents up as they
 * are ready and file a submission that names the right ClickUp field for each.
 */

const EMPLOYEE_ID = "869evrmhx";

/** Built from the same clock the app uses, so this does not fail tomorrow. */
const EXPECTED_FILENAME = `869evrmhx_kra-pin_wahito-stephen_${nairobiDate()}.pdf`;

/** Everything Section D would ask for, minus the one the test uploads. */
const ALL_KEYS = [...DOCUMENTS.map((spec) => spec.key), "passport-photo" as const];

const sessionBody = (overrides: Record<string, unknown> = {}) => ({
  ok: true,
  employee: {
    clickupTaskId: "869evrmhx",
    fullName: "Stephen Gachoka Wahito",
    personalEmail: "stephen.wahito@gmail.com",
    joiningDate: "2026-10-01",
    positionTitle: "Production Supervisor",
    company: "Kenafric Industries",
  },
  requiredDocuments: [],
  optionalDocuments: [],
  // Everything already on file except the one document the test adds, so the
  // submit path can be exercised without a browser to decode a photograph in
  alreadyReceived: ALL_KEYS.filter((key) => key !== "kra-pin"),
  manifest: [],
  expiresAt: "2026-09-29T00:00:00.000Z",
  ...overrides,
});

/**
 * The submit uses XHR, for upload progress. jsdom ships one but it wants a
 * real server, so this records the FormData it was handed — which is exactly
 * what the assertions below want to read.
 */
const stubSubmit = ({
  status = 201,
  body = { ok: true, submissionId: "x", taskId: "869abc" },
} = {}) => {
  const sent: FormData[] = [];

  class FakeUpload {
    listeners = new Map<string, (event: unknown) => void>();
    addEventListener(type: string, callback: (event: unknown) => void) {
      this.listeners.set(type, callback);
    }
  }

  class FakeXhr {
    upload = new FakeUpload();
    status = status;
    timeout = 0;
    responseText = JSON.stringify(body);
    private handlers = new Map<string, (() => void)[]>();

    open() {}
    setRequestHeader() {}
    addEventListener(type: string, callback: () => void) {
      this.handlers.set(type, [...(this.handlers.get(type) ?? []), callback]);
    }
    send(form: FormData) {
      sent.push(form);
      // Halfway, then done, so the progress bar is exercised rather than
      // skipped straight past
      this.upload.listeners.get("progress")?.({ lengthComputable: true, loaded: 5, total: 10 });
      setTimeout(() => {
        this.upload.listeners.get("progress")?.({ lengthComputable: true, loaded: 10, total: 10 });
        this.handlers.get("load")?.forEach((handler) => handler());
      }, 0);
    }
  }

  vi.stubGlobal("XMLHttpRequest", FakeXhr);
  return sent;
};

const pdfFile = async (name: string): Promise<File> => {
  const document = await PDFDocument.create();
  document.addPage([595.28, 841.89]);
  const bytes = await document.save();
  return new File([bytes.slice().buffer], name, { type: "application/pdf" });
};

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[`/onboarding/${EMPLOYEE_ID}`]}>
      <QueryClientProvider client={client}>
        <Routes>
          <Route path="/onboarding/:employeeId" element={<OnboardingPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

describe("OnboardingPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("asks the session endpoint for the id in the URL", async () => {
    const fetchMock = routeFetch([{ match: "onboarding-session", body: sessionBody() }]);
    renderPage();

    await screen.findByLabelText(/Full name/i);
    const url = String(fetchMock.mock.calls[0][0]);
    // `?id=` is the parameter name, and it has to match the n8n Webhook node
    expect(url).toContain(`?id=${EMPLOYEE_ID}`);
  });

  it("renders a dead end and nothing else for an id nobody answers to", async () => {
    routeFetch([{ match: "onboarding-session", status: 404, body: { ok: false } }]);
    renderPage();

    expect(await screen.findByText(/We can't open this form/i)).toBeInTheDocument();
    expect(screen.getByText(/Ask HR to send you a new one/i)).toBeInTheDocument();

    // No form, no field list, and — the point — no name. A ClickUp id is
    // short and enumerable, so the screen behind it must give nothing away.
    expect(screen.queryByLabelText(/Full name/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Wahito/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bank name and branch/i)).not.toBeInTheDocument();
  });

  it("refuses to call anything at all when the URL carries no id", async () => {
    const fetchMock = routeFetch([{ match: "onboarding-session", body: sessionBody() }]);
    render(
      <MemoryRouter initialEntries={["/onboarding"]}>
        <QueryClientProvider
          client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
        >
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/This link isn't complete/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  /** Pasting rather than typing: this form re-validates on every change, and
   *  a hundred simulated keystrokes is a hundred renders of nothing useful. */
  const fill = async (
    user: ReturnType<typeof userEvent.setup>,
    /** An exact string where a loose one would also match a button's label. */
    label: RegExp | string,
    text: string,
  ) => {
    await user.click(screen.getByLabelText(label));
    await user.paste(text);
  };

  it("prepares a document, then sends it with the payload in one request", async () => {
    const sent = stubSubmit();
    routeFetch([{ match: "onboarding-session", body: sessionBody() }]);

    const user = userEvent.setup();
    renderPage();

    // The details the record already holds arrive pre-filled and editable
    const name = await screen.findByLabelText(/Full name/i);
    expect(name).toHaveValue("Stephen Gachoka Wahito");
    expect(screen.getByLabelText(/Personal email/i)).toHaveValue("stephen.wahito@gmail.com");
    // A4 - the trust anchor, so an unexpected link asking for bank details
    // can prove it is genuinely theirs
    expect(screen.getByText("Production Supervisor")).toBeInTheDocument();
    expect(screen.getByText(/1 October 2026/)).toBeInTheDocument();

    await fill(user, /Mobile number/i, "0712 345 678");
    // The country is a separate control, defaulted to Kenya
    expect(screen.getByRole("combobox", { name: /Country code/i })).toHaveValue("KE");
    await fill(user, /Home address/i, "House 14, Kiambu Road, Runda, Nairobi");
    await fill(user, /Bank name and branch/i, "Equity Bank, Thika Road branch");
    await fill(user, /^Account name/, "Stephen G Wahito");
    await fill(user, /^Account number/, "0110 1234 56789");
    await user.click(screen.getByRole("radio", { name: "Cleared Loan" }));

    // The one document not already on file
    const input = document.getElementById("document-kra-pin-input") as HTMLInputElement;
    await user.upload(input, await pdfFile("iTax.pdf"));

    // Compressed, named and held - on the tile and in the review list - but
    // nothing has left the browser yet
    await waitFor(() => expect(screen.getAllByText(EXPECTED_FILENAME)).toHaveLength(2));
    expect(screen.getByText(/ready to send/)).toBeInTheDocument();
    expect(sent).toHaveLength(0);

    // Consent is never pre-ticked and never implied by submitting
    const consent = screen.getByRole("checkbox", { name: /I confirm these documents are mine/i });
    expect(consent).not.toBeChecked();
    await user.click(consent);

    // A-4 - the test PDF is a kilobyte, which is exactly the "very small
    // file" case. It warns, and lets the employee carry on once they say so.
    await user.click(screen.getByRole("checkbox", { name: /checked this/i }));

    await user.click(screen.getByRole("button", { name: /^Submit$/i }));

    await waitFor(() => expect(sent).toHaveLength(1));
    const request = sent[0];

    // One request: the JSON in `payload`, the document in `file0`
    const payload = JSON.parse(String(request.get("payload"))) as OnboardingSubmission;
    const file = request.get("file0") as File;
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe(EXPECTED_FILENAME);

    expect(payload.employee).toEqual({ clickupTaskId: EMPLOYEE_ID });
    expect(payload.personal.mobile).toBe("+254712345678");
    expect(payload.bank.helbLoanStatus).toBe("Cleared Loan");
    // Two fields on screen, three values on the wire, spaces gone
    expect(payload.bank.accountName).toBe("Stephen G Wahito");
    expect(payload.bank.accountNumber).toBe("0110123456789");
    expect(payload.consent.given).toBe(true);
    expect(payload.advisoriesAcknowledged).toContain("A-4");

    // The manifest names the part carrying the bytes, and the field WF-15
    // pairs on - byte for byte
    expect(payload.documents).toHaveLength(1);
    expect(payload.documents[0]).toMatchObject({
      documentKey: "kra-pin",
      clickupFieldName: "KRA PIN",
      field: "file0",
      status: "attached",
    });

    // And the employee is told what happens next, with no ClickUp link - they
    // have no account, and a link they cannot open reads as a broken system
    expect(await screen.findByText(/everything we needed/i)).toBeInTheDocument();
    expect(screen.getByText(/You start on Thursday, 1 October 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/clickup/i)).not.toBeInTheDocument();
  }, 30_000);

  it("composes the country and the number into one E.164 value", async () => {
    const sent = stubSubmit();
    routeFetch([{ match: "onboarding-session", body: sessionBody({ alreadyReceived: ALL_KEYS }) }]);

    const user = userEvent.setup();
    renderPage();
    await screen.findByLabelText(/Full name/i);

    await user.selectOptions(screen.getByRole("combobox", { name: /Country code/i }), "UG");
    await fill(user, /Mobile number/i, "0772 123 456");
    await fill(user, /Home address/i, "Plot 9, Ntinda, Kampala");
    await fill(user, /Bank name and branch/i, "Equity Bank, Ntinda branch");
    // The name on file is Stephen Gachoka Wahito, so the account has to carry
    // that surname or A-5 speaks up and blocks the submit — which is the point
    // of A-5, and not what this test is about
    await fill(user, /^Account name/, "Stephen Wahito");
    await fill(user, /^Account number/, "0110123456789");
    await user.click(screen.getByRole("radio", { name: "No Loan" }));
    await user.click(
      screen.getByRole("checkbox", { name: /I confirm these documents are mine/i }),
    );
    await user.click(screen.getByRole("button", { name: /^Submit$/i }));

    await waitFor(() => expect(sent).toHaveLength(1));
    const payload = JSON.parse(String(sent[0].get("payload"))) as OnboardingSubmission;
    // The trunk zero and the spaces are gone, and the chosen code is on front
    expect(payload.personal.mobile).toBe("+256772123456");
  }, 30_000);

  it("refuses to submit until the consent box is ticked", async () => {
    stubSubmit();
    routeFetch([{ match: "onboarding-session", body: sessionBody({ alreadyReceived: ALL_KEYS }) }]);

    const user = userEvent.setup();
    renderPage();

    await screen.findByLabelText(/Full name/i);
    await user.click(screen.getByRole("button", { name: /^Submit$/i }));

    expect(await screen.findByText("Tick the box to continue.")).toBeInTheDocument();
  });
});

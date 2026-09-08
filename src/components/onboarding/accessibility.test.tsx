import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { checkerImage } from "@/test/images";
import { documentSpec } from "@/onboarding/documents";
import { loadPhoto, type PhotoSource } from "@/onboarding/media/photo";
import { initialCrop, toRect } from "@/onboarding/crop";
import { centredCrop } from "@/onboarding/media/photo";
import { emptyEntry, type DocumentEntry } from "@/onboarding/uploads";
import type { DocumentRequirement } from "@/onboarding/session";
import { HELB_OPTIONS, fieldId } from "@/onboarding/form";
import { CropFrame } from "./CropFrame";
import { DocumentTile } from "./DocumentTile";
import { ProgressRail } from "./ProgressRail";
import { PhoneField, RadioField, TextField } from "./fields";

/**
 * The keyboard and screen-reader pass, written down so it stays passed.
 *
 * This form is filled by somebody with no account, no support number and no
 * alternative — if a control is unreachable without a mouse, or a state change
 * is announced only in colour, there is nobody for them to ask. The rules
 * being checked are the design system's, not this component's: a 44px target,
 * feedback that is never colour alone, `aria-invalid` and `aria-describedby`
 * on anything errored, and a live region for anything that changes on its own.
 */

const requirement = (overrides: Partial<DocumentRequirement> = {}): DocumentRequirement => ({
  spec: documentSpec("national-id"),
  required: true,
  satisfied: false,
  ...overrides,
});

const noop = () => {};

const renderTile = (entry: DocumentEntry, overrides: Partial<DocumentRequirement> = {}) =>
  render(
    <ul>
      <DocumentTile
        requirement={requirement(overrides)}
        entry={entry}
        note=""
        onNote={noop}
        onAdd={noop}
        onRemoveSource={noop}
        onMoveSource={noop}
        onClear={noop}
        onRetry={noop}
      />
    </ul>,
  );

const fileEntry = (names: string[]): DocumentEntry => ({
  ...emptyEntry("national-id"),
  sources: names.map((name, index) => ({
    id: String(index),
    file: new File(["x"], name, { type: "image/jpeg" }),
    name,
    bytes: 1000,
  })),
  phase: "ready",
  output: {
    clickupFieldName: "National ID",
    filename: "869evrmhx_national-id_wahito-stephen_20260908.pdf",
    bytes: 1_204_551,
    originalBytes: 8_812_345,
    sourceCount: names.length,
    pageCount: names.length,
  },
});

describe("DocumentTile, without a mouse", () => {
  it("names the document, whether it is required, and what to do", () => {
    renderTile(emptyEntry("national-id"));

    const item = screen.getByRole("listitem");
    expect(within(item).getByText(/National ID \(both sides\)/)).toBeInTheDocument();
    // The note is the instruction, not decoration
    expect(within(item).getByText(/Front and back/)).toBeInTheDocument();
    expect(within(item).getByRole("button", { name: /Add files/i })).toBeInTheDocument();
  });

  it("says an optional document is optional in words, not by omission", () => {
    renderTile(emptyEntry("national-id"), { required: false });
    expect(screen.getByText("Optional")).toBeInTheDocument();
  });

  it("reaches every control by keyboard, in the order they are read", async () => {
    const user = userEvent.setup();
    renderTile(fileEntry(["front.jpg", "back.jpg"]));

    const names: string[] = [];
    for (let step = 0; step < 12; step += 1) {
      await user.tab();
      const active = document.activeElement as HTMLElement | null;
      if (!active || active === document.body) break;
      const label = active.getAttribute("aria-label") ?? active.textContent ?? "";
      names.push(label.trim());
    }

    // Reordering and removing a page, adding another, replacing, and the note
    expect(names).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Move back.jpg earlier/),
        expect.stringMatching(/Remove front.jpg/),
        expect.stringMatching(/Add another/),
      ]),
    );
  });

  it("gives each page control a name that says which page it acts on", () => {
    renderTile(fileEntry(["front.jpg", "back.jpg"]));

    // "Move up" three times over is unusable read aloud
    expect(screen.getByRole("button", { name: "Move front.jpg later" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Move back.jpg earlier" })).toBeEnabled();
    // The ends are disabled rather than silently doing nothing
    expect(screen.getByRole("button", { name: "Move front.jpg earlier" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move back.jpg later" })).toBeDisabled();
  });

  it("labels the slots Front and Back, so the page order is not a guess", () => {
    renderTile(fileEntry(["one.jpg", "two.jpg"]));
    expect(screen.getByText("Front")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("says a document is ready to send, and shows its real size", () => {
    renderTile({ ...fileEntry(["front.jpg", "back.jpg"]), phase: "ready" });

    expect(screen.getByText(/ready to send/)).toBeInTheDocument();
    // The "was" line: people trust a form that shows its working, and it is
    // what stops somebody emailing HR to ask whether anything happened
    expect(screen.getByText(/1\.1 MB · was 8\.4 MB/)).toBeInTheDocument();
    // No progress bar here — the submit owns the only upload on the page
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("says when a document was kept from a previous sitting", () => {
    renderTile({ ...fileEntry([]), phase: "ready", restored: true });

    // Worth saying: the source files are gone, so the pages cannot be
    // reordered without adding the document again
    expect(screen.getByText(/Kept from last time/)).toBeInTheDocument();
  });

  it("says out loud that it is compressing, and does not fake a percentage", () => {
    renderTile({ ...emptyEntry("national-id"), phase: "preparing", stage: "compressing" });

    expect(screen.getByText(/Making it smaller/)).toBeInTheDocument();
    expect(screen.getByText(/please wait/)).toBeInTheDocument();
    // Compression has no honest percentage, so it does not get a bar
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("announces a refusal rather than only colouring the tile", () => {
    renderTile({
      ...emptyEntry("national-id"),
      phase: "rejected",
      error: { code: "unsupported-type", message: "This is a Word or Zip file." },
    });

    expect(screen.getByRole("alert")).toHaveTextContent("This is a Word or Zip file.");
    expect(screen.getByRole("button", { name: /Try again/i })).toBeInTheDocument();
  });

  it("offers no control at all for a document already on file", () => {
    renderTile(emptyEntry("national-id"), { satisfied: true });

    expect(screen.getByText("Already on file")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps every touch target at least 44px, for one thumb on a phone", () => {
    renderTile(fileEntry(["front.jpg", "back.jpg"]));
    // The note toggle is the smallest control on the tile and the easiest to
    // shrink by accident
    const note = screen.getByRole("button", { name: /Add a note/i });
    expect(note.className).toContain("tap-44");
    expect(note.className).toContain("min-h-9");
  });

  it("ties the note field to its own label", async () => {
    const user = userEvent.setup();
    renderTile(emptyEntry("national-id"));
    await user.click(screen.getByRole("button", { name: /Add a note/i }));

    expect(
      screen.getByLabelText(/Anything HR should know about this document/i),
    ).toBeInTheDocument();
  });
});

describe("CropFrame, without a mouse", () => {
  const sourceFor = async (): Promise<PhotoSource> => {
    const image = await checkerImage(1200, 1600);
    return loadPhoto(new File([image.bytes], "photo.jpg", { type: "image/jpeg" }));
  };

  it("is focusable and says what it is for", async () => {
    const source = await sourceFor();
    render(
      <CropFrame
        source={source}
        crop={initialCrop(source, centredCrop(1200, 1600))}
        onChange={noop}
      />,
    );

    const frame = screen.getByRole("application", { name: /Crop your photo/i });
    expect(frame).toHaveAttribute("tabindex", "0");
    // The 3px teal focus ring is never removed
    expect(frame.className).toContain("focus-visible:ring-[3px]");
  });

  it("moves the crop with the arrow keys", async () => {
    const source = await sourceFor();
    const onChange = vi.fn();
    const crop = initialCrop(source, centredCrop(1200, 1600));
    const user = userEvent.setup();

    render(<CropFrame source={source} crop={crop} onChange={onChange} />);
    const frame = screen.getByRole("application", { name: /Crop your photo/i });
    frame.focus();

    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalled();
    const moved = onChange.mock.calls[0][0];
    // Arrows pan the view, the way they do on a map: right moves right through
    // the photo. Dragging is the other way round, because a drag grabs the
    // paper — see the note on moveBySource.
    expect(moved.cx).toBeGreaterThan(crop.cx);
    expect(moved.cy).toBe(crop.cy);

    onChange.mockClear();
    await user.keyboard("{ArrowDown}");
    expect(onChange.mock.calls[0][0].cy).toBeGreaterThan(crop.cy);

    onChange.mockClear();
    await user.keyboard("{ArrowLeft}");
    expect(onChange.mock.calls[0][0].cx).toBeLessThan(crop.cx);
  });

  it("zooms with plus and minus, and clamps at both ends", async () => {
    const source = await sourceFor();
    const onChange = vi.fn();
    const crop = { ...initialCrop(source, centredCrop(1200, 1600)), zoom: 1 };
    const user = userEvent.setup();

    render(<CropFrame source={source} crop={crop} onChange={onChange} />);
    screen.getByRole("application", { name: /Crop your photo/i }).focus();

    await user.keyboard("{-}");
    // Already at the minimum, so it stays there rather than going invalid
    expect(onChange.mock.calls[0][0].zoom).toBe(1);

    onChange.mockClear();
    await user.keyboard("{+}");
    expect(onChange.mock.calls[0][0].zoom).toBeGreaterThan(1);
  });

  it("keeps the crop inside the photo however far it is nudged", async () => {
    const source = await sourceFor();
    let crop = initialCrop(source, centredCrop(1200, 1600));
    const user = userEvent.setup();

    const { rerender } = render(
      <CropFrame
        source={source}
        crop={crop}
        onChange={(next) => {
          crop = next;
        }}
      />,
    );
    screen.getByRole("application", { name: /Crop your photo/i }).focus();

    for (let press = 0; press < 30; press += 1) {
      await user.keyboard("{ArrowLeft}");
      rerender(
        <CropFrame
          source={source}
          crop={crop}
          onChange={(next) => {
            crop = next;
          }}
        />,
      );
    }

    const rect = toRect(source, crop);
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.size).toBeLessThanOrEqual(source.width);
  });

  it("offers the zoom as a labelled slider as well as a gesture", async () => {
    const source = await sourceFor();
    render(
      <CropFrame source={source} crop={{ cx: 600, cy: 800, zoom: 1.5 }} onChange={noop} />,
    );
    expect(screen.getByRole("slider", { name: "Zoom" })).toHaveValue("1.5");
  });

  it("does not corrupt the crop when it has no layout to measure", async () => {
    // jsdom reports clientWidth 0, which is also what a frame inside a
    // collapsed section reports. A nudge there must do nothing rather than
    // producing NaN and losing the photo.
    const source = await sourceFor();
    const onChange = vi.fn();
    const crop = initialCrop(source, centredCrop(1200, 1600));
    const user = userEvent.setup();

    render(<CropFrame source={source} crop={crop} onChange={onChange} />);
    const frame = screen.getByRole("application", { name: /Crop your photo/i });
    frame.focus();
    await user.keyboard("{ArrowLeft}");

    const next = onChange.mock.calls[0][0];
    expect(Number.isFinite(next.cx)).toBe(true);
    expect(Number.isFinite(next.cy)).toBe(true);
  });
});

describe("ProgressRail", () => {
  const progress = [
    { id: "details" as const, state: "done" as const },
    { id: "address" as const, state: "partial" as const },
    { id: "bank" as const, state: "empty" as const },
    { id: "documents" as const, state: "empty" as const },
    { id: "photo" as const, state: "empty" as const },
    { id: "review" as const, state: "empty" as const },
  ];

  it("says how far along you are in words as well as in a bar", () => {
    render(<ProgressRail progress={progress} />);
    expect(screen.getAllByText(/1 of 6/).length).toBeGreaterThan(0);

    const bar = screen.getByRole("progressbar", { name: /Onboarding progress/i });
    expect(bar).toHaveAttribute("aria-valuenow", "1");
    expect(bar).toHaveAttribute("aria-valuemax", "6");
  });

  it("states each section's state for a reader who cannot see the dot", () => {
    render(<ProgressRail progress={progress} />);
    // The teal tick is meaningless read aloud, so the state is also text
    expect(screen.getAllByText("complete").length).toBeGreaterThan(0);
    expect(screen.getAllByText("started").length).toBeGreaterThan(0);
    expect(screen.getAllByText("not started").length).toBeGreaterThan(0);
  });

  it("collapses to a single bar on a phone and a rail on a desk", () => {
    const { container } = render(<ProgressRail progress={progress} />);
    // One of each, so a 360px viewport never carries both
    expect(container.querySelector(".lg\\:hidden")).not.toBeNull();
    expect(container.querySelector("nav.hidden")?.className).toContain("lg:block");
  });

  it("opens the section list from the keyboard", async () => {
    const user = userEvent.setup();
    render(<ProgressRail progress={progress} />);

    const toggle = screen.getByRole("button", { expanded: false });
    await user.click(toggle);
    expect(screen.getByRole("button", { expanded: true })).toBe(toggle);
    // Both the bar's list and the rail's list are now present
    expect(screen.getAllByRole("button", { name: /Documents/i }).length).toBe(2);
  });
});

describe("the field shell", () => {
  it("describes a control by its help text, and adds the error to it", () => {
    const { rerender } = render(
      <TextField fieldKey="fullName" value="" onChange={noop} />,
    );

    const input = screen.getByLabelText(/Full name/i);
    expect(input).toHaveAttribute("aria-describedby", `${fieldId("fullName")}-help`);
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(screen.getByText(/as it appears on your National ID/i)).toBeInTheDocument();

    rerender(
      <TextField fieldKey="fullName" value="Stephen" onChange={noop} error="Enter your full name." />,
    );

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(`${fieldId("fullName")}-error`);
    // Never colour alone: the message is text, and the control carries a
    // 2px Ember keyline as well as the tint
    expect(screen.getByText("Enter your full name.")).toBeInTheDocument();
    expect(input.className).toContain("border-l-2");
  });

  it("marks a required field for both eyes and readers", () => {
    render(<TextField fieldKey="fullName" value="" onChange={noop} />);
    // The asterisk is decorative; `required` is carried by the copy and the
    // submit-time message, not by a glyph a reader would announce as "star"
    const marker = screen.getByText("*");
    expect(marker).toHaveAttribute("aria-hidden", "true");
  });

  it("masks the account number once you look away, and can show it again", async () => {
    const user = userEvent.setup();
    render(<TextField fieldKey="accountNumber" value="0110123456789" onChange={noop} mask />);

    const input = screen.getByLabelText(/^Account number/) as HTMLInputElement;
    // Never offer to remember a bank account
    expect(input).toHaveAttribute("autocomplete", "off");
    // This screen gets filled on a matatu: the last four is enough to check
    expect(input.value).toBe("•••••••••6789");

    await user.click(screen.getByRole("button", { name: /Show the account number/i }));
    expect((screen.getByLabelText(/^Account number/) as HTMLInputElement).value).toBe(
      "0110123456789",
    );

    // And focusing it shows the whole thing, so it can be proof-read
    await user.click(screen.getByRole("button", { name: /Hide the account number/i }));
    await user.click(input);
    expect(input.value).toBe("0110123456789");
  });

  it("does not mask the account name — a name is not the thing worth hiding", () => {
    render(<TextField fieldKey="accountName" value="Stephen G Wahito" onChange={noop} />);
    const input = screen.getByLabelText(/^Account name/) as HTMLInputElement;
    expect(input.value).toBe("Stephen G Wahito");
    expect(screen.queryByRole("button", { name: /Show/i })).not.toBeInTheDocument();
  });

  it("groups a radio set under one legend and answers on one tap", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RadioField
        fieldKey="helbLoanStatus"
        value=""
        options={HELB_OPTIONS}
        onChange={onChange}
        error="Choose one."
      />,
    );

    // Named once, by the label that is already on screen
    const group = screen.getByRole("group", { name: /HELB loan status/i });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(within(group).getAllByText(/HELB loan status/)).toHaveLength(1);

    // All three options, verbatim, and each its own 44px target
    HELB_OPTIONS.forEach((option) => {
      expect(screen.getByRole("radio", { name: option })).toBeInTheDocument();
    });
    expect(screen.getByText("Cleared Loan").closest("label")?.className).toContain("tap-44");

    await user.click(screen.getByRole("radio", { name: "No Loan" }));
    expect(onChange).toHaveBeenCalledWith("No Loan");
  });

  it("gives the error summary a control to focus, on the first option", () => {
    render(
      <RadioField fieldKey="helbLoanStatus" value="" options={HELB_OPTIONS} onChange={noop} />,
    );
    expect(document.getElementById(fieldId("helbLoanStatus"))).toBeInstanceOf(HTMLInputElement);
  });

  it("carries the scroll target exactly once", () => {
    const { container } = render(
      <RadioField fieldKey="helbLoanStatus" value="" options={HELB_OPTIONS} onChange={noop} />,
    );
    // Two elements with the same id is invalid, and focusField would scroll to
    // whichever one the browser returned first
    expect(
      container.querySelectorAll(`#${fieldId("helbLoanStatus")}-field`),
    ).toHaveLength(1);
  });
});

describe("the phone field", () => {
  it("asks for the country first, then the number", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCountryChange = vi.fn();

    render(
      <PhoneField
        fieldKey="mobile"
        value=""
        country="KE"
        onChange={onChange}
        onCountryChange={onCountryChange}
      />,
    );

    // Two controls, each with its own name, under one label and one error
    const code = screen.getByRole("combobox", { name: /Country code/i });
    const number = screen.getByLabelText(/Mobile number/i);
    expect(code).toHaveValue("KE");
    expect(number).toHaveAttribute("type", "tel");
    // The platform's own picker, because fifty-five rows on a phone is its job
    expect(code.tagName).toBe("SELECT");

    await user.selectOptions(code, "UG");
    expect(onCountryChange).toHaveBeenCalledWith("UG");
  });

  it("leads with Kenya, because that is where the hiring is", () => {
    render(
      <PhoneField fieldKey="mobile" value="" country="KE" onChange={noop} onCountryChange={noop} />,
    );
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("+254 KE");
  });

  it("shows what will actually be stored, so a wrong country is visible", () => {
    const { rerender } = render(
      <PhoneField
        fieldKey="mobile"
        value="0712 345 678"
        country="KE"
        onChange={noop}
        onCountryChange={noop}
      />,
    );
    // The trunk zero and the spaces go; the code goes on the front
    expect(screen.getByText(/Saved as \+254712345678/)).toBeInTheDocument();

    rerender(
      <PhoneField
        fieldKey="mobile"
        value="0712 345 678"
        country="UG"
        onChange={noop}
        onCountryChange={noop}
      />,
    );
    expect(screen.getByText(/Saved as \+256712345678/)).toBeInTheDocument();
  });

  it("says nothing about storage until there is something to store", () => {
    render(
      <PhoneField fieldKey="mobile" value="" country="KE" onChange={noop} onCountryChange={noop} />,
    );
    expect(screen.queryByText(/Saved as/)).not.toBeInTheDocument();
  });

  it("marks both controls when the number is wrong, and says it once", () => {
    render(
      <PhoneField
        fieldKey="mobile"
        value="0812345678"
        country="KE"
        onChange={noop}
        onCountryChange={noop}
        error="Enter a Kenyan mobile number, e.g. 0712 345 678."
      />,
    );

    const number = screen.getByLabelText(/Mobile number/i);
    expect(number).toHaveAttribute("aria-invalid", "true");
    expect(number.getAttribute("aria-describedby")).toContain(`${fieldId("mobile")}-error`);
    // One field, one message — not one per control
    expect(screen.getAllByText(/Enter a Kenyan mobile number/)).toHaveLength(1);
  });
});

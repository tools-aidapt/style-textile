import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { emptyValues, type ResponsibilityRow } from "@/requisition/form";
import type { RowErrors } from "@/requisition/validation";
import { ResponsibilityRepeater } from "./ResponsibilityRepeater";

/** Drives the repeater the way the form does, so state actually moves. */
const Harness = ({
  initial,
  rowErrors = {},
}: {
  initial?: ResponsibilityRow[];
  rowErrors?: RowErrors;
}) => {
  const [rows, setRows] = React.useState<ResponsibilityRow[]>(
    initial ?? emptyValues().keyResponsibilitiesRows,
  );
  return <ResponsibilityRepeater rows={rows} onChange={setRows} rowErrors={rowErrors} />;
};

const responsibilities = () => screen.getAllByLabelText(/^Key responsibility, row/i);
const outcomes = () => screen.getAllByLabelText(/^Outcome, row/i);

describe("ResponsibilityRepeater", () => {
  it("starts with three empty rows", () => {
    render(<Harness />);
    expect(responsibilities()).toHaveLength(3);
    expect(screen.getByText(/3 of 12 rows/)).toBeInTheDocument();
  });

  it("adds a row and counts only the complete ones", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(responsibilities()[0], "Manage the ledger");
    await user.type(outcomes()[0], "Zero variance");
    expect(screen.getByText(/1 complete/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add row/i }));
    expect(responsibilities()).toHaveLength(4);
    expect(screen.getByText(/4 of 12 rows/)).toBeInTheDocument();
  });

  it("adds a row when Enter is pressed in the last cell", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(outcomes()[2]);
    await user.keyboard("{Enter}");

    expect(responsibilities()).toHaveLength(4);
    // The caret lands in the new row rather than leaving it to be hunted for
    expect(outcomes()[3]).toHaveFocus();
  });

  it("does not add a row from a cell that is not the last", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(outcomes()[0]);
    await user.keyboard("{Enter}");

    expect(responsibilities()).toHaveLength(3);
  });

  it("stops at twelve rows", async () => {
    const user = userEvent.setup();
    const rows = Array.from({ length: 12 }, (_, i) => ({
      id: `row${i}`,
      responsibility: "",
      outcome: "",
    }));
    render(<Harness initial={rows} />);

    expect(screen.getByRole("button", { name: /add row/i })).toBeDisabled();
    await user.click(outcomes()[11]);
    await user.keyboard("{Enter}");
    expect(responsibilities()).toHaveLength(12);
  });

  it("removes a row", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(responsibilities()[0], "First");
    await user.click(screen.getByRole("button", { name: /remove row 1/i }));

    expect(responsibilities()).toHaveLength(2);
    expect(responsibilities()[0]).toHaveValue("");
  });

  it("reorders from the keyboard, and says so", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(responsibilities()[0], "First");
    await user.type(responsibilities()[1], "Second");
    await user.click(screen.getByRole("button", { name: /move row 1 down/i }));

    expect(responsibilities()[0]).toHaveValue("Second");
    expect(responsibilities()[1]).toHaveValue("First");
    expect(screen.getByText(/Row 1 moved to position 2 of 3/)).toBeInTheDocument();
  });

  it("cannot move the first row up or the last row down", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: /move row 1 up/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /move row 3 down/i })).toBeDisabled();
  });

  it("shows a row error on the cell it belongs to, and marks it invalid", () => {
    const rows = [{ id: "a", responsibility: "Half a row", outcome: "" }];
    render(<Harness initial={rows} rowErrors={{ a: { outcome: "Add the matching outcome." } }} />);

    expect(screen.getByText("Add the matching outcome.")).toBeInTheDocument();
    expect(outcomes()[0]).toHaveAttribute("aria-invalid", "true");
    expect(responsibilities()[0]).not.toHaveAttribute("aria-invalid");
  });
});

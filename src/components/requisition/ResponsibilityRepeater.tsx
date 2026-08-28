import * as React from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MAX_ROWS,
  completeRows,
  emptyRow,
  fieldId,
  type ResponsibilityRow,
} from "@/requisition/form";
import type { RowErrors } from "@/requisition/validation";
import { FieldShell } from "./fields";

/**
 * The key-responsibility table.
 *
 * The JD template is a two-column table — responsibility against the outcome
 * that shows it was done — and ClickUp's form view has no repeater, so the
 * fallback was a long-text box holding a pasted markdown table that managers
 * inevitably broke. This is that table, built properly: rows that add, remove
 * and reorder, with both cells of a row required if either is filled.
 *
 * Reordering works two ways on purpose. Pointer users drag the grip; keyboard
 * users move a row with the arrow buttons, which are real buttons and announce
 * what they did.
 */

const CELL = "min-h-11 py-2 text-body-sm leading-snug";

export const ResponsibilityRepeater = ({
  rows,
  onChange,
  error,
  rowErrors,
  onBlur,
}: {
  rows: ResponsibilityRow[];
  onChange: (rows: ResponsibilityRow[]) => void;
  error?: string;
  rowErrors: RowErrors;
  onBlur?: () => void;
}) => {
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [overIndex, setOverIndex] = React.useState<number | null>(null);
  /** Announces a keyboard reorder, which is otherwise silent. */
  const [announcement, setAnnouncement] = React.useState("");
  const lastCellRef = React.useRef<HTMLTextAreaElement | null>(null);
  const focusLastRef = React.useRef(false);

  const done = completeRows(rows).length;
  const atMax = rows.length >= MAX_ROWS;

  // A row added from the keyboard should land the caret in it, not leave the
  // manager hunting for where it went
  React.useEffect(() => {
    if (focusLastRef.current) {
      focusLastRef.current = false;
      lastCellRef.current?.focus();
    }
  }, [rows.length]);

  const setCell = (index: number, key: "responsibility" | "outcome", value: string) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  const addRow = (focus = false) => {
    if (atMax) return;
    focusLastRef.current = focus;
    onChange([...rows, emptyRow()]);
  };

  const removeRow = (index: number) => onChange(rows.filter((_, i) => i !== index));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
    setAnnouncement(`Row ${from + 1} moved to position ${to + 1} of ${rows.length}.`);
  };

  return (
    <FieldShell fieldKey="keyResponsibilitiesRows" error={error} as="group">
      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-white",
          error ? "border-l-2 border-mist-200 border-l-ember-300" : "border-mist-200",
        )}
      >
        {/*
          Column headers, echoing the JD table the PDF will render.

          The spacer cells for the grip and the row actions are empty spans,
          NOT `sr-only` ones. `sr-only` is `position: absolute`, and an
          absolutely positioned grid child is taken out of auto-placement
          entirely — so the two hidden spans occupied no track, "Key
          responsibility" was placed in the 2rem grip column and wrapped onto
          two lines, and "Outcome" sat in the first text column instead of the
          second. The columns need no accessible name of their own: every cell
          below carries its own label.
        */}
        <div className="hidden grid-cols-[2rem_1fr_1fr_5.5rem] items-baseline gap-3 border-b border-mist-100 bg-mist-50 px-3 py-2.5 lg:grid">
          <span aria-hidden="true" />
          <span className="min-w-0 text-caption font-medium text-steel-700">Key responsibility</span>
          <span className="min-w-0 text-caption font-medium text-steel-700">
            Outcome – indicator of success
          </span>
          <span aria-hidden="true" />
        </div>

        <ul>
          {rows.map((row, index) => {
            const rowError = rowErrors[row.id];
            const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
            // The first cell carries the field's own id, so the submit-time
            // error summary has something to focus. Its label has to agree.
            const responsibilityId =
              index === 0
                ? fieldId("keyResponsibilitiesRows")
                : `${fieldId("keyResponsibilitiesRows")}-r${index}`;
            const outcomeId = `${fieldId("keyResponsibilitiesRows")}-o${index}`;

            return (
              <li
                key={row.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverIndex(index);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragIndex !== null) move(dragIndex, index);
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={cn(
                  "grid grid-cols-1 items-start gap-3 border-b border-mist-100 p-3 last:border-b-0 lg:grid-cols-[2rem_1fr_1fr_5.5rem]",
                  dragIndex === index && "opacity-60",
                  isOver && "bg-teal-50/60",
                )}
              >
                <div
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className="hidden h-11 cursor-grab items-center justify-center rounded-sm text-steel-400 hover:text-steel-600 active:cursor-grabbing lg:flex"
                  aria-hidden="true"
                >
                  <GripVertical className="h-4 w-4" />
                </div>

                <div className="min-w-0 space-y-1">
                  <label
                    htmlFor={responsibilityId}
                    className="block text-caption font-medium text-steel-700 lg:sr-only"
                  >
                    Key responsibility, row {index + 1}
                  </label>
                  <Textarea
                    id={responsibilityId}
                    rows={1}
                    autoGrow
                    value={row.responsibility}
                    onChange={(event) => setCell(index, "responsibility", event.target.value)}
                    onBlur={onBlur}
                    // A cell is one statement, so Enter is never a newline
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.preventDefault();
                    }}
                    placeholder={index === 0 ? "Manage the depot stock ledger" : ""}
                    aria-invalid={rowError?.responsibility ? true : undefined}
                    aria-describedby={rowError?.responsibility ? `${row.id}-r-error` : undefined}
                    className={cn(CELL, rowError?.responsibility && "border-l-2 border-l-ember-300")}
                  />
                  {rowError?.responsibility ? (
                    <p id={`${row.id}-r-error`} className="text-caption font-medium text-ember-500">
                      {rowError.responsibility}
                    </p>
                  ) : null}
                </div>

                <div className="min-w-0 space-y-1">
                  <label
                    htmlFor={outcomeId}
                    className="block text-caption font-medium text-steel-700 lg:sr-only"
                  >
                    Outcome, row {index + 1}
                  </label>
                  <Textarea
                    id={outcomeId}
                    rows={1}
                    autoGrow
                    ref={index === rows.length - 1 ? lastCellRef : undefined}
                    value={row.outcome}
                    onChange={(event) => setCell(index, "outcome", event.target.value)}
                    onBlur={onBlur}
                    // Enter in the last cell adds a row, so a manager writing
                    // the table never has to reach for the mouse
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      if (index === rows.length - 1) addRow(true);
                    }}
                    placeholder={index === 0 ? "Zero unexplained variance at month end" : ""}
                    aria-invalid={rowError?.outcome ? true : undefined}
                    aria-describedby={rowError?.outcome ? `${row.id}-o-error` : undefined}
                    className={cn(CELL, rowError?.outcome && "border-l-2 border-l-ember-300")}
                  />
                  {rowError?.outcome ? (
                    <p id={`${row.id}-o-error`} className="text-caption font-medium text-ember-500">
                      {rowError.outcome}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    className="press rounded-sm p-2 text-steel-500 hover:bg-mist-50 hover:text-ink-900 disabled:text-steel-200 disabled:hover:bg-transparent"
                    aria-label={`Move row ${index + 1} up`}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, index + 1)}
                    disabled={index === rows.length - 1}
                    className="press rounded-sm p-2 text-steel-500 hover:bg-mist-50 hover:text-ink-900 disabled:text-steel-200 disabled:hover:bg-transparent"
                    aria-label={`Move row ${index + 1} down`}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={rows.length === 1}
                    className="press rounded-sm p-2 text-steel-500 hover:bg-ember-50 hover:text-ember-500 disabled:text-steel-200 disabled:hover:bg-transparent"
                    aria-label={`Remove row ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist-100 bg-mist-50 px-3 py-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => addRow(true)} disabled={atMax}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add row
          </Button>
          <p className="font-mono text-caption tabular-nums text-steel-600">
            {rows.length} of {MAX_ROWS} rows
            <span className="ml-2 text-steel-500">{done} complete</span>
          </p>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </FieldShell>
  );
};

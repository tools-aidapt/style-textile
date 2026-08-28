/**
 * Reading a requisition back.
 *
 * Both the review block and the submit-time error summary need to render an
 * answer and jump to the field that holds it, so neither lives in a component.
 */

import {
  completeRows,
  fieldId,
  type FieldKey,
  type RequisitionValues,
} from "./form";
import {
  employeeByTaskId,
  personById,
  type DirectoryPerson,
  type EmployeeRecord,
} from "./directory";

/** One readable string per field, whatever the control underneath was. */
export const describeValue = (
  key: FieldKey,
  values: RequisitionValues,
  people: {
    employees: DirectoryPerson[];
    users: DirectoryPerson[];
    employeeRecords: EmployeeRecord[];
  },
): string => {
  if (key === "keyResponsibilitiesRows") {
    const rows = completeRows(values.keyResponsibilitiesRows);
    return rows.length === 0
      ? ""
      : rows.map((row, i) => `${i + 1}. ${row.responsibility} → ${row.outcome}`).join("\n");
  }

  // The form stores the record's task id; the reader wants the person
  if (key === "replacingEmployee") {
    return employeeByTaskId(people.employeeRecords, values.replacingEmployee)?.name ?? "";
  }

  if (key === "requestingManager") {
    return personById(people.employees, values.requestingManager)?.name ?? "";
  }

  if (key === "interviewPanel") {
    return people.users
      .filter((person) => values.interviewPanel.includes(person.clickupUserId))
      .map((person) => person.name)
      .join(", ");
  }

  const value = values[key];
  if (Array.isArray(value)) return (value as string[]).join(", ");
  return String(value ?? "");
};

/** Scrolls a field into view and puts the caret in it. */
export const focusField = (key: FieldKey): void => {
  const wrapper = document.getElementById(`${fieldId(key)}-field`);
  wrapper?.scrollIntoView({ behavior: "smooth", block: "center" });
  const control = document.getElementById(fieldId(key));
  // A smooth scroll and a focus fight each other, so let the scroll start first
  window.setTimeout(() => control?.focus({ preventScroll: true }), 220);
};

import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FIELDS,
  SECTIONS,
  isFieldActive,
  type FieldKey,
  type RequisitionValues,
  type SectionId,
} from "@/requisition/form";
import { describeValue } from "@/requisition/review";
import type { DirectoryPerson } from "@/requisition/directory";

/**
 * The last step: everything the manager wrote, read back to them in the JD's
 * own order, before it goes to HR. Every row is a button — clicking it, or the
 * section's own "Edit" link, jumps straight back to the step that holds it.
 */

const Row = ({
  label,
  value,
  error,
  onEdit,
}: {
  label: string;
  value: string;
  error?: string;
  onEdit: () => void;
}) => (
  <button
    type="button"
    onClick={onEdit}
    className="press group flex w-full items-start justify-between gap-4 rounded-md px-2.5 py-2.5 text-left transition-colors duration-base hover:bg-mist-50"
  >
    <span className="w-[40%] shrink-0 text-caption font-medium text-steel-600 group-hover:text-ink-900">
      {label}
    </span>
    <span className="min-w-0 flex-1 whitespace-pre-line text-body-sm text-ink-900">
      {error ? (
        <span className="font-medium text-ember-500">{error}</span>
      ) : value ? (
        value
      ) : (
        <span className="text-steel-400">Not answered</span>
      )}
    </span>
    <Pencil
      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-steel-300 opacity-0 transition-opacity duration-base group-hover:opacity-100"
      aria-hidden="true"
    />
  </button>
);

export const RequisitionReview = ({
  values,
  employees,
  users,
  errors,
  onEditSection,
  onEditField,
}: {
  values: RequisitionValues;
  employees: DirectoryPerson[];
  users: DirectoryPerson[];
  errors: Partial<Record<FieldKey, string>>;
  onEditSection: (section: SectionId) => void;
  onEditField: (key: FieldKey) => void;
}) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-h5 font-bold tracking-snug text-ink-900">Review before you submit</h2>
      <p className="measure mt-1 text-caption text-steel-600">
        This is what HR, the HR Head and the Director will read. Click anything below to change
        it.
      </p>
    </div>

    {SECTIONS.map((section) => {
      const fields = FIELDS.filter(
        (field) => field.section === section.id && isFieldActive(field.key, values),
      );
      return (
        <section
          key={section.id}
          className="overflow-hidden rounded-lg border border-mist-200 bg-white shadow-sm"
        >
          <header className="flex items-center justify-between gap-3 border-b border-mist-100 bg-mist-50/60 px-4 py-2.5">
            <p className="text-caption font-semibold text-ink-900">
              <span className="font-mono text-steel-500">{section.letter}</span> · {section.title}
            </p>
            <button
              type="button"
              onClick={() => onEditSection(section.id)}
              className="press tap-44 inline-flex min-h-8 items-center gap-1.5 rounded-md px-1 text-caption font-medium text-teal-700 hover:underline"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </button>
          </header>
          <div className={cn("divide-y divide-mist-100 px-2 py-1 sm:px-3")}>
            {fields.map((field) => (
              <Row
                key={field.key}
                label={field.label}
                value={describeValue(field.key, values, { employees, users })}
                error={errors[field.key]}
                onEdit={() => onEditField(field.key)}
              />
            ))}
          </div>
        </section>
      );
    })}
  </div>
);

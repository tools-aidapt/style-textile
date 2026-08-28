import * as React from "react";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fieldId, fieldSpec, type FieldKey } from "@/requisition/form";
import {
  employeeByTaskId,
  initialsOf,
  matchesEmployee,
  matchesPerson,
  personById,
  type DirectoryPerson,
  type EmployeeRecord,
} from "@/requisition/directory";
import { FieldShell } from "./fields";

/**
 * Pickers over the people directories n8n serves.
 *
 * Each one is a combobox: a filter box that opens its matches when the manager
 * goes to use it, and is a single line of the form until then. The lists used
 * to be permanently open — three of them side by side in section B turned two
 * short questions and a text box into half a screen of names nobody had asked
 * to see, and pushed the rest of the form below the fold.
 *
 * Opening is a display decision only. Both directories are fetched when the
 * page mounts, by the hooks in RequisitionForm, so the names are already in
 * memory by the time anyone clicks; the loading state below is what shows on
 * the rare occasion someone gets there first.
 *
 * The avatar is the point of the employee endpoint — a face settles "which
 * Joseph" faster than an email does — so it leads each row, with initials
 * standing in whenever there is no image or the image fails to load.
 */

type Facelike = { name: string; initials: string | null; avatarUrl: string | null };

const Avatar = ({ person, size = 7 }: { person: Facelike; size?: 7 | 9 }) => {
  const [failed, setFailed] = React.useState(false);
  // A new person in the same slot deserves a fresh attempt at their image
  React.useEffect(() => setFailed(false), [person.avatarUrl]);

  const box = size === 9 ? "h-9 w-9" : "h-7 w-7";

  if (person.avatarUrl && !failed) {
    return (
      <img
        src={person.avatarUrl}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn(box, "shrink-0 rounded-circle object-cover ring-1 ring-mist-200")}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        box,
        "flex shrink-0 items-center justify-center rounded-circle bg-teal-50 font-mono text-caption font-medium text-teal-700",
      )}
    >
      {initialsOf(person)}
    </span>
  );
};

/**
 * The register's `designation` is a band — "Line Manager", "C-Suite", "HR" —
 * so it reads as a chip rather than as a subtitle, leaving the email to do the
 * identifying work.
 */
const Band = ({ label }: { label: string }) => (
  <span className="shrink-0 rounded-pill bg-mist-50 px-2 py-0.5 text-caption text-steel-600">
    {label}
  </span>
);

const Identity = ({ person }: { person: DirectoryPerson }) => (
  <>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-ink-900">{person.name}</span>
      {person.email ? (
        <span className="block truncate text-caption text-steel-500">{person.email}</span>
      ) : null}
    </span>
    {person.jobTitle ? <Band label={person.jobTitle} /> : null}
  </>
);

const row = (selected: boolean, active: boolean) =>
  cn(
    "flex w-full items-center gap-3 border-b border-mist-100 px-3 py-2 text-left text-body-sm last:border-b-0",
    selected ? "bg-teal-50/60 text-ink-900" : "text-steel-700",
    // The active row is where Enter would land. It is a separate state from
    // selected, and from hover, or keyboard and pointer disagree about which
    // row is "the one".
    active && !selected && "bg-mist-50 text-ink-900",
    active && selected && "bg-teal-100/70",
  );

/**
 * A row is ~44px, so three of them plus a peek of the fourth is the floor for
 * a list you can actually choose from.
 */
const MIN_HEIGHT = 152;

/** As tall as the list gets when there is room for it. */
const PREFERRED_HEIGHT = 288;

/** Breathing room between the list and the edge of the window. */
const VIEWPORT_GUTTER = 16;

interface Placement {
  side: "bottom" | "top";
  maxHeight: number;
}

/** One choosable person, in the shape the combobox needs. */
export interface PickerOption {
  /** Stable across renders: it keys the row and names it for aria. */
  id: string;
  selected: boolean;
  choose: () => void;
  content: React.ReactNode;
}

/**
 * A filter box that opens its matches on demand.
 *
 * Deliberately hand-rolled rather than reusing the shadcn popover: the trigger
 * IS the text field, so the list has to open without taking focus off it, and
 * a popover that moves focus makes typing-to-filter impossible. That is also
 * why each row cancels its own `mousedown` — the click still chooses, but
 * focus never leaves the input, so the list does not close underneath the
 * pointer on the way down.
 *
 * `multiple` keeps the list open after a choice, because a panel is assembled
 * from several people in one visit; a single-value picker closes, since the
 * question has been answered.
 */
const Picker = ({
  inputId,
  label,
  query,
  onQueryChange,
  options,
  isLoading,
  isUnavailable,
  multiple = false,
  invalid,
  describedBy,
  onBlur,
}: {
  inputId: string;
  label: string;
  query: string;
  onQueryChange: (value: string) => void;
  options: PickerOption[];
  isLoading: boolean;
  isUnavailable: boolean;
  multiple?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onBlur?: () => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [placement, setPlacement] = React.useState<Placement>({
    side: "bottom",
    maxHeight: PREFERRED_HEIGHT,
  });
  const container = React.useRef<HTMLDivElement>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const listId = `${inputId}-listbox`;

  // A new set of matches invalidates whatever was highlighted in the old one
  React.useEffect(() => setActive(0), [query, open]);

  /**
   * Open into whichever direction has room, and never smaller than three rows.
   *
   * A picker low in a section had barely a row and a half of space beneath it,
   * which is not enough to choose from — you cannot tell whether the name you
   * want is the next one down or thirty further on. If below is too tight and
   * above is roomier, it opens upward instead.
   *
   * Measured on every scroll and resize while open, because the anchor moves
   * with the page and a list pinned to a stale position drifts off its field.
   */
  React.useEffect(() => {
    if (!open) return;

    const measure = () => {
      const box = container.current?.getBoundingClientRect();
      if (!box) return;
      const below = window.innerHeight - box.bottom - VIEWPORT_GUTTER;
      const above = box.top - VIEWPORT_GUTTER;
      const side = below < MIN_HEIGHT && above > below ? "top" : "bottom";
      const room = side === "bottom" ? below : above;
      setPlacement({
        side,
        maxHeight: Math.max(MIN_HEIGHT, Math.min(PREFERRED_HEIGHT, room)),
      });
    };

    measure();
    // Capture: the scroll that matters may be on an ancestor, not the window
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  // Keep the highlighted row inside the scroll box. `nearest` so choosing with
  // the keyboard scrolls the list by a row rather than jumping it to centre.
  React.useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({
      block: "nearest",
    });
  }, [active, open]);

  // Anywhere outside closes: a click elsewhere on the form, or focus moving on
  // by Tab. Both are the manager saying they are done here.
  React.useEffect(() => {
    if (!open) return;

    const outside = (event: Event) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open]);

  const choose = (option: PickerOption) => {
    option.choose();
    if (multiple) return;
    onQueryChange("");
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) =>
        options.length === 0 ? 0 : Math.min(options.length - 1, Math.max(0, current + step)),
      );
      return;
    }
    if (event.key === "Enter" && open) {
      const option = options[active];
      // Enter with nothing highlighted must not submit the requisition
      event.preventDefault();
      if (option) choose(option);
      return;
    }
    if (event.key === "Escape" && open) {
      // Stop here: the form sits inside pages that also treat Escape as "leave"
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div ref={container} className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 z-raised h-4 w-4 -translate-y-1/2 text-steel-400"
        aria-hidden="true"
      />
      <Input
        id={inputId}
        // Not type="search": the native clear affordance and Escape handling
        // fight the combobox's own
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${inputId}-opt-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        value={query}
        onChange={(event) => {
          onQueryChange(event.target.value);
          // Typing is unambiguous intent to pick, so it opens the list
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onPointerDown={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder="Search by name or email"
        className="pl-9"
      />

      {open ? (
        <div
          ref={list}
          id={listId}
          role="listbox"
          aria-label={label}
          aria-multiselectable={multiple || undefined}
          style={{ maxHeight: placement.maxHeight }}
          className={cn(
            "absolute left-0 right-0 z-dropdown overflow-y-auto rounded-lg border border-mist-200 bg-white shadow-lg [animation-duration:var(--dur-fast)] [animation-timing-function:var(--ease-spring)] animate-in fade-in-0",
            // Enter from the edge it is attached to, so the list reads as
            // coming out of the field rather than arriving from nowhere
            placement.side === "bottom"
              ? "top-full mt-1 slide-in-from-top-1"
              : "bottom-full mb-1 slide-in-from-bottom-1",
          )}
        >
          <DirectoryState
            isLoading={isLoading}
            isUnavailable={isUnavailable}
            empty={options.length === 0}
          />
          {options.map((option, index) => (
            <button
              key={option.id}
              id={`${inputId}-opt-${index}`}
              type="button"
              role="option"
              aria-selected={option.selected}
              data-active={index === active || undefined}
              className={row(option.selected, index === active)}
              onMouseDown={(event) => event.preventDefault()}
              onPointerEnter={() => setActive(index)}
              onClick={() => choose(option)}
            >
              {option.content}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/** The directory is loading, empty, or unreachable — say which. */
const DirectoryState = ({
  isLoading,
  isUnavailable,
  empty,
}: {
  isLoading: boolean;
  isUnavailable: boolean;
  empty: boolean;
}) => {
  if (isLoading) {
    return (
      <p className="flex items-center gap-2 px-3 py-4 text-caption text-steel-600">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Loading the directory
      </p>
    );
  }
  if (isUnavailable) {
    return (
      <p className="px-3 py-4 text-caption text-steel-600">
        The staff directory isn't answering. Reload the page to try again — your draft is safe.
      </p>
    );
  }
  if (empty) return <p className="px-3 py-4 text-caption text-steel-600">No one matches that search.</p>;
  return null;
};

interface DirectoryProps {
  people: DirectoryPerson[];
  isLoading: boolean;
  isUnavailable: boolean;
}

export const PersonField = ({
  fieldKey,
  value,
  people,
  isLoading,
  isUnavailable,
  onChange,
  error,
}: DirectoryProps & {
  fieldKey: FieldKey;
  value: number | null;
  onChange: (value: number | null) => void;
  error?: string;
}) => {
  const [query, setQuery] = React.useState("");
  const selected = personById(people, value);
  const visible = people.filter((person) => matchesPerson(person, query));

  return (
    <FieldShell fieldKey={fieldKey} error={error} labelFor={fieldId(fieldKey)}>
      {selected ? (
        <div className="flex items-center gap-3 rounded-md border border-teal-400 bg-teal-50/50 px-3 py-2">
          <Avatar person={selected} size={9} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body-sm font-medium text-ink-900">
              {selected.name}
            </span>
            {selected.email ? (
              <span className="block truncate text-caption text-steel-600">{selected.email}</span>
            ) : null}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="press rounded-sm p-1 text-steel-600 hover:bg-white hover:text-ink-900"
            aria-label={`Clear ${selected.name}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <Picker
          inputId={fieldId(fieldKey)}
          label={fieldSpec(fieldKey).label}
          query={query}
          onQueryChange={setQuery}
          isLoading={isLoading}
          isUnavailable={isUnavailable}
          invalid={!!error}
          options={visible.map((person) => ({
            id: String(person.clickupUserId),
            selected: false,
            choose: () => onChange(person.clickupUserId),
            content: (
              <>
                <Avatar person={person} />
                <Identity person={person} />
              </>
            ),
          }))}
        />
      )}
    </FieldShell>
  );
};

export const PeopleField = ({
  fieldKey,
  values,
  people,
  isLoading,
  isUnavailable,
  onChange,
  error,
}: DirectoryProps & {
  fieldKey: FieldKey;
  values: number[];
  onChange: (values: number[]) => void;
  error?: string;
}) => {
  const [query, setQuery] = React.useState("");
  const visible = people.filter((person) => matchesPerson(person, query));
  const chosen = people.filter((person) => values.includes(person.clickupUserId));

  const toggle = (id: number) =>
    onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);

  return (
    <FieldShell fieldKey={fieldKey} error={error} labelFor={fieldId(fieldKey)}>
      <div className="space-y-2">
        <Picker
          inputId={fieldId(fieldKey)}
          label={fieldSpec(fieldKey).label}
          query={query}
          onQueryChange={setQuery}
          isLoading={isLoading}
          isUnavailable={isUnavailable}
          invalid={!!error}
          multiple
          options={visible.map((person) => {
            const selected = values.includes(person.clickupUserId);
            return {
              id: String(person.clickupUserId),
              selected,
              choose: () => toggle(person.clickupUserId),
              content: (
                <>
                  <Avatar person={person} />
                  <Identity person={person} />
                  {selected ? (
                    <span className="shrink-0 text-caption font-medium text-teal-700">
                      On the panel
                    </span>
                  ) : null}
                </>
              ),
            };
          })}
        />

        {chosen.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {chosen.map((person) => (
              <li key={person.clickupUserId}>
                <button
                  type="button"
                  onClick={() => toggle(person.clickupUserId)}
                  className="press inline-flex items-center gap-1.5 rounded-pill bg-teal-50 py-1 pl-1 pr-3 text-caption font-medium text-teal-700 hover:bg-teal-100"
                >
                  <Avatar person={person} />
                  {person.name}
                  <X className="h-3 w-3" aria-hidden="true" />
                  <span className="sr-only">Remove from the panel</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </FieldShell>
  );
};

/**
 * The line manager (B2), chosen from the user directory rather than typed, so
 * the value stored is the person's name — the wire contract keeps it a string.
 *
 * The component and the field key stay `reportingTo`: only the label the
 * manager reads changed, and the ClickUp field and the wire path it writes to
 * did not. Naming the component after the new label would hide that.
 */
export const ReportsToField = ({
  fieldKey,
  value,
  people,
  isLoading,
  isUnavailable,
  onChange,
  error,
}: DirectoryProps & {
  fieldKey: FieldKey;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) => {
  const [query, setQuery] = React.useState("");
  const selected = people.find((person) => person.name === value);
  const visible = people.filter((person) => matchesPerson(person, query));

  // A restored draft can name someone the directory no longer lists. Showing
  // the stored name beats silently emptying the field.
  if (value && !selected) {
    return (
      <FieldShell fieldKey={fieldKey} error={error} labelFor={fieldId(fieldKey)}>
        <div className="flex items-center gap-3 rounded-md border border-teal-400 bg-teal-50/50 px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-ink-900">
            {value}
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="press rounded-sm p-1 text-steel-600 hover:bg-white hover:text-ink-900"
            aria-label={`Clear ${value}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </FieldShell>
    );
  }

  return (
    <FieldShell fieldKey={fieldKey} error={error} labelFor={fieldId(fieldKey)}>
      {selected ? (
        <div className="flex items-center gap-3 rounded-md border border-teal-400 bg-teal-50/50 px-3 py-2">
          <Avatar person={selected} size={9} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body-sm font-medium text-ink-900">
              {selected.name}
            </span>
            {selected.email ? (
              <span className="block truncate text-caption text-steel-600">{selected.email}</span>
            ) : null}
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="press rounded-sm p-1 text-steel-600 hover:bg-white hover:text-ink-900"
            aria-label={`Clear ${selected.name}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <Picker
          inputId={fieldId(fieldKey)}
          label={fieldSpec(fieldKey).label}
          query={query}
          onQueryChange={setQuery}
          isLoading={isLoading}
          isUnavailable={isUnavailable}
          invalid={!!error}
          options={visible.map((person) => ({
            id: String(person.clickupUserId),
            selected: false,
            choose: () => onChange(person.name),
            content: (
              <>
                <Avatar person={person} />
                <Identity person={person} />
              </>
            ),
          }))}
        />
      )}
    </FieldShell>
  );
};

/**
 * "Who is being replaced" — a search over the employee register.
 *
 * The value stored is the record's ClickUp task id, not a name, because the
 * wire contract links a replacement to a record. Matching on a typed name was
 * the fragile part this replaces.
 */
export const EmployeeField = ({
  fieldKey,
  value,
  records,
  isLoading,
  isUnavailable,
  onChange,
  error,
}: {
  fieldKey: FieldKey;
  value: string;
  records: EmployeeRecord[];
  isLoading: boolean;
  isUnavailable: boolean;
  onChange: (taskId: string) => void;
  error?: string;
}) => {
  const [query, setQuery] = React.useState("");
  const selected = employeeByTaskId(records, value);
  const visible = records.filter((record) => matchesEmployee(record, query));

  return (
    <FieldShell fieldKey={fieldKey} error={error} labelFor={fieldId(fieldKey)}>
      {selected ? (
        <div className="flex items-center gap-3 rounded-md border border-teal-400 bg-teal-50/50 px-3 py-2">
          <Avatar person={selected} size={9} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body-sm font-medium text-ink-900">
              {selected.name}
            </span>
            {selected.company || selected.email ? (
              <span className="block truncate text-caption text-steel-600">
                {selected.company ?? selected.email}
              </span>
            ) : null}
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="press rounded-sm p-1 text-steel-600 hover:bg-white hover:text-ink-900"
            aria-label={`Clear ${selected.name}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <Picker
          inputId={fieldId(fieldKey)}
          label={fieldSpec(fieldKey).label}
          query={query}
          onQueryChange={setQuery}
          isLoading={isLoading}
          isUnavailable={isUnavailable}
          invalid={!!error}
          options={visible.map((record) => ({
            id: record.clickupTaskId,
            selected: false,
            choose: () => onChange(record.clickupTaskId),
            content: (
              <>
                <Avatar person={record} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ink-900">{record.name}</span>
                  {record.company || record.email ? (
                    <span className="block truncate text-caption text-steel-500">
                      {record.company ?? record.email}
                    </span>
                  ) : null}
                </span>
                {record.jobTitle ? <Band label={record.jobTitle} /> : null}
              </>
            ),
          }))}
        />
      )}
    </FieldShell>
  );
};

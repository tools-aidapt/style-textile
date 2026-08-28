import { Check, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/**
 * The board's filters, for a thumb.
 *
 * On a phone the desktop toolbar became three stacked full-width controls that
 * pushed every role below the fold — the filters took more room than the thing
 * being filtered. A drawer keeps them one tap away and gives the list the
 * screen back.
 *
 * It is a drawer rather than a dialog because a drawer is a physical surface:
 * vaul tracks the drag 1:1, hands the release velocity to the dismiss, and
 * rubber-bands at the top, so it can be flicked away without hunting for a
 * close button.
 *
 * Options are rows, not a nested select. A picker inside a dragging surface
 * fights it for the same gesture, and a row is a bigger target than a select
 * that opens its own layer.
 */

const ALL = "all";

const Group = ({
  title,
  allLabel,
  options,
  value,
  onChange,
}: {
  title: string;
  allLabel: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) => (
  <fieldset>
    <legend className="text-overline font-semibold uppercase tracking-wider text-steel-600">
      {title}
    </legend>
    <div className="mt-2 -mx-2">
      {[ALL, ...options].map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={selected}
            className={cn(
              "press flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-2 text-left text-body",
              selected ? "font-medium text-ink-900" : "text-steel-700",
            )}
          >
            <span className="min-w-0 truncate">{option === ALL ? allLabel : option}</span>
            {selected ? (
              <Check className="h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
            ) : null}
          </button>
        );
      })}
    </div>
  </fieldset>
);

export const FilterDrawer = ({
  departments,
  positionTypes,
  department,
  positionType,
  onDepartmentChange,
  onPositionTypeChange,
  activeCount,
  onClear,
}: {
  departments: string[];
  positionTypes: string[];
  department: string;
  positionType: string;
  onDepartmentChange: (value: string) => void;
  onPositionTypeChange: (value: string) => void;
  /** Shown on the trigger, so the button says whether anything is applied. */
  activeCount: number;
  onClear: () => void;
}) => (
  <Drawer>
    <DrawerTrigger asChild>
      <Button variant="secondary" className="shrink-0">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filters
        {activeCount > 0 ? (
          <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-teal-400 px-1.5 font-mono text-caption font-medium tabular-nums text-ink-900">
            {activeCount}
          </span>
        ) : null}
      </Button>
    </DrawerTrigger>

    <DrawerContent className="max-h-[85vh]">
      <div className="overflow-y-auto px-6 pb-2 pt-4">
        <DrawerTitle className="text-h5 font-bold tracking-snug text-ink-900">
          Filter roles
        </DrawerTitle>
        <DrawerDescription className="mt-1 text-body-sm text-steel-600">
          Narrow the board by department or position type.
        </DrawerDescription>

        <div className="mt-6 space-y-6">
          {departments.length > 1 ? (
            <Group
              title="Department"
              allLabel="All departments"
              options={departments}
              value={department}
              onChange={onDepartmentChange}
            />
          ) : null}
          {positionTypes.length > 1 ? (
            <Group
              title="Position type"
              allLabel="All types"
              options={positionTypes}
              value={positionType}
              onChange={onPositionTypeChange}
            />
          ) : null}
        </div>
      </div>

      {/* The action bar is the one opaque layer in here: a material over a
          material loses its edge, and this has to stay legible while the
          options scroll beneath it. */}
      <div className="flex items-center gap-3 border-t border-mist-100 bg-white p-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onClear}
          disabled={activeCount === 0}
          className="flex-1"
        >
          Clear
        </Button>
        <DrawerClose asChild>
          <Button type="button" className="flex-1">
            Show roles
          </Button>
        </DrawerClose>
      </div>
    </DrawerContent>
  </Drawer>
);

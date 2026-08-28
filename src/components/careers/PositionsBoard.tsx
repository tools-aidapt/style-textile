import { useMemo, useState } from "react";
import { Briefcase, RotateCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageNotice, PageShell, SectionLabel } from "@/components/AppShell";
import { Eyebrow } from "./primitives";
import { FilterDrawer } from "./FilterDrawer";
import { PositionCard } from "./PositionCard";
import { matchesQuery, type Position } from "./position";

const ALL = "all";

/**
 * Skeletons, not a spinner — the page keeps its shape while data lands.
 *
 * The blocks mirror a real card's rhythm (title, company, chips, facts,
 * footer) so the switch to live content is a fill rather than a reflow.
 */
const LoadingGrid = () => (
  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="flex min-h-[19rem] flex-col rounded-lg border border-mist-200 bg-white p-6 shadow-sm"
      >
        <div className="h-3 w-16 rounded-sm bg-mist-50" />
        <div className="mt-3 h-5 w-3/4 rounded-sm bg-mist-100" />
        <div className="mt-3 h-4 w-1/2 rounded-sm bg-mist-50" />
        <div className="mt-4 flex gap-2">
          <div className="h-7 w-24 rounded-pill bg-mist-50" />
          <div className="h-7 w-20 rounded-pill bg-mist-50" />
        </div>
        <div className="mt-5 space-y-2.5">
          <div className="h-4 w-full rounded-sm bg-mist-50" />
          <div className="h-4 w-2/3 rounded-sm bg-mist-50" />
        </div>
        <div className="mt-auto border-t border-mist-100 pt-4">
          <div className="h-4 w-20 rounded-sm bg-mist-50" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * The open-roles board: hero, a docked filter bar, then the grid.
 *
 * Filtering is client-side over the positions already fetched — no extra
 * requests, and the webhook stays a plain read-only endpoint.
 */
export const PositionsBoard = ({
  positions,
  isLoading,
  isUnavailable,
  onRetry,
}: {
  positions: Position[];
  isLoading: boolean;
  isUnavailable: boolean;
  onRetry: () => void;
}) => {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<string>(ALL);
  const [positionType, setPositionType] = useState<string>(ALL);

  const departments = useMemo(
    () => Array.from(new Set(positions.map((p) => p.department).filter(Boolean) as string[])).sort(),
    [positions],
  );
  const positionTypes = useMemo(
    () => Array.from(new Set(positions.map((p) => p.positionType).filter(Boolean) as string[])).sort(),
    [positions],
  );

  const visible = useMemo(
    () =>
      positions.filter(
        (p) =>
          matchesQuery(p, query) &&
          (department === ALL || p.department === department) &&
          (positionType === ALL || p.positionType === positionType),
      ),
    [positions, query, department, positionType],
  );

  const activeFilters = (department !== ALL ? 1 : 0) + (positionType !== ALL ? 1 : 0);
  const isFiltered = query.trim() !== "" || activeFilters > 0;
  const clearFilters = () => {
    setQuery("");
    setDepartment(ALL);
    setPositionType(ALL);
  };
  const clearSelects = () => {
    setDepartment(ALL);
    setPositionType(ALL);
  };

  const hasResults = !isLoading && !isUnavailable && positions.length > 0;
  const canFilter = departments.length > 1 || positionTypes.length > 1;

  const count = (
    <p
      className="shrink-0 text-body-sm text-steel-600"
      role="status"
      aria-live="polite"
    >
      <span className="font-mono font-medium tabular-nums text-ink-900">{visible.length}</span>{" "}
      {visible.length === 1 ? "role" : "roles"}
      {isFiltered ? ` of ${positions.length}` : ""}
    </p>
  );

  return (
    <PageShell trail={<SectionLabel>Careers</SectionLabel>} mainClassName="pb-16">
      {/* A medium tile on the light flow gradient — cropped, grain-welded, and
          hairlined so its edge reads against white. The vertical rhythm is
          tighter on a phone: this used to fill the viewport and push every
          role, the thing the page is for, below the fold. */}
      <section className="surface-flow-light has-grain mt-6 overflow-hidden rounded-xl border border-frost-200 [--grain-strength:0.5] lg:mt-8">
        <div className="relative z-raised px-6 py-7 sm:px-10 sm:py-9">
          <Eyebrow className="text-teal-700">Careers at Aidapt</Eyebrow>
          <h1 className="mt-2.5 text-h3 font-extrabold tracking-tight text-ink-900">Open roles</h1>
          <p className="measure mt-3 text-body text-steel-700">
            We are the operator&apos;s AI firm. Every role here works on the AI our clients actually
            run on, across MEA and APAC.
          </p>
        </div>
      </section>

      {/*
        The filter bar docks under the nav instead of scrolling away.

        It used to sit in the flow, so by the third row of a full board the
        search field and both filters were off-screen and the only way back to
        them was to scroll to the top. As a floating layer it is a thick
        material with the grid passing beneath — bigger surfaces read thicker —
        and it holds the result count, which was previously an orphaned line
        of text nobody connected to the controls above it.
      */}
      {hasResults ? (
        <div className="sticky top-[4.5rem] z-raised mt-6">
          <div className="chrome-float flex items-center gap-3 rounded-lg p-2.5">
            <div className="relative min-w-0 flex-1 lg:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roles"
                aria-label="Search roles"
                className="border-transparent bg-white/70 pl-10 pr-10"
              />
              {/* Clearing a search by selecting the text and deleting it is
                  work the control should do */}
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="press absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-steel-500 hover:bg-mist-50 hover:text-ink-900"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {/* Below lg the same filters live in a drawer, one tap away */}
            {canFilter ? (
              <div className="lg:hidden">
                <FilterDrawer
                  departments={departments}
                  positionTypes={positionTypes}
                  department={department}
                  positionType={positionType}
                  onDepartmentChange={setDepartment}
                  onPositionTypeChange={setPositionType}
                  activeCount={activeFilters}
                  onClear={clearSelects}
                />
              </div>
            ) : null}

            <div className="hidden items-center gap-3 lg:flex">
              {departments.length > 1 ? (
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="w-48 border-transparent bg-white/70" aria-label="Filter by department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {positionTypes.length > 1 ? (
                <Select value={positionType} onValueChange={setPositionType}>
                  <SelectTrigger className="w-44 border-transparent bg-white/70" aria-label="Filter by position type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All types</SelectItem>
                    {positionTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {isFiltered ? (
                <Button variant="ghost" onClick={clearFilters} className="text-steel-600">
                  <X className="h-4 w-4" aria-hidden="true" />
                  Clear
                </Button>
              ) : null}
            </div>

            <div className="ml-auto hidden pr-2 sm:block">{count}</div>
          </div>

          {/* On a phone the bar has no room for the count, so it sits just
              below rather than being dropped */}
          <div className="mt-2 px-1 sm:hidden">{count}</div>
        </div>
      ) : null}

      <div className="mt-6">
        {isLoading ? (
          <>
            <p className="sr-only" role="status">
              Loading open roles
            </p>
            <LoadingGrid />
          </>
        ) : isUnavailable ? (
          <PageNotice
            icon={Briefcase}
            tone="neutral"
            titleAs="h2"
            title="We couldn't load open roles"
            body="The listing service did not respond. Try again, and if it keeps failing, come back shortly."
            actions={
              <Button variant="secondary" onClick={onRetry}>
                <RotateCw className="h-4 w-4" aria-hidden="true" />
                Try again
              </Button>
            }
          />
        ) : positions.length === 0 ? (
          <PageNotice
            icon={Briefcase}
            titleAs="h2"
            title="No open roles right now"
            body="Nothing is live at the moment. New requisitions appear here as soon as they are approved."
          />
        ) : visible.length === 0 ? (
          <PageNotice
            icon={Search}
            tone="neutral"
            titleAs="h2"
            title="No roles match those filters"
            body="Try a broader search, or clear the filters to see everything that is open."
            actions={
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((position) => (
              <PositionCard key={position.id} position={position} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

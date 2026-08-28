import { Link } from "react-router-dom";
import { Briefcase, Building2, GraduationCap, Hash, Users } from "lucide-react";
import { rolePath } from "@/lib/seo";
import { Chip, ForwardLabel } from "./primitives";
import { splitLabels, type Position } from "./position";

const MAX_BENEFIT_CHIPS = 3;

/**
 * One open role. A real <a> to the role's own URL, so it can be opened in a
 * new tab, copied, and shared — a click handler on a <button> could do none of
 * those, and a job link is meant to travel.
 *
 * Hover deepens the shadow and the top keyline rather than scaling, and press
 * feedback lands on pointer-down via .press.
 */
export const PositionCard = ({ position }: { position: Position }) => {
  const benefits = splitLabels(position.benefits);
  const shown = benefits.slice(0, MAX_BENEFIT_CHIPS);
  const remaining = benefits.length - shown.length;

  return (
    <Link
      to={rolePath(position.id)}
      aria-label={`View role: ${position.name}`}
      className="press ring-outline group relative flex h-full flex-col overflow-hidden rounded-lg border border-mist-200 bg-white p-6 text-left shadow-sm hover:border-teal-200 hover:shadow-md"
    >
      {/* Water keyline — the hero colour, present on every card, earned on hover */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-teal-400 opacity-0 transition-opacity duration-base ease-forward group-hover:opacity-100"
      />

      <p className="text-overline font-semibold uppercase tracking-wider text-steel-500">
        Job title
      </p>
      <h3 className="mt-2 text-h5 font-bold tracking-snug text-ink-900">{position.name}</h3>

      {position.company ? (
        <p className="mt-3 flex items-center gap-2 text-body-sm text-steel-600">
          <Building2 className="h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
          <span className="truncate">{position.company}</span>
        </p>
      ) : null}

      {position.positionType || position.department ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {position.positionType ? (
            <Chip tone="water" icon={Briefcase}>
              {position.positionType}
            </Chip>
          ) : null}
          {position.department ? <Chip icon={Users}>{position.department}</Chip> : null}
        </div>
      ) : null}

      <dl className="mt-5 space-y-2.5 text-body-sm text-steel-600">
        {position.educationalQualification ? (
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 shrink-0 text-steel-300" aria-hidden="true" />
            <dt className="sr-only">Educational qualification</dt>
            <dd className="truncate">{position.educationalQualification}</dd>
          </div>
        ) : null}
        {position.openings ? (
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 shrink-0 text-steel-300" aria-hidden="true" />
            <dt className="sr-only">Openings</dt>
            <dd className="truncate font-mono tabular-nums">
              {position.openings} {position.openings === "1" ? "opening" : "openings"}
            </dd>
          </div>
        ) : null}
      </dl>

      {shown.length > 0 ? (
        <div className="mb-6 mt-5 flex flex-wrap gap-1.5">
          {shown.map((benefit) => (
            <Chip key={benefit} tone="wood">
              {benefit}
            </Chip>
          ))}
          {remaining > 0 ? <Chip>{`+${remaining} more`}</Chip> : null}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between border-t border-mist-100 pt-4">
        <ForwardLabel>View role</ForwardLabel>
      </div>
    </Link>
  );
};

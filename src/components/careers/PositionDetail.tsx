import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Building2, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageShell, SectionLabel } from "@/components/AppShell";
import { applyPath } from "@/lib/seo";
import { Chip, DeadlineChip, Prose } from "./primitives";
import { ApplyBar } from "./ApplyBar";
import { CandidateDescription } from "./JobDescription";
import { deadlineNote, type Position } from "./position";

/** The way to the form. One component, so the masthead and the close agree. */
const ApplyNow = ({ position, size }: { position: Position; size?: "lg" }) => (
  <Button asChild size={size} className="group">
    <Link to={applyPath(position.id)}>
      Apply now
      <ArrowRight
        className="h-4 w-4 transition-transform duration-base ease-chevron group-hover:translate-x-1"
        aria-hidden="true"
      />
    </Link>
  </Button>
);

/**
 * The role page: only what a candidate needs before applying.
 *
 * The job overview, the responsibilities and the qualifications, then a way
 * to apply. Department, reporting line, openings, recruitment route, benefits
 * and the business case are for HR and the hiring manager; on this page they
 * were a wall a candidate had to read past. The form is a page of its own,
 * reached by Apply now.
 */
export const PositionDetail = ({ position }: { position: Position }) => {
  const note = deadlineNote(position.applicationDeadline);

  return (
    <PageShell
      width="full"
      crumbs={[
        { label: "All roles", to: "/" },
        { label: position.name, compactHidden: true },
      ]}
      trail={<SectionLabel>Careers</SectionLabel>}
      mainClassName="pb-16"
    >
      {/* The landmark tile: what the role is, and the way in */}
      <section className="surface-flow-light has-grain mt-6 overflow-hidden rounded-xl border border-frost-200 [--grain-strength:0.5] lg:mt-8">
        <div className="relative z-raised flex flex-col gap-6 px-6 py-8 sm:px-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-overline font-semibold uppercase tracking-wider text-teal-700">
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              Job title
            </p>
            <h1 className="mt-2 text-balance text-h2 font-extrabold tracking-tighter text-ink-900">
              {position.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              {position.company ? (
                <p className="flex items-center gap-2 text-body text-steel-700">
                  <Building2 className="h-4 w-4 text-teal-500" aria-hidden="true" />
                  {position.company}
                </p>
              ) : null}
              {position.location ? (
                <p className="flex items-center gap-2 text-body text-steel-700">
                  <MapPin className="h-4 w-4 text-teal-500" aria-hidden="true" />
                  {position.location}
                </p>
              ) : null}
              {position.positionType ? (
                <Chip tone="water" icon={Briefcase} className="bg-white/80">
                  {position.positionType}
                </Chip>
              ) : null}
              {position.applicationDeadline ? (
                <DeadlineChip date={position.applicationDeadline} note={note} />
              ) : null}
            </div>
          </div>

          <div id="apply-top" className="shrink-0">
            <ApplyNow position={position} size="lg" />
          </div>
        </div>
      </section>

      <div className="py-8 lg:py-10">
        {/* Parsed from free text written for a document. If a role is written
            in a shape the parser cannot handle, the candidate still gets the
            raw text and the way to apply rather than a blank page. */}
        <ErrorBoundary
          label="CandidateDescription"
          fallback={position.description ? <Prose>{position.description}</Prose> : null}
        >
          <CandidateDescription
            description={position.description}
            positionName={position.name}
            qualification={position.educationalQualification}
          />
        </ErrorBoundary>
      </div>

      {/* The close: having read it, the next step is right here */}
      <section className="flex flex-col items-start gap-4 rounded-xl border border-teal-100 bg-teal-50/60 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <h2 className="font-display text-h5 font-bold tracking-snug text-ink-900">
            Ready to apply?
          </h2>
          <p className="mt-1 text-body-sm text-steel-600">
            It takes a few minutes: your details, your CV, and a few questions.
            {position.applicationDeadline ? ` Applications close on ${position.applicationDeadline}.` : ""}
          </p>
        </div>
        <ApplyNow position={position} size="lg" />
      </section>

      <ApplyBar topAnchorId="apply-top" to={applyPath(position.id)} roleName={position.name} />
    </PageShell>
  );
};

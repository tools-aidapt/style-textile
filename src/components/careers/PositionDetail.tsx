import {
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Heart,
  Landmark,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageShell, SectionLabel } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { Chip, Eyebrow, Panel, Prose, SectionHeading } from "./primitives";
import { ApplicationForm } from "./ApplicationForm";
import { ApplyBar } from "./ApplyBar";
import { JobDescription } from "./JobDescription";
import { splitLabels, type Position } from "./position";

/** One benefit, stated plainly. */
const BenefitChip = ({ icon: Icon, label }: { icon: typeof Heart; label: string }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-body-sm font-medium text-ink-900">
    <Icon className="h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
    {label}
  </span>
);

/**
 * A fact in the header summary: a label and a value as plain text, with no
 * surface of its own. Replaces the boxed "at a glance" panel, which took a
 * column of the page to say six short things.
 */
const SummaryFact = ({
  label,
  value,
  numeric = false,
}: {
  label: string;
  value?: string;
  numeric?: boolean;
}) => {
  if (!value) return null;
  return (
    <div className="lg:py-2 lg:first:pt-0 lg:last:pb-0">
      <dt className="text-overline font-semibold uppercase tracking-wider text-steel-500">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-body-sm font-medium text-ink-900",
          numeric && "font-mono tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
};

/** ClickUp uses "N/A" as a real option; it is never worth a chip. */
const hasValue = (v?: string) => !!v && v.trim().toLowerCase() !== "n/a";

/**
 * The full role page: everything about the position, then the form.
 *
 * The old flow split these facts across an inline card and a "read full
 * description" modal that repeated most of them. One page, read top to bottom,
 * is both calmer and shorter.
 */
export const PositionDetail = ({
  position,
  onBack,
  onDirtyChange,
}: {
  position: Position;
  onBack: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) => {
  const benefits = splitLabels(position.benefits);
  const stages = splitLabels(position.assessmentStages);

  const namedBenefits = [
    hasValue(position.benefitGroupLife) && {
      icon: Heart,
      label: `Group life: ${position.benefitGroupLife}`,
      covers: "group life",
    },
    hasValue(position.benefitMedicalInsurance) && {
      icon: Shield,
      label: `Medical: ${position.benefitMedicalInsurance}`,
      covers: "medical insurance",
    },
    hasValue(position.benefitPension) && {
      icon: Landmark,
      label: `Pension: ${position.benefitPension}`,
      covers: "pension",
    },
    hasValue(position.leaveDays) && {
      icon: CalendarDays,
      label: `Leave: ${position.leaveDays}`,
      covers: "leave",
    },
  ].filter(Boolean) as { icon: typeof Heart; label: string; covers: string }[];

  // A named benefit already states the detail, so the bare label is a repeat
  const covered = new Set(namedBenefits.map((b) => b.covers));
  const extraBenefits = benefits.filter((b) => !covered.has(b.trim().toLowerCase()));

  const hasBenefits = extraBenefits.length > 0 || namedBenefits.length > 0;

  return (
    <PageShell
      width="wide"
      crumbs={[
        { label: "All roles", to: "/" },
        { label: position.name, compactHidden: true },
      ]}
      trail={<SectionLabel>Careers</SectionLabel>}
      mainClassName="pb-16"
    >
      {/* Title on the left, the facts top right */}
      <div className="grid grid-cols-1 gap-8 border-b border-mist-100 py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14 lg:py-8">
        <div>
          {/* A 3px keyline is the system's rare-emphasis mark; the chevron
              leads the label, meaning from > to */}
          <span className="block h-[3px] w-10 rounded-pill bg-teal-400" aria-hidden="true" />
          <p className="mt-3 flex items-center gap-1 text-overline font-semibold uppercase tracking-wider text-steel-500">
            <ChevronRight className="h-3 w-3 text-teal-400" aria-hidden="true" />
            Job title
          </p>
          <h1 className="mt-2 max-w-[40ch] text-balance text-h2 font-extrabold tracking-tighter text-ink-900">
            {position.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            {position.company ? (
              <p className="flex items-center gap-2 text-body text-steel-600">
                <Building2 className="h-4 w-4 text-teal-400" aria-hidden="true" />
                {position.company}
              </p>
            ) : null}
            {position.positionType ? (
              <Chip tone="water" icon={Briefcase}>
                {position.positionType}
              </Chip>
            ) : null}
          </div>

          <div className="mt-6" id="apply-top">
            <Button asChild>
              <a href="#apply">Apply for this role</a>
            </Button>
          </div>
        </div>

        {/* Two columns on small screens so five short facts do not become a
            tall stack; a divided rail on desktop */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:w-64 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-mist-100 lg:border-l lg:border-mist-200 lg:pl-6">
          <SummaryFact label="Department" value={position.department} />
          <SummaryFact label="Reports to" value={position.reportingTo} />
          <SummaryFact label="Openings" value={position.openings} numeric />
          <SummaryFact label="Position" value={position.positionNature} />
          <SummaryFact label="Recruitment" value={position.recruitmentType} />
        </dl>
      </div>

      {/* The role, read top to bottom. Long-form copy first, then the
          supporting facts as tiles so the page stops being one flat column. */}
      <div className="max-w-container space-y-5 py-8 lg:py-10">
        {position.description ? (
          <div className="space-y-3">
            <Eyebrow>The role</Eyebrow>
            <SectionHeading>What you will do</SectionHeading>
            {/* The description is parsed from free text written for a
                document. If a role is written in a shape the parser cannot
                handle, the candidate still gets the raw text, the facts and
                the form rather than a blank page. */}
            <ErrorBoundary
              label="JobDescription"
              fallback={<Prose>{position.description}</Prose>}
            >
              <JobDescription description={position.description} positionName={position.name} />
            </ErrorBoundary>
          </div>
        ) : null}

        {position.sixMonthObjectives ? (
          <Panel tone="sweep" eyebrow="First six months" title="What you will focus on">
            <Prose>{position.sixMonthObjectives}</Prose>
          </Panel>
        ) : null}

        {position.educationalQualification || stages.length > 0 ? (
          <Panel eyebrow="Selection" title="How we assess">
            <div className="space-y-6">
              {position.educationalQualification ? (
                <div>
                  <p className="flex items-center gap-2 text-caption text-steel-600">
                    <GraduationCap className="h-4 w-4 text-teal-400" aria-hidden="true" />
                    Educational qualification
                  </p>
                  <p className="measure mt-2 text-body leading-relaxed text-ink-900">
                    {position.educationalQualification}
                  </p>
                </div>
              ) : null}

              {stages.length > 0 ? (
                <div>
                  <p className="flex items-center gap-2 text-caption text-steel-600">
                    <ClipboardList className="h-4 w-4 text-teal-400" aria-hidden="true" />
                    Assessment stages
                  </p>
                  {/* A stepper, not a chip row: the chevron carries the eye
                      forward, which is what a sequence of stages is */}
                  <ol className="mt-3 flex flex-wrap items-center gap-y-2">
                    {stages.map((stage, i) => (
                      <li key={stage} className="flex items-center">
                        <span className="inline-flex items-center gap-2 rounded-pill border border-teal-100 bg-teal-50 py-1.5 pl-1.5 pr-4">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-circle bg-white font-mono text-caption font-medium tabular-nums text-teal-700">
                            {i + 1}
                          </span>
                          <span className="text-body-sm font-medium text-ink-900">{stage}</span>
                        </span>
                        {i < stages.length - 1 ? (
                          <ChevronRight
                            className="mx-1 hidden h-4 w-4 shrink-0 text-steel-300 sm:block"
                            aria-hidden="true"
                          />
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          </Panel>
        ) : null}

        {position.competitiveAdvantage || position.careerPath ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {position.competitiveAdvantage ? (
              <Panel tone="flow" eyebrow="Why this role" title="What makes it worth taking">
                <Prose className="text-ink-900">{position.competitiveAdvantage}</Prose>
              </Panel>
            ) : null}

            {position.careerPath ? (
              <Panel tone="sweep" eyebrow="Growth" title="Where it leads">
                <div className="flex items-start gap-3">
                  <TrendingUp
                    className="mt-1 h-4 w-4 shrink-0 text-teal-400"
                    aria-hidden="true"
                  />
                  <Prose>{position.careerPath}</Prose>
                </div>
              </Panel>
            ) : null}
          </div>
        ) : null}

        {hasBenefits ? (
          <Panel eyebrow="Package" title="Benefits and leave">
            <div className="flex flex-wrap gap-3">
              {namedBenefits.map(({ icon, label }) => (
                <BenefitChip key={label} icon={icon} label={label} />
              ))}
              {extraBenefits.map((benefit) => (
                <BenefitChip key={benefit} icon={CheckCircle2} label={benefit} />
              ))}
            </div>
          </Panel>
        ) : null}
      </div>

      <div className="max-w-container">
        <ApplicationForm
          position={position}
          onDirtyChange={onDirtyChange}
          onBrowseOther={onBack}
        />
      </div>

      <ApplyBar topAnchorId="apply-top" formAnchorId="apply" roleName={position.name} />
    </PageShell>
  );
};

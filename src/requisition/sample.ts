/**
 * A complete requisition, for filling the form in one click.
 *
 * This exists so the form can be looked at and driven with real content in it —
 * layout, wrapping, the review block, a full submit path — without anyone
 * typing sixty fields first.
 *
 * Two things it is deliberately not:
 *
 * 1. **Not a default.** `emptyValues()` stays empty. A form that arrives
 *    prefilled would eventually be submitted as-is, and invented role
 *    descriptions would reach HR and ClickUp as though a manager had written
 *    them. Filling is always an explicit act — see `isPrefillEnabled`.
 * 2. **Not real.** Every string below is written to be obviously a sample. The
 *    job title carries "(sample)" so a requisition raised from it by accident
 *    is recognisable in the workspace rather than plausible.
 *
 * Choice fields are taken from the schema the workspace served, not hardcoded:
 * every select is validated against the options ClickUp actually offers
 * (blocking rule B-11), so a hardcoded label would fail the moment HR renamed
 * an entity. The same goes for people — the ids have to be ones the directory
 * returned.
 */

import { config } from "@/lib/config";
import type { DirectoryPerson } from "./directory";
import { emptyRow, type RequisitionValues } from "./form";
import { optionsFor, type RequisitionSchema } from "./schema";

/**
 * Whether the form may be prefilled at all.
 *
 * On in development, and otherwise only where someone has deliberately turned
 * it on for a preview deployment. It must never be reachable on the deployment
 * HR uses: the whole point of the guard is that sample content cannot become a
 * real requisition.
 */
export const isPrefillEnabled = (): boolean =>
  import.meta.env.DEV || config.allowPrefill;

/**
 * The first option whose label matches one of `preferred`, else the first
 * option there is.
 *
 * Preferences are not cosmetic. "Permanent" avoids advisory A-5, which fires
 * for a fixed-term or intern position; anything but "Recruitment Agency"
 * avoids the conditional agency-name field; "New" avoids having to name the
 * employee being replaced. A prefill that trips a blocking rule is not much
 * use for looking at a filled form.
 */
const pick = (
  schema: RequisitionSchema,
  key: string,
  preferred: string[] = [],
  avoid: string[] = [],
): string => {
  const labels = optionsFor(schema, key).map((option) => option.label);
  const wanted = preferred.find((label) => labels.includes(label));
  if (wanted) return wanted;
  return labels.find((label) => !avoid.includes(label)) ?? labels[0] ?? "";
};

/** Long enough to clear the advisory that asks for more than one sentence. */
const JOB_OVERVIEW =
  "This is sample content. The role holds product release for a manufacturing site: in-process checks on the line, finished-goods testing in the laboratory, and the decision on whether a batch ships or is held. It keeps the site audit-ready against HACCP and FSSC 22000, and owns the records an auditor asks for. It reports into quality management and works daily with production and product development.";

/** The new joiner reads D3 in week one, and advisory A-3 asks for detail. */
const SIX_MONTH_OBJECTIVES =
  "This is sample content. By the end of month six you should be releasing product on your own authority, and we will look at four things. First, every batch released against a complete and signed check record, with no gaps found on internal audit. Second, no customer complaint traced to a specification breach an in-process check should have caught. Third, the site HACCP documentation current and defensible without preparation time before an audit. Fourth, a monthly quality report production acts on rather than files.";

export const sampleValues = ({
  schema,
  employees,
  users,
}: {
  schema: RequisitionSchema;
  /** The register: who may raise a requisition. Needs an email on the wire. */
  employees: DirectoryPerson[];
  /** The user list: who may be reported to, or sit on a panel. */
  users: DirectoryPerson[];
}): RequisitionValues => {
  // A-1 is an advisory that fires when the cost centre differs from the
  // department, and it has to be acknowledged before a submit. Matching them
  // keeps the sample submittable without a tick.
  const department = pick(schema, "department", ["Quality & Product Development"]);
  const costCentre = pick(schema, "costCentre", [department]);

  // The submitter's email is a required string on the wire, so a manager
  // without one is not a usable choice
  const manager = employees.find((person) => person.email) ?? employees[0];
  const reportsTo = users[0];
  const panel = users.slice(0, 2).map((person) => person.clickupUserId);

  const multi = (key: string, count: number, avoid: string[] = []): string[] =>
    optionsFor(schema, key)
      .map((option) => option.label)
      .filter((label) => !avoid.includes(label))
      .slice(0, count);

  return {
    // ---- A · Position identity ----------------------------------------
    jobTitle: "Quality Assurance Officer (sample)",
    company: pick(schema, "company"),
    department,
    costCentre,
    // ClickUp's Work Location options are country-level while the schema serves
    // city-level ones, so a city label is written to the task as its country and
    // the full string survives only in the description. Prefer a country label
    // where the workspace offers one.
    location: pick(schema, "location", ["Kenya"]),
    positionType: pick(schema, "positionType", ["Permanent"], [
      "Fixed Term Contract",
      "Intern",
    ]),
    newOrReplacement: pick(schema, "newOrReplacement", ["New"], ["Replacement"]),
    totalSubPositions: "2",
    recruitmentType: multi("recruitmentType", 1, ["Recruitment Agency"]),
    // Both conditionals stay empty: the answers above are the ones that do
    // not ask for them
    agencyName: "",
    replacingEmployee: "",

    // ---- B · Reporting lines ------------------------------------------
    requestingManager: manager?.clickupUserId ?? null,
    reportingTo: reportsTo?.name ?? "",
    othersReportingIndirectly: "Quality analysts, line QC checkers, laboratory assistants",

    // ---- C · Job description ------------------------------------------
    jobOverview: JOB_OVERVIEW,
    keyResponsibilitiesRows: [
      {
        ...emptyRow(),
        responsibility: "Run in-process quality checks across the production lines against specification",
        outcome: "Every check completed and recorded on shift, deviations raised before the batch completes",
      },
      {
        ...emptyRow(),
        responsibility: "Test and release finished goods from the laboratory",
        outcome: "No batch shipped without a documented release, and no release reversed on retest",
      },
      {
        ...emptyRow(),
        responsibility: "Keep the site audit-ready against HACCP and FSSC 22000",
        outcome: "External audits passed with no major non-conformance, records produced on request",
      },
      {
        ...emptyRow(),
        responsibility: "Investigate quality holds and customer complaints to root cause",
        outcome: "Each hold closed with a corrective action that prevents the same cause recurring",
      },
    ],
    qualifications: [
      "Degree or diploma in food science, food technology or analytical chemistry",
      "HACCP and FSSC 22000 certification, or completed within six months",
      "Internal auditor training is welcome but not expected",
    ],
    experience:
      "Four years in a food or beverage manufacturing quality function, at least one of them holding release authority for finished product.",
    skills: [
      "Laboratory testing methods for food and beverage products",
      "HACCP plans, product specifications and audit documentation",
      "Root cause investigation on quality holds and complaints",
      "Willingness to stop a line and hold a batch under pressure",
    ],

    // ---- D · Business case --------------------------------------------
    previousFailuresSuccesses:
      "This is sample content. The officers who lasted in this role were comfortable holding a batch when production wanted it released. The two who did not last were technically sound but deferred to the shift manager every time there was a deadline. The failure mode is not analytical skill, it is willingness to be unpopular on the day.",
    competitiveAdvantage:
      "This is sample content. You hold genuine release authority rather than recommending it to someone else, across a site making several product categories, with a laboratory that is properly equipped. Quality officers here move into quality management or product development.",
    sixMonthsObjectives: SIX_MONTH_OBJECTIVES,
    potentialCareerPath:
      "This is sample content. The route from here is Senior Quality Officer, then Quality Assurance Manager for a site, then Group Quality and Compliance.",

    // ---- E · Provisioning ---------------------------------------------
    positionRequirements: multi("positionRequirements", 3),

    // ---- F · Hiring process -------------------------------------------
    assessmentStagesRequired: multi("assessmentStagesRequired", 2),
    interviewPanel: panel,
  };
};

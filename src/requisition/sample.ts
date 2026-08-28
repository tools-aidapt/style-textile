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
  "This is sample content. The role runs a single production line for a full shift: the output plan, the crew on it, and the quality of what comes off it. It owns the handover to the next shift, so the incoming supervisor can act on it without a phone call. It reports into plant operations and sits alongside the quality and maintenance leads.";

/** The new joiner reads D3 in week one, and advisory A-3 asks for detail. */
const SIX_MONTH_OBJECTIVES =
  "This is sample content. By the end of month six you should be running your shift without daily direction, and we will look at four things. First, line efficiency on your shift at or above the plant average for three consecutive months. Second, no repeat of any quality hold caused by a process step under your control. Third, every operator on your crew signed off on the standard operating procedures for their station. Fourth, a written handover the incoming shift can act on without a phone call.";

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
  const department = pick(schema, "department");
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
    jobTitle: "Production Supervisor (sample)",
    company: pick(schema, "company"),
    department,
    costCentre,
    location: pick(schema, "location"),
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
    othersReportingIndirectly: "Line operators, packing crew, shift cleaners",

    // ---- C · Job description ------------------------------------------
    jobOverview: JOB_OVERVIEW,
    keyResponsibilitiesRows: [
      {
        ...emptyRow(),
        responsibility: "Run the assigned line for the full shift against the production plan",
        outcome: "Shift output within agreed tolerance of plan, line efficiency at or above plant average",
      },
      {
        ...emptyRow(),
        responsibility: "Supervise and allocate the shift operating crew",
        outcome: "Every station manned by a signed-off operator on every shift",
      },
      {
        ...emptyRow(),
        responsibility: "Enforce in-process quality checks and product specification at the line",
        outcome: "No quality hold traced to a missed in-process check on the shift",
      },
      {
        ...emptyRow(),
        responsibility: "Hand the line over to the incoming shift in writing",
        outcome: "The incoming supervisor starts without needing a call back",
      },
    ],
    qualifications: [
      "Diploma in food technology, production or mechanical engineering",
      "HACCP or FSSC 22000 certification, or completed within six months",
      "Membership of a relevant professional body is welcome but not expected",
    ],
    experience:
      "Five years in an FMCG manufacturing plant, at least one of them in a supervisory or team-leader role on a packaging or processing line.",
    skills: [
      "High-speed packaging or processing equipment",
      "In-process quality checks and shift documentation",
      "SAP or an equivalent ERP for production entries",
      "Presence on the floor rather than in an office",
    ],

    // ---- D · Business case --------------------------------------------
    previousFailuresSuccesses:
      "This is sample content. The two supervisors who lasted in this role came off the line themselves and already knew the machines. The two external hires who did not last were strong on paper but arrived expecting to manage from an office. The failure mode is not technical knowledge, it is willingness to stand at the machine.",
    competitiveAdvantage:
      "This is sample content. You run a full line end to end, with your own crew and your own numbers, in a plant where the shift supervisor is trusted to make the call rather than escalate it. Supervisors here move into production management.",
    sixMonthsObjectives: SIX_MONTH_OBJECTIVES,
    potentialCareerPath:
      "This is sample content. The route from here is Senior Shift Supervisor, then Production Manager for a line group, then Plant Operations.",

    // ---- E · Provisioning ---------------------------------------------
    positionRequirements: multi("positionRequirements", 3),

    // ---- F · Hiring process -------------------------------------------
    assessmentStagesRequired: multi("assessmentStagesRequired", 2),
    interviewPanel: panel,
  };
};

/**
 * Every string a line manager reads on the two KPI forms.
 *
 * Here rather than in the components for the reason `feedback/locale.ts`
 * gives: Swahili is out of scope for v1, and that only stays true if
 * translating it never means reading a component.
 *
 * The reader is a colleague, not a candidate, and is busy. The tone is
 * therefore plainer than the feedback layer's: no thanking them for their
 * time before they have given any, no apologising for the form, and no
 * softening of the two things that actually matter — that the weights must
 * total 100, and that a final review is what somebody's probation decision
 * is read against.
 */

import { MAX_KPIS, MAX_WEIGHT, MIN_KPIS, WEIGHT_TOTAL } from "./schema";

export const copy = {
  eyebrow: "Kenafric Group · Performance",

  // --- Build E, the definition form ----------------------------------------

  define: {
    title: "Set probation KPIs",
    intro:
      `Agree ${MIN_KPIS} to ${MAX_KPIS} KPIs with your new team member and record them here. ` +
      `They are what the probation review is scored against, so the weights must add up to ${WEIGHT_TOTAL}%.`,
    detailsHeading: "Who these KPIs are for",
    /** Says who reads this and what it is used for. Not a reassurance. */
    privacyNote:
      "These KPIs go onto the employee's record in ClickUp and are what the mid-probation and final reviews are scored against. HR approves the set before it is fixed.",

    sectionTitle: "The KPIs",
    sectionIntro:
      "One row per KPI. Choose the measurement type first — it decides whether a target figure is asked for.",

    addRow: "Add a KPI",
    removeRow: "Remove",
    removeRowLabel: (index: number) => `Remove KPI ${index}`,
    rowHeading: (index: number) => `KPI ${index}`,
    atMax: `${MAX_KPIS} is the most a probation set can carry`,
    atMin: `${MIN_KPIS} is the fewest a probation set can carry`,

    weightHeading: "Weighting",
    weightTotal: (total: number) => `${total}% of ${WEIGHT_TOTAL}%`,
    weightShort: (gap: number) => `${gap}% still to allocate`,
    weightOver: (gap: number) => `${gap}% over`,
    weightExact: "Weights add up. Ready to send.",
    weightCap: `No single KPI above ${MAX_WEIGHT}%`,

    submit: "Send these KPIs",
    submitting: "Sending…",
    submitBlocked: `Submit opens once the weights total ${WEIGHT_TOTAL}%`,

    successHeading: "KPIs sent",
    successBody:
      "They are on the employee's record now, and HR will approve the set. You will get an email with the agreed KPIs once they do.",
    alreadyBody:
      "A KPI set has already been recorded for this employee, and each link can only be used once. If something needs changing, reply to the email we sent you and HR will amend it.",
  },

  // --- Build F, the review form --------------------------------------------

  review: {
    midTitle: "Mid-probation review",
    finalTitle: "Final probation review",
    midIntro:
      "Say how your team member is tracking against each agreed KPI. No scores at this point — that is the final review.",
    finalIntro:
      "Score each agreed KPI against what was actually achieved. This is what the probation decision is read against, so it has to cover every KPI.",
    detailsHeading: "Who this review is for",
    midPrivacyNote:
      "Your answers go onto the employee's KPI records. Anything marked At Risk or Off Track is flagged to HR.",
    finalPrivacyNote:
      "This review is written to the employee's record, scored, and used in the probation decision. The employee sees the agreed set and the outcome.",

    agreedHeading: "The KPIs as agreed",
    agreedIntro:
      "Read-only, so the review is held against what was agreed rather than against memory.",

    answersHeading: "Your review",
    midNotesLabel: "Mid-review notes",
    midNotesHelp: "Required where a KPI is At Risk or Off Track.",

    actualLabel: "Actual achieved",
    scoreLabel: "Score",
    scorePending: "—",
    scoreCapped: (raw: string) => `${raw} of target, capped at 100%`,
    ratingLabel: "Rating",
    commentLabel: "Comment",
    commentHelp: "Required at a rating of 2 or below.",

    talentHeading: "Development and career",
    talentIntro:
      "From the KIL sheet. These feed succession planning and the training budget, so they are read by more people than the score is.",
    capacityLabel: "Capacity building interventions",
    capacityHelp:
      "Up to three areas for training, coaching or mentoring in the next review period.",
    capacityLine: (index: number) => `Area ${index}`,
    aspirationsLabel: "Desired career aspirations",
    aspirationsHelp: "Which position or positions they are aiming for in the next 1 to 2 years.",
    aspirationsLine: (index: number) => `Aspiration ${index}`,
    employeeCommentsLabel: "Employee's comments",
    employeeCommentsHelp: "In their words, as given to you in the review conversation.",
    managerCommentsLabel: "Manager's comments",
    panelAdjustmentLabel: "Panel adjustment",
    panelAdjustmentHelp:
      "HR only. A signed figure added to the weighted score — use a minus sign to reduce it.",

    totalsHeading: "Score as it stands",
    totalWeighted: "Weighted KPI score",
    totalFinal: "Final individual score",
    totalPending: "Complete every KPI to see the score",
    /** Said whenever the live set does not total 100 — a voided KPI, usually. */
    totalBasis: (basis: number) =>
      `Out of ${basis}, not 100 — the set on this review carries ${basis}% of weight.`,

    /**
     * The signature line. **K-4: say this to HR before building, not after.**
     *
     * The KIL sheet has four wet-signature boxes and this form reproduces
     * none of them. The signed link plus the submission timestamp is the
     * sign-off, and it is stronger evidence than a scanned squiggle — but
     * only if the person signing is told that is what they are doing.
     */
    signOffNote:
      "Sending this review records it as signed by you, with the date and time. It replaces the signature boxes on the paper form.",

    submitMid: "Send the mid-review",
    submitFinal: "Send the final review",
    submitting: "Sending…",

    successHeading: "Review sent",
    midSuccessBody:
      "It is on the employee's KPI records. Anything you marked At Risk or Off Track has gone to HR.",
    finalSuccessBody:
      "It is on the employee's record, scored, and with HR for the probation decision. The completed review sheet is attached to their file.",
    alreadyBody:
      "This review has already been sent, and each link can only be used once. If something needs changing, reply to the email we sent you.",
  },

  // --- Shared --------------------------------------------------------------

  requiredNote: "Fields marked * are needed before this can be sent.",

  incompleteHeading: (count: number) =>
    count === 1 ? "One answer still needed" : `${count} answers still needed`,
  incompleteBody: "They are marked below.",
  incompleteJump: "Go to the first one",

  failedHeading: "We could not send this",

  /**
   * The sample-data banner.
   *
   * Loud on purpose, and it says the submit goes nowhere — which is the
   * whole point: a mock that posted to WF-18b would create real KPI tasks
   * against a real employee from invented data.
   */
  sampleHeading: "Sample data",
  sampleBody:
    "This page is running on checked-in sample content so the form can be reviewed without n8n. Nothing here is a real employee, and nothing you send from this page leaves the browser.",

  // --- Dead ends -----------------------------------------------------------
  // Nothing here names an employee, a position or a company. A link that does
  // not work is opened by whoever has it, which is not necessarily the person
  // it was sent to.

  noTokenHeading: "This link is incomplete",
  noTokenBody:
    "The last part of the address is missing, which usually means an email app cut it short. Open the link from the original email, or reply to it and we will send a new one.",

  deadHeading: "This link has expired",
  deadBody:
    "KPI links stop working after a few weeks, and each one can only be used once. Reply to the email we sent you and we will send a new one.",

  unreachableHeading: "We could not open the form",
  unreachableBody:
    "Something on our side did not respond. Nothing you have typed has been lost — try again in a moment.",
  unreachableRetry: "Try again",

  wrongFormHeading: "This link opens a different form",
  wrongFormBody:
    "The link you followed belongs to the other Kenafric KPI form, so we have not shown it. Open the link from the original email, or reply to it and we will send you a new one.",

  emptySetHeading: "There are no KPIs to review yet",
  emptySetBody:
    "No KPI set has been recorded for this employee, so there is nothing to review against. Reply to the email we sent you and HR will sort it out.",

  unconfiguredBody:
    "This form is not finished being set up. Nothing you do here will help — please reply to the email we sent you.",

  alreadyHeading: "This has already been sent",
} as const;

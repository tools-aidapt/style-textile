/**
 * Every string a person filling in a feedback form reads.
 *
 * Here rather than in the components for the reason `onboarding/locale.ts`
 * gives: Swahili is out of scope for v1, and that only stays true if
 * translating it never means reading a component.
 *
 * The tone is set by who is on the other end. Most people who receive the
 * candidate review have just been turned down by Kenafric. The form must not
 * congratulate them, must not imply the survey affects anything, and must not
 * ask them to be brief — it should read as somebody who wants to know how it
 * went, which is the only honest reason to send it.
 *
 * A manager is a different reader on both counts. They are a colleague, not
 * somebody who has just been refused; and what they write about a named new
 * hire has consequences for that person, so the privacy line has to say who
 * reads it rather than reassure them that nobody does. `voices` below holds
 * the handful of strings that turn on that difference; everything outside it
 * is shared, and is shared because it reads the same to everybody.
 */

export const copy = {
  pageEyebrow: "Kenafric Group · Recruitment",
  pageTitle: "Your recruitment experience",

  /** Above the questions, under the header. */
  privacyNote:
    "Your answers go to the Kenafric HR team. They are used to improve how we recruit, and they do not affect any application you have with us.",

  requiredNote: "Questions marked * need an answer. The rest are up to you.",

  /** The 1-5 dropdown questions on the manager forms. */
  scaleLegend: "1 is lowest, 5 is highest",
  scaleValue: (value: number) => `${value} out of 5`,

  starLegend: "1 is poor, 5 is excellent",
  starValue: (value: number) => `${value} out of 5`,

  progress: (answered: number, total: number) => `${answered} of ${total} answered`,

  submit: "Send my feedback",
  submitting: "Sending…",

  /** Shown when a submit was attempted with required answers still blank. */
  incompleteHeading: (count: number) =>
    count === 1 ? "One question still needs an answer" : `${count} questions still need an answer`,
  incompleteBody: "They are marked below.",
  incompleteJump: "Go to the first one",

  // --- Dead ends -----------------------------------------------------------
  // Nothing here names a candidate, a position or a company. A link that does
  // not work is opened by whoever has it, which is not necessarily the person
  // it was sent to.

  noTokenHeading: "This link is incomplete",
  noTokenBody:
    "The last part of the address is missing, which usually means it was cut short by an email app. Open the link from the original email, or reply to it and we will send a new one.",

  deadHeading: "This link has expired",
  deadBody:
    "Feedback links stop working after 30 days, and each one can only be used once. If you would still like to tell us how it went, reply to the email we sent you.",

  unreachableHeading: "We could not open the form",
  unreachableBody:
    "Something on our side did not respond. Nothing you have typed has been lost — try again in a moment.",
  unreachableRetry: "Try again",

  unconfiguredBody:
    "This form is not finished being set up. Nothing you do here will help — please reply to the email we sent you.",

  // --- Outcomes ------------------------------------------------------------

  alreadyHeading: "You have already sent this",
  alreadyBody:
    "We have your feedback for this interview, and each link can only be used once. Thank you for taking the time.",

  successHeading: "Thank you",
  successBody:
    "Your feedback has been sent to the Kenafric HR team. It is read by a person, and it is the main way we find out what to change.",
  successRating: (rating: number) => `You rated your overall experience ${rating} out of 5.`,

  failedHeading: "That did not send",
  failedRetryable:
    "Your answers are still on this page. Try again — if it keeps failing, reply to the email we sent you.",
  failedFinal:
    "Your answers are still on this page, but we cannot send them from here. Please reply to the email we sent you.",
  failedOffline: "You are offline. Your answers are still here — try again once you have a connection.",
  retry: "Try again",

} as const;

/**
 * What changes with the reader. Everything above stays the same for everyone.
 *
 * One entry per instrument rather than per form type: `CRR` and `ICRR` are
 * one voice because they are one form, which is the whole point of Build A.
 */
export const voices = {
  /** F1 / F2 — the external candidate and the internal applicant. */
  candidate: {
    eyebrow: copy.pageEyebrow,
    detailsHeading: "Your details",
    privacyNote: copy.privacyNote,
    alreadyBody: copy.alreadyBody,
    successBody: copy.successBody,
    successRating: copy.successRating,
  },

  /**
   * F3 — the requesting manager, on the recruitment they have just been
   * through. Nobody is being appraised here except HR, so it can be direct
   * about that: it is the recruitment process being marked, not the hire.
   */
  managerRecruitment: {
    eyebrow: "Kenafric Group · Recruitment",
    detailsHeading: "Your details",
    privacyNote:
      "Your answers go to the Kenafric HR team and are used to improve how we recruit. This reviews the recruitment process for this role — not the person who was hired.",
    alreadyBody:
      "We have your review of the recruitment for this role, and each link can only be used once. Thank you for taking the time.",
    successBody:
      "Your review has been sent to the Kenafric HR team. It is read by a person, and it is how we find out what to change in the next hiring round.",
    successRating: (rating: number) => `You rated this recruitment round ${rating} out of 5.`,
  },

  /**
   * F4 — the line manager, on a named new hire at Month 1 and Month 3.
   *
   * The one form in the layer where the subject is a person who is not
   * reading it, so the privacy line says plainly where it goes. Understating
   * that would be a manager writing something frank about a colleague on the
   * assumption it stops with them.
   */
  newHireReadiness: {
    eyebrow: "Kenafric Group · Onboarding",
    // Not "your details": half of this block is the new hire's
    detailsHeading: "This review",
    privacyNote:
      "Your answers go to the Kenafric HR team and form part of this employee's probation record. They are not shown to the employee by this form.",
    alreadyBody:
      "We have your review for this check-in point, and each link can only be used once. The next one will reach you at the next review point.",
    successBody:
      "Your review has been sent to the Kenafric HR team and recorded against this employee's probation.",
    successRating: (rating: number) => `You rated their overall readiness ${rating} out of 5.`,
  },
  /**
   * F5 — the new hire, on their own experience, monthly through probation.
   *
   * The only instrument whose reader is also its subject, and the only one
   * that can promise something back: it asks what support they are missing,
   * so the privacy line says who acts on the answer. It must not promise
   * anonymity — the response is linked to their employee record, and
   * implying otherwise would be a lie a payroll number makes obvious.
   */
  employeeCheckIn: {
    eyebrow: "Kenafric Group · Onboarding",
    detailsHeading: "Your details",
    privacyNote:
      "Your answers go to the Kenafric HR team, who use them to improve how we support new joiners. They are recorded against your employee record, so they are not anonymous — and anything you flag here as missing is something HR can act on.",
    alreadyBody:
      "We have your check-in for this month, and each link can only be used once. The next one will reach you at your next check-in.",
    successBody:
      "Your answers have been sent to the Kenafric HR team. A person reads them, and what you have asked for here is what HR follows up on.",
    successRating: (rating: number) => `You rated your experience ${rating} out of 5.`,
  },
} as const;

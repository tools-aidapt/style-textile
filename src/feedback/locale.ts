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
 */

export const copy = {
  pageEyebrow: "Kenafric Group · Recruitment",
  pageTitle: "Your recruitment experience",

  /** Above the questions, under the header. */
  privacyNote:
    "Your answers go to the Kenafric HR team. They are used to improve how we recruit, and they do not affect any application you have with us.",

  requiredNote: "Questions marked * need an answer. The rest are up to you.",

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

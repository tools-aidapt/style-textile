/**
 * Every string the employee reads that is not a field label.
 *
 * One catalogue, so Swahili is a translation rather than a rewrite. It is out
 * of scope for v1 (§15.7) and that only stays cheap if no component ever holds
 * its own copy.
 */

import { config } from "@/lib/config";

/**
 * The two values this app refuses to invent.
 *
 * A privacy-notice URL and an HR address are facts about Kenafric, not copy,
 * and this is the screen that asks for a national ID, bank details and a
 * photograph of somebody's face. A guessed link there is worse than no link,
 * and a guessed address sends a document nowhere. Both come from the
 * deployment, and both render only when set — see `.env.example`.
 */
export const PRIVACY_NOTICE_URL = config.onboardingPrivacyUrl;
export const HR_EMAIL = config.onboardingHrEmail;

export const copy = {
  /** The hero. This is the first thing a new Kenafric employee ever sees from Kenafric's systems. */
  pageTitle: "Welcome to Kenafric",
  pageIntro:
    "A few details and your documents, so HR can set you up before your first day. It saves as you go, so you can close this and come back. Photos taken on your phone are fine.",

  restore: (when: string) => `Picking up where you left off — saved ${when}`,
  discard: "Start again",
  discardConfirm: "Clear everything you've filled in so far?",

  offline:
    "You're offline. Everything you've done is saved on this device — you can carry on, and submit once you have a connection.",

  /** A4 — the trust anchor. An unexpected link asking for bank details should prove itself. */
  confirmHeading: "Confirm your details",
  confirmFooter: "Something wrong here? Tell HR before you submit.",

  bankIntro:
    "Kenafric uses these to pay you and to register you correctly. They are visible only to HR.",

  addNote: "Add a note",
  noteLabel: "Anything HR should know about this document",

  consent:
    "I confirm these documents are mine and I agree to Kenafric holding them for employment and statutory purposes.",
  privacyLink: "Read the privacy notice",
  /** Shown in its place where the deployment has no notice configured. */
  privacyUnavailable:
    "Ask HR for a copy of the privacy notice if you would like to read it first.",

  /** §9.1, rendered verbatim as a five-item checklist. Not paraphrased. */
  photoGuidance: [
    {
      title: "Positioning",
      body: "Face the camera head-on and fill 60–70% of the frame with your face. Avoid extreme angles and poses.",
    },
    {
      title: "Expression",
      body: "Keep a neutral expression. Remove dark glasses or tinted lenses. Both eyes open.",
    },
    {
      title: "Lighting",
      body: "Avoid bright backlighting and glare. Even lighting throughout.",
    },
    {
      title: "Focus",
      body: "Make sure the image is sharp. If it will not focus, move further from the camera.",
    },
    {
      title: "Orientation",
      body: "Hold the device upright in portrait. Do not rotate it.",
    },
  ],

  photoTakePhoto: "Take a photo",
  photoChooseFile: "Choose a file",
  photoRetake: "Retake",
  photoUseAnyway: "Use it anyway",
  photoOutputNote: "This is how it will appear on your Kenafric records.",
  photoCropHint: "Drag to move, pinch or use the slider to zoom.",

  /** §8.5 — the three real options, in this order. */
  tooLargeHeading: (size: string) => `Still too large — ${size}`,
  tooLargeBody: "This document is over the 5 MB limit even after compressing.",
  tooLargeOptions: [
    "If it has many pages, upload it in two parts using the note field to say so",
    "If you scanned it, rescan at a lower quality setting",
    "Ask HR to accept it by email",
  ],

  submit: "Submit",
  submitting: "Sending",
  /** The one upload on the page, so it gets a real figure. */
  sendingProgress: (percent: number, size: string) => `Sending ${percent}% of ${size}`,
  sendingSettling: "Filing your documents",
  sendingWarning: "Keep this page open until it finishes.",
  restoring: "Checking what you'd already added",

  successHeading: "Thank you — that's everything we needed",
  successBody: (email: string) =>
    `HR will check your documents over the next few days. If anything needs redoing, they'll email you at ${email}.`,
  successStart: (joiningDate: string) =>
    `You start on ${joiningDate}. We'll send your joining details closer to the day.`,
  successStartUnknown: "We'll send your joining details closer to the day.",
  successReceived: "What we received",
  successPrint: "Print this summary",

  failureHeading: "We couldn't finish submitting",
  failureBody: "Your documents are saved. Try again.",

  unknownHeading: "We can't open this form",
  unknownBody:
    "This link doesn't match a record we're expecting documents for. Ask HR to send you a new one.",
  noIdHeading: "This link isn't complete",
  noIdBody:
    "Open the link from your email exactly as it was sent — the last part of the address is what identifies you.",
  unreachableHeading: "We can't load your form right now",
  unreachableBody: "Nothing you've filled in is lost. Try again in a moment.",
} as const;

/** A joining date, written the way somebody would say it. */
export const formatJoiningDate = (iso: string | null): string | null => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

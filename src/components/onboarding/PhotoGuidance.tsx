import { Check, X } from "lucide-react";
import { copy } from "@/onboarding/locale";

/**
 * The photo guidance, rendered verbatim and never collapsed.
 *
 * This audience is holding a phone with the sun behind them. A do/don't pair
 * teaches that faster than five sentences, so both are shown — as diagrams
 * rather than photographs, because a stock photograph of somebody else's face
 * on the page where you are asked for your own is a strange thing to look at.
 */

const FRAME = "h-full w-full";

/** Head-on, centred, filling ~65% of the frame, evenly lit. */
const GoodExample = () => (
  <svg viewBox="0 0 100 100" className={FRAME} role="img" aria-label="A well-framed photo: face centred, filling most of the frame, even lighting">
    <rect width="100" height="100" fill="#EDF1F2" />
    <circle cx="50" cy="42" r="21" fill="#C1D5E0" />
    <path d="M20 100c0-17 13-27 30-27s30 10 30 27z" fill="#C1D5E0" />
    <circle cx="43" cy="40" r="2.2" fill="#0A1A22" />
    <circle cx="57" cy="40" r="2.2" fill="#0A1A22" />
    <path d="M44 50q6 4 12 0" stroke="#0A1A22" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    {/* The 60-70% guide, so the target is a thing you can see */}
    <ellipse
      cx="50"
      cy="46"
      rx="27"
      ry="34"
      fill="none"
      stroke="#11A8A0"
      strokeWidth="1.6"
      strokeDasharray="4 3"
    />
  </svg>
);

/** Too far, off-angle, backlit — the three things that come back from HR. */
const BadExample = () => (
  <svg viewBox="0 0 100 100" className={FRAME} role="img" aria-label="A photo to avoid: face small and off to one side, strong light behind">
    <rect width="100" height="100" fill="#EDF1F2" />
    {/* The window behind them */}
    <rect x="52" y="8" width="40" height="46" fill="#FFFFFF" />
    <g transform="rotate(-14 40 56)">
      <circle cx="40" cy="52" r="12" fill="#ACBCC3" />
      <path d="M25 100c0-11 7-17 15-17s15 6 15 17z" fill="#ACBCC3" />
      <circle cx="36" cy="51" r="1.4" fill="#45555B" />
      <circle cx="44" cy="51" r="1.4" fill="#45555B" />
    </g>
  </svg>
);

export const PhotoGuidance = () => (
  <div className="space-y-4">
    <ul className="space-y-2">
      {copy.photoGuidance.map((item) => (
        <li key={item.title} className="flex gap-2.5 text-[0.8125rem] leading-5">
          <span
            aria-hidden="true"
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-circle bg-teal-400"
          />
          <span className="text-steel-700">
            <span className="font-semibold text-ink-900">{item.title}</span> — {item.body}
          </span>
        </li>
      ))}
    </ul>

    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Like this", Example: GoodExample, good: true },
        { label: "Not like this", Example: BadExample, good: false },
      ].map(({ label, Example, good }) => (
        <figure key={label} className="space-y-1.5">
          <div className="aspect-square overflow-hidden rounded-md border border-mist-200">
            <Example />
          </div>
          <figcaption className="flex items-center gap-1.5 text-caption font-medium">
            <span
              aria-hidden="true"
              className={
                good
                  ? "flex h-4 w-4 items-center justify-center rounded-circle bg-teal-50"
                  : "flex h-4 w-4 items-center justify-center rounded-circle bg-ember-50"
              }
            >
              {good ? (
                <Check className="h-2.5 w-2.5 text-teal-400" strokeWidth={3} />
              ) : (
                <X className="h-2.5 w-2.5 text-ember-500" strokeWidth={3} />
              )}
            </span>
            <span className={good ? "text-teal-700" : "text-steel-700"}>{label}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  </div>
);

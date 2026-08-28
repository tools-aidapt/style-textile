import React from "react";

function ensureSpinnerStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="spinner"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "spinner");
  s.textContent = `
.ads-spinner{display:inline-block;border-radius:50%;vertical-align:middle;
  border:2.5px solid var(--mist-200);border-top-color:var(--teal-400);
  animation:ads-spin .72s linear infinite;}
.ads-spinner--ondark{border-color:rgba(255,255,255,0.25);border-top-color:var(--cyan-300);}
@keyframes ads-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.ads-spinner{animation-duration:1.5s}}
`;
  document.head.appendChild(s);
}

const SIZES = { xs: 14, sm: 18, md: 24, lg: 36 };

/** Indeterminate ring spinner for inline loading. */
export function Spinner({ size = "md", onDark = false, className = "", label = "Loading", ...rest }) {
  ensureSpinnerStyles();
  const px = SIZES[size] || 24;
  return (
    <span
      className={["ads-spinner", onDark ? "ads-spinner--ondark" : "", className].filter(Boolean).join(" ")}
      style={{ width: px, height: px, borderWidth: Math.max(2, px / 9) }}
      role="status"
      aria-label={label}
      {...rest}
    />
  );
}

export default Spinner;

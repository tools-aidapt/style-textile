import React from "react";

function ensureProgressStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="progress"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "progress");
  s.textContent = `
.ads-progress{display:flex;flex-direction:column;gap:6px;font-family:var(--font-sans);}
.ads-progress__head{display:flex;justify-content:space-between;align-items:baseline;}
.ads-progress__label{font-size:var(--fs-body-sm);font-weight:var(--fw-medium);color:var(--text-primary);}
.ads-progress__val{font:500 var(--fs-caption)/1 var(--font-mono);color:var(--text-secondary);font-variant-numeric:tabular-nums;}
.ads-progress__track{height:8px;border-radius:var(--radius-pill);background:var(--mist-100);overflow:hidden;}
.ads-progress--sm .ads-progress__track{height:5px;}
.ads-progress__fill{height:100%;border-radius:inherit;background:var(--teal-400);
  transition:width var(--dur-spring) var(--ease-spring);}
.ads-progress--success .ads-progress__fill{background:var(--success);}
.ads-progress--warning .ads-progress__fill{background:var(--warning);}
.ads-progress--error .ads-progress__fill{background:var(--error);}
.ads-progress--indeterminate .ads-progress__fill{width:38% !important;animation:ads-prog 1.3s var(--ease-standard) infinite;}
@keyframes ads-prog{0%{margin-left:-40%}100%{margin-left:100%}}
@media (prefers-reduced-motion:reduce){.ads-progress--indeterminate .ads-progress__fill{animation-duration:2.6s}}
`;
  document.head.appendChild(s);
}

/** Linear progress bar. Pass `value` (0–100) or `indeterminate`. */
export function Progress({ value = 0, max = 100, variant = "teal", size = "md", label, showValue = false, indeterminate = false, className = "", ...rest }) {
  ensureProgressStyles();
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const cls = ["ads-progress", `ads-progress--${variant}`, size === "sm" ? "ads-progress--sm" : "", indeterminate ? "ads-progress--indeterminate" : "", className].filter(Boolean).join(" ");
  return (
    <div className={cls} {...rest}>
      {(label || showValue) && (
        <div className="ads-progress__head">
          {label && <span className="ads-progress__label">{label}</span>}
          {showValue && !indeterminate && <span className="ads-progress__val">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="ads-progress__track" role="progressbar" aria-valuenow={indeterminate ? undefined : Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="ads-progress__fill" style={{ width: indeterminate ? undefined : `${pct}%` }} />
      </div>
    </div>
  );
}

export default Progress;

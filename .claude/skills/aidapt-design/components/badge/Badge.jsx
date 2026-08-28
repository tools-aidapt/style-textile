import React from "react";

function ensureBadgeStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="badge"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "badge");
  s.textContent = `
.ads-badge{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-sans);
  font-weight:var(--fw-semibold);font-size:var(--fs-caption);line-height:1;
  padding:5px 10px;border-radius:var(--radius-pill);white-space:nowrap;
  border:var(--border-hairline) solid transparent;}
.ads-badge--sm{font-size:11px;padding:3px 8px;}
.ads-badge__dot{width:7px;height:7px;border-radius:50%;background:currentColor;flex:none;}
/* soft (default) */
.ads-badge--neutral{background:var(--mist-100);color:var(--steel-700);}
.ads-badge--teal{background:var(--teal-50);color:var(--teal-700);}
.ads-badge--info{background:var(--info-surface);color:var(--info-text);}
.ads-badge--success{background:var(--success-surface);color:var(--success-text);}
.ads-badge--warning{background:var(--warning-surface);color:var(--warning-text);}
.ads-badge--error{background:var(--error-surface);color:var(--error-text);}
/* solid */
.ads-badge--solid.ads-badge--neutral{background:var(--ink-900);color:var(--white);}
.ads-badge--solid.ads-badge--teal{background:var(--teal-400);color:var(--ink-900);}
.ads-badge--solid.ads-badge--info{background:var(--info);color:var(--white);}
.ads-badge--solid.ads-badge--success{background:var(--success);color:var(--white);}
.ads-badge--solid.ads-badge--warning{background:var(--warning);color:var(--ink-900);}
.ads-badge--solid.ads-badge--error{background:var(--error);color:var(--white);}
/* outline */
.ads-badge--outline{background:transparent;border-color:var(--border-strong);color:var(--text-secondary);}
`;
  document.head.appendChild(s);
}

/** Compact status / category label. Soft by default; `solid` or `outline` for emphasis. */
export function Badge({ children, variant = "neutral", appearance = "soft", size = "md", dot = false, className = "", ...rest }) {
  ensureBadgeStyles();
  const cls = [
    "ads-badge",
    `ads-badge--${variant}`,
    appearance === "solid" ? "ads-badge--solid" : "",
    appearance === "outline" ? "ads-badge--outline" : "",
    size === "sm" ? "ads-badge--sm" : "",
    className,
  ].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {dot && <span className="ads-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export default Badge;

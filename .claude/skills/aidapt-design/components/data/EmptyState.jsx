import React from "react";

function ensureEmptyStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="empty"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "empty");
  s.textContent = `
.ads-empty{display:flex;flex-direction:column;align-items:center;text-align:center;
  padding:var(--space-12) var(--space-8);font-family:var(--font-sans);}
.ads-empty__icon{width:56px;height:56px;border-radius:var(--radius-xl);background:var(--teal-50);
  color:var(--teal-600);display:inline-flex;align-items:center;justify-content:center;margin-bottom:var(--space-5);}
.ads-empty__icon svg{width:26px;height:26px;}
.ads-empty__title{font:var(--fw-bold) var(--fs-h5)/var(--lh-h5) var(--font-display);letter-spacing:var(--ls-snug);
  color:var(--text-primary);margin:0;}
.ads-empty__desc{font-size:var(--fs-body-sm);line-height:1.55;color:var(--text-secondary);
  margin:var(--space-2) 0 0;max-width:42ch;}
.ads-empty__actions{display:flex;gap:var(--space-3);margin-top:var(--space-6);}
`;
  document.head.appendChild(s);
}

const defaultIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </svg>
);

/** Empty / zero-state for tables, lists, and search results. */
export function EmptyState({ icon, title, description, actions, className = "", ...rest }) {
  ensureEmptyStyles();
  return (
    <div className={["ads-empty", className].filter(Boolean).join(" ")} {...rest}>
      <span className="ads-empty__icon" aria-hidden="true">{icon || defaultIcon}</span>
      {title && <h3 className="ads-empty__title">{title}</h3>}
      {description && <p className="ads-empty__desc">{description}</p>}
      {actions && <div className="ads-empty__actions">{actions}</div>}
    </div>
  );
}

export default EmptyState;

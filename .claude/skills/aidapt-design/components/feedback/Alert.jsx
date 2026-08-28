import React from "react";

function ensureAlertStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="alert"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "alert");
  s.textContent = `
.ads-alert{display:flex;gap:var(--space-3);padding:var(--space-4);border-radius:var(--radius-md);
  border:var(--border-hairline) solid;font-family:var(--font-sans);
  background:var(--mist-50);border-color:var(--border-default);
  animation:ads-alert-in var(--dur-base) var(--ease-entrance);}
@keyframes ads-alert-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.ads-alert{animation:ads-alert-fade var(--dur-fade) ease}}
@keyframes ads-alert-fade{from{opacity:0}to{opacity:1}}
.ads-alert--info{background:var(--info-surface);border-color:color-mix(in oklch,var(--info) 28%,transparent);}
.ads-alert--success{background:var(--success-surface);border-color:color-mix(in oklch,var(--success) 30%,transparent);}
.ads-alert--warning{background:var(--warning-surface);border-color:color-mix(in oklch,var(--warning) 38%,transparent);}
.ads-alert--error{background:var(--error-surface);border-color:color-mix(in oklch,var(--error) 30%,transparent);}
.ads-alert__icon{flex:none;width:20px;height:20px;margin-top:1px;}
.ads-alert__icon svg{width:20px;height:20px;display:block;}
.ads-alert--info .ads-alert__icon{color:var(--info);}
.ads-alert--success .ads-alert__icon{color:var(--success);}
.ads-alert--warning .ads-alert__icon{color:var(--warning-500);}
.ads-alert--error .ads-alert__icon{color:var(--error);}
.ads-alert--neutral .ads-alert__icon{color:var(--steel-600);}
.ads-alert__body{flex:1;min-width:0;}
.ads-alert__title{font-size:var(--fs-body);font-weight:var(--fw-semibold);color:var(--text-primary);margin:0;}
.ads-alert__msg{font-size:var(--fs-body-sm);line-height:1.5;color:var(--text-secondary);margin:3px 0 0;}
.ads-alert__actions{display:flex;gap:var(--space-3);margin-top:var(--space-3);}
.ads-alert__x{flex:none;border:none;background:transparent;cursor:pointer;color:var(--text-tertiary);
  width:24px;height:24px;border-radius:var(--radius-sm);display:inline-flex;align-items:center;justify-content:center;
  margin:-2px -2px 0 0;transition:var(--transition-colors);}
.ads-alert__x:hover{color:var(--text-primary);background:rgba(6,42,59,0.06);}
.ads-alert__x:active{transform:scale(.9);}
.ads-alert__x svg{width:15px;height:15px;}
`;
  document.head.appendChild(s);
}

const ICONS = {
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  success: <><circle cx="12" cy="12" r="10" /><polyline points="8.5 12.5 11 15 16 9" /></>,
  warning: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  error: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
  neutral: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
};

/** Inline contextual message tied to a region of the page. */
export function Alert({ variant = "info", title, children, actions, onClose, className = "", ...rest }) {
  ensureAlertStyles();
  return (
    <div className={["ads-alert", `ads-alert--${variant}`, className].filter(Boolean).join(" ")} role={variant === "error" ? "alert" : "status"} {...rest}>
      <span className="ads-alert__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS[variant]}</svg>
      </span>
      <div className="ads-alert__body">
        {title && <p className="ads-alert__title">{title}</p>}
        {children && <p className="ads-alert__msg">{children}</p>}
        {actions && <div className="ads-alert__actions">{actions}</div>}
      </div>
      {onClose && (
        <button type="button" className="ads-alert__x" aria-label="Dismiss" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      )}
    </div>
  );
}

export default Alert;

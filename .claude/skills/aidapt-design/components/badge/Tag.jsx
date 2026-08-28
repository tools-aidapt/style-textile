import React from "react";

function ensureTagStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="tag"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "tag");
  s.textContent = `
.ads-tag{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-sans);
  font-weight:var(--fw-medium);font-size:var(--fs-body-sm);line-height:1;color:var(--text-primary);
  background:var(--mist-50);border:var(--border-hairline) solid var(--border-default);
  border-radius:var(--radius-sm);padding:6px 10px;white-space:nowrap;}
.ads-tag--selectable{cursor:pointer;transition:var(--transition-colors),transform var(--dur-spring) var(--ease-spring);}
.ads-tag--selectable:hover{border-color:var(--teal-400);background:var(--teal-50);}
.ads-tag--selectable:active{transform:scale(.96);transition:var(--transition-colors),transform var(--dur-press) var(--ease-press);}
.ads-tag--selected{background:var(--teal-50);border-color:var(--teal-400);color:var(--teal-700);}
.ads-tag__x{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;
  margin:-2px -4px -2px 0;border:none;background:transparent;color:var(--text-tertiary);
  cursor:pointer;border-radius:var(--radius-xs);padding:0;transition:var(--transition-colors);}
.ads-tag__x:hover{color:var(--error-600);background:var(--error-surface);}
.ads-tag__x:active{transform:scale(.88);}
.ads-tag__x svg{width:13px;height:13px;}
.ads-tag__lead{display:inline-flex;color:var(--teal-600);}
.ads-tag__lead svg{width:14px;height:14px;}
`;
  document.head.appendChild(s);
}

/** Chip for filters, keywords, and selections. Optionally removable or selectable. */
export function Tag({ children, lead = null, onRemove, selectable = false, selected = false, className = "", ...rest }) {
  ensureTagStyles();
  const cls = [
    "ads-tag",
    selectable ? "ads-tag--selectable" : "",
    selected ? "ads-tag--selected" : "",
    className,
  ].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {lead && <span className="ads-tag__lead">{lead}</span>}
      {children}
      {onRemove && (
        <button type="button" className="ads-tag__x" aria-label="Remove" onClick={onRemove}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </span>
  );
}

export default Tag;

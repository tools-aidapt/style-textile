import React from "react";

function ensureCheckboxStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="checkbox"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "checkbox");
  s.textContent = `
.ads-check{display:inline-flex;align-items:flex-start;gap:var(--space-2);cursor:pointer;
  font-family:var(--font-sans);font-size:var(--fs-body);color:var(--text-primary);line-height:1.4;}
.ads-check input{position:absolute;opacity:0;width:1px;height:1px;}
.ads-check__box{flex:none;width:20px;height:20px;margin-top:1px;border:var(--border-thin) solid var(--border-strong);
  border-radius:var(--radius-sm);background:var(--white);display:inline-flex;align-items:center;justify-content:center;
  transition:var(--transition-colors),transform var(--dur-spring) var(--ease-spring);}
.ads-check__box svg{width:13px;height:13px;color:var(--ink-900);opacity:0;transform:scale(.5);
  transition:opacity var(--dur-fast) var(--ease-standard),transform var(--dur-spring-bounce) var(--ease-spring-bounce);}
/* Pointer-down: the box compresses instantly; release springs it home */
.ads-check:active input:not(:disabled) + .ads-check__box{transform:scale(.9);transition:var(--transition-colors),transform var(--dur-press) var(--ease-press);}
.ads-check:hover input:not(:disabled) + .ads-check__box{border-color:var(--teal-400);}
.ads-check input:checked + .ads-check__box{background:var(--teal-400);border-color:var(--teal-400);}
.ads-check input:checked + .ads-check__box svg{opacity:1;transform:scale(1);}
.ads-check input:indeterminate + .ads-check__box{background:var(--teal-400);border-color:var(--teal-400);}
.ads-check input:focus-visible + .ads-check__box{box-shadow:var(--ring);}
.ads-check input:disabled ~ .ads-check__box{background:var(--mist-100);border-color:var(--border-default);}
.ads-check input:disabled ~ *{opacity:.55;cursor:not-allowed;}
.ads-check--disabled{cursor:not-allowed;}
`;
  document.head.appendChild(s);
}

/** Checkbox with label. Controlled via `checked` or uncontrolled via `defaultChecked`. */
export function Checkbox({ label, checked, defaultChecked, disabled = false, className = "", ...rest }) {
  ensureCheckboxStyles();
  return (
    <label className={["ads-check", disabled ? "ads-check--disabled" : "", className].filter(Boolean).join(" ")}>
      <input type="checkbox" checked={checked} defaultChecked={defaultChecked} disabled={disabled} {...rest} />
      <span className="ads-check__box" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}

export default Checkbox;

import React from "react";

function ensureSwitchStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="switch"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "switch");
  s.textContent = `
.ads-switch{display:inline-flex;align-items:center;gap:var(--space-2);cursor:pointer;
  font-family:var(--font-sans);font-size:var(--fs-body);color:var(--text-primary);}
.ads-switch input{position:absolute;opacity:0;width:1px;height:1px;}
.ads-switch__track{flex:none;width:42px;height:24px;border-radius:var(--radius-pill);background:var(--mist-300);
  position:relative;transition:var(--transition-colors);}
.ads-switch__knob{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:var(--radius-pill);background:var(--white);
  box-shadow:var(--shadow-sm);transition:transform var(--dur-spring-bounce) var(--ease-spring-bounce),width var(--dur-fast) var(--ease-standard);}
.ads-switch:hover input:not(:disabled) + .ads-switch__track{background:var(--mist-400);}
.ads-switch input:checked + .ads-switch__track{background:var(--teal-400);}
.ads-switch:hover input:checked:not(:disabled) + .ads-switch__track{background:var(--teal-500);}
.ads-switch input:checked + .ads-switch__track .ads-switch__knob{transform:translateX(18px);}
/* Pointer-down: the knob stretches toward the direction of travel (release springs it home) */
.ads-switch:active input:not(:disabled) + .ads-switch__track .ads-switch__knob{width:24px;}
.ads-switch:active input:checked:not(:disabled) + .ads-switch__track .ads-switch__knob{transform:translateX(14px);}
.ads-switch input:focus-visible + .ads-switch__track{box-shadow:var(--ring);}
.ads-switch input:disabled ~ *{opacity:.55;cursor:not-allowed;}
`;
  document.head.appendChild(s);
}

/** On/off toggle. Use for instant settings; use Checkbox for form submission. */
export function Switch({ label, checked, defaultChecked, disabled = false, className = "", ...rest }) {
  ensureSwitchStyles();
  return (
    <label className={["ads-switch", className].filter(Boolean).join(" ")}>
      <input type="checkbox" role="switch" checked={checked} defaultChecked={defaultChecked} disabled={disabled} {...rest} />
      <span className="ads-switch__track" aria-hidden="true"><span className="ads-switch__knob" /></span>
      {label && <span>{label}</span>}
    </label>
  );
}

export default Switch;

import React from "react";

function ensureRadioStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="radio"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "radio");
  s.textContent = `
.ads-radio{display:inline-flex;align-items:flex-start;gap:var(--space-2);cursor:pointer;
  font-family:var(--font-sans);font-size:var(--fs-body);color:var(--text-primary);line-height:1.4;}
.ads-radio input{position:absolute;opacity:0;width:1px;height:1px;}
.ads-radio__dot{flex:none;width:20px;height:20px;margin-top:1px;border:var(--border-thin) solid var(--border-strong);
  border-radius:50%;background:var(--white);display:inline-flex;align-items:center;justify-content:center;
  transition:var(--transition-colors),transform var(--dur-spring) var(--ease-spring);}
.ads-radio__dot::after{content:"";width:9px;height:9px;border-radius:50%;background:var(--ink-900);
  opacity:0;transform:scale(.3);transition:opacity var(--dur-fast) var(--ease-standard),transform var(--dur-spring-bounce) var(--ease-spring-bounce);}
.ads-radio:active input:not(:disabled) + .ads-radio__dot{transform:scale(.9);transition:var(--transition-colors),transform var(--dur-press) var(--ease-press);}
.ads-radio:hover input:not(:disabled) + .ads-radio__dot{border-color:var(--teal-400);}
.ads-radio input:checked + .ads-radio__dot{background:var(--teal-400);border-color:var(--teal-400);}
.ads-radio input:checked + .ads-radio__dot::after{opacity:1;transform:scale(1);}
.ads-radio input:focus-visible + .ads-radio__dot{box-shadow:var(--ring);}
.ads-radio input:disabled ~ *{opacity:.55;cursor:not-allowed;}
`;
  document.head.appendChild(s);
}

/** Radio option with label. Group several with the same `name`. */
export function Radio({ label, checked, defaultChecked, disabled = false, className = "", ...rest }) {
  ensureRadioStyles();
  return (
    <label className={["ads-radio", className].filter(Boolean).join(" ")}>
      <input type="radio" checked={checked} defaultChecked={defaultChecked} disabled={disabled} {...rest} />
      <span className="ads-radio__dot" aria-hidden="true" />
      {label && <span>{label}</span>}
    </label>
  );
}

export default Radio;

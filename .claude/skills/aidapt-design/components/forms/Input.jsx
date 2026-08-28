import React from "react";

/* Shared field styling — injected once, deduped by data-ads key. */
export function ensureFieldStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="field"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "field");
  s.textContent = `
.ads-field{
  width:100%;box-sizing:border-box;font-family:var(--font-sans);font-size:var(--fs-body);
  color:var(--text-primary);background:var(--white);
  border:var(--border-thin) solid var(--border-default);border-radius:var(--radius-md);
  height:44px;padding:0 var(--space-3);
  transition:var(--transition-colors),box-shadow var(--dur-base) var(--ease-spring);
}
.ads-field::placeholder{color:var(--text-tertiary);}
.ads-field:hover:not(:disabled):not(:focus){border-color:var(--border-strong);}
.ads-field:focus{outline:none;border-color:var(--teal-400);box-shadow:var(--ring);}
.ads-field:disabled{background:var(--mist-50);color:var(--text-disabled);cursor:not-allowed;}
.ads-field--error{border-color:var(--error-600);}
.ads-field--error:focus{border-color:var(--error-600);box-shadow:0 0 0 3px color-mix(in oklch,var(--error-600) 35%,transparent);}
.ads-field--with-prefix{padding-left:var(--space-9,38px);}
textarea.ads-field{height:auto;min-height:104px;padding:var(--space-3);line-height:var(--lh-normal);resize:vertical;}
select.ads-field{appearance:none;-webkit-appearance:none;padding-right:38px;cursor:pointer;
  touch-action:manipulation;-webkit-tap-highlight-color:transparent;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235A6B72' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 12px center;}
.ads-field-wrap{position:relative;display:block;}
.ads-field-wrap .ads-field-prefix{position:absolute;left:12px;top:50%;transform:translateY(-50%);
  display:inline-flex;color:var(--text-tertiary);pointer-events:none;}
.ads-field-wrap .ads-field-prefix svg{width:18px;height:18px;display:block;}
`;
  document.head.appendChild(s);
}

/** Single-line text input. Pair inside <FormField> for label/help/error. */
export function Input({ invalid = false, prefix = null, className = "", type = "text", ...rest }) {
  ensureFieldStyles();
  const cls = ["ads-field", invalid ? "ads-field--error" : "", prefix ? "ads-field--with-prefix" : "", className]
    .filter(Boolean).join(" ");
  const input = <input type={type} className={cls} aria-invalid={invalid || undefined} {...rest} />;
  if (!prefix) return input;
  return (
    <span className="ads-field-wrap">
      <span className="ads-field-prefix">{prefix}</span>
      {input}
    </span>
  );
}

export default Input;

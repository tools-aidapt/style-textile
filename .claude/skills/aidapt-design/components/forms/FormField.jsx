import React from "react";

function ensureFormFieldStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="formfield"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "formfield");
  s.textContent = `
.ads-formfield{display:flex;flex-direction:column;gap:var(--space-1-5);font-family:var(--font-sans);}
.ads-formfield__label{font-size:var(--fs-body-sm);font-weight:var(--fw-semibold);color:var(--text-primary);
  display:inline-flex;align-items:center;gap:6px;}
.ads-formfield__req{color:var(--teal-600);font-weight:var(--fw-bold);}
.ads-formfield__optional{color:var(--text-tertiary);font-weight:var(--fw-regular);font-size:var(--fs-caption);}
.ads-formfield__help{font-size:var(--fs-caption);color:var(--text-secondary);line-height:1.4;}
.ads-formfield__error{font-size:var(--fs-caption);color:var(--error-text);line-height:1.4;
  display:inline-flex;align-items:center;gap:5px;}
.ads-formfield__error svg{width:13px;height:13px;flex:none;}
`;
  document.head.appendChild(s);
}

/** Field wrapper: label + control + help/error. Wrap any Input/Select/Textarea/toggle. */
export function FormField({ label, htmlFor, required = false, optional = false, help, error, children, className = "" }) {
  ensureFormFieldStyles();
  const showError = Boolean(error);
  return (
    <div className={["ads-formfield", className].filter(Boolean).join(" ")}>
      {label && (
        <label className="ads-formfield__label" htmlFor={htmlFor}>
          {label}
          {required && <span className="ads-formfield__req" aria-hidden="true">*</span>}
          {optional && !required && <span className="ads-formfield__optional">Optional</span>}
        </label>
      )}
      {children}
      {help && !showError && <span className="ads-formfield__help">{help}</span>}
      {showError && (
        <span className="ads-formfield__error" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
}

export default FormField;

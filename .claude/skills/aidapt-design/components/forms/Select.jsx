import React from "react";
import { ensureFieldStyles } from "./Input.jsx";

/** Native select with the brand chevron affordance. Pass <option> children. */
export function Select({ invalid = false, className = "", children, ...rest }) {
  ensureFieldStyles();
  const cls = ["ads-field", invalid ? "ads-field--error" : "", className].filter(Boolean).join(" ");
  return (
    <select className={cls} aria-invalid={invalid || undefined} {...rest}>
      {children}
    </select>
  );
}

export default Select;

import React from "react";
import { ensureFieldStyles } from "./Input.jsx";

/** Multi-line text input; vertically resizable. */
export function Textarea({ invalid = false, className = "", rows = 4, ...rest }) {
  ensureFieldStyles();
  const cls = ["ads-field", invalid ? "ads-field--error" : "", className].filter(Boolean).join(" ");
  return <textarea className={cls} rows={rows} aria-invalid={invalid || undefined} {...rest} />;
}

export default Textarea;

import * as React from "react";

/** Checkbox with an inline label. Use `checked`+`onChange` (controlled) or `defaultChecked`. */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Inline label text/node. */
  label?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
}

export declare function Checkbox(props: CheckboxProps): React.ReactElement;
export default Checkbox;

import * as React from "react";

/** Single-line text input. Pair inside FormField for label, help, and error text. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Show the error border + aria-invalid. */
  invalid?: boolean;
  /** Optional leading icon node rendered inside the field. */
  prefix?: React.ReactNode;
}

export declare function Input(props: InputProps): React.ReactElement;
export default Input;

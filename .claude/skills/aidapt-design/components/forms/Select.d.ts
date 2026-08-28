import * as React from "react";

/** Native select styled with the brand chevron. Pass <option> children. */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Show the error border + aria-invalid. */
  invalid?: boolean;
  children?: React.ReactNode;
}

export declare function Select(props: SelectProps): React.ReactElement;
export default Select;

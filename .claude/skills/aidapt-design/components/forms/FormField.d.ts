import * as React from "react";

/** Field wrapper providing label, required/optional marker, help text and error text. */
export interface FormFieldProps {
  /** Field label. */
  label?: React.ReactNode;
  /** Associates the label with a control id. */
  htmlFor?: string;
  /** Show a teal required asterisk. */
  required?: boolean;
  /** Show an "Optional" hint (ignored if required). */
  optional?: boolean;
  /** Helper text shown below the control when there is no error. */
  help?: React.ReactNode;
  /** Error text; replaces help and shows the error icon + role=alert. */
  error?: React.ReactNode;
  /** The control (Input, Select, Textarea, etc). */
  children?: React.ReactNode;
  className?: string;
}

export declare function FormField(props: FormFieldProps): React.ReactElement;
export default FormField;

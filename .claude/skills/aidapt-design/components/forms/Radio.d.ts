import * as React from "react";

/** Radio option with label. Group options by sharing the same `name`. */
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Inline label text/node. */
  label?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
}

export declare function Radio(props: RadioProps): React.ReactElement;
export default Radio;

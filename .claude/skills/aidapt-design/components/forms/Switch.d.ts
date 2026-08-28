import * as React from "react";

/** On/off toggle for instant settings. For form submission prefer Checkbox. */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Inline label text/node. */
  label?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
}

export declare function Switch(props: SwitchProps): React.ReactElement;
export default Switch;

import * as React from "react";

/** Indeterminate ring spinner for inline loading states. */
export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** @default "md" */
  size?: "xs" | "sm" | "md" | "lg";
  /** Use the light-on-dark ring (cyan on translucent white). */
  onDark?: boolean;
  /** Accessible label. @default "Loading" */
  label?: string;
}

export declare function Spinner(props: SpinnerProps): React.ReactElement;
export default Spinner;

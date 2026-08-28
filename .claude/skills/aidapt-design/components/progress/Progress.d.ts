import * as React from "react";

/** Linear progress bar. Provide `value` (0–max) or set `indeterminate`. */
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current value. @default 0 */
  value?: number;
  /** @default 100 */
  max?: number;
  /** @default "teal" */
  variant?: "teal" | "success" | "warning" | "error";
  /** @default "md" */
  size?: "sm" | "md";
  /** Label shown above the track. */
  label?: React.ReactNode;
  /** Show the percentage on the right. */
  showValue?: boolean;
  /** Unknown-duration animated state. */
  indeterminate?: boolean;
}

export declare function Progress(props: ProgressProps): React.ReactElement;
export default Progress;

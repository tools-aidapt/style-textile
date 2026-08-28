import * as React from "react";

/** Inline contextual message tied to a region of the page. */
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @default "info" */
  variant?: "info" | "success" | "warning" | "error" | "neutral";
  /** Bold first line. */
  title?: React.ReactNode;
  /** Supporting message (children). */
  children?: React.ReactNode;
  /** Action row (e.g. ghost buttons). */
  actions?: React.ReactNode;
  /** Supply to render a dismiss (×) button. */
  onClose?: () => void;
}

export declare function Alert(props: AlertProps): React.ReactElement;
export default Alert;

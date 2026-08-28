import * as React from "react";

/** Transient floating notification. Render inside your own positioned viewport (e.g. fixed bottom-right). */
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @default "info" */
  variant?: "info" | "success" | "warning" | "error";
  /** Bold first line. */
  title?: React.ReactNode;
  /** Supporting message (children). */
  children?: React.ReactNode;
  /** Supply to render a dismiss (×) button. */
  onClose?: () => void;
}

export declare function Toast(props: ToastProps): React.ReactElement;
export default Toast;

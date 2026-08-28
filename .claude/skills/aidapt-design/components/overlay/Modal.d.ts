import * as React from "react";

/** Centered modal dialog over a Deep-Flow scrim with blur. */
export interface ModalProps {
  /** Whether the dialog is shown. @default true */
  open?: boolean;
  /** Close handler — fires on scrim click and the × button. */
  onClose?: () => void;
  /** Dialog title (Manrope h4). */
  title?: React.ReactNode;
  /** Subtitle under the title. */
  subtitle?: React.ReactNode;
  /** Body content. */
  children?: React.ReactNode;
  /** Footer actions (right-aligned). */
  footer?: React.ReactNode;
  /** Render just the panel inline (no fixed scrim) — for documentation/embedding. */
  static?: boolean;
  /** Override max width (px or CSS). */
  maxWidth?: number | string;
  className?: string;
}

export declare function Modal(props: ModalProps): React.ReactElement | null;
export default Modal;

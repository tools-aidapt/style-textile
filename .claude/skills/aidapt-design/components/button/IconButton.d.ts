import * as React from "react";

/** Square, icon-only button. Always pass an accessible `label`. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon node (inherits currentColor + sizes to the button). */
  icon: React.ReactNode;
  /** Accessible label — required (used for aria-label + title). */
  label: string;
  /** @default "ghost" */
  variant?: "ghost" | "primary" | "outline";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export declare function IconButton(props: IconButtonProps): React.ReactElement;
export default IconButton;

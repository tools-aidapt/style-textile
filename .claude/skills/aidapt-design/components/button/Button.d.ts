import * as React from "react";

/**
 * The primary action primitive. Teal `primary` is the default; reach for the
 * Ember `cta` only for the single most important action on a view (Fire ≤5%).
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual role. @default "primary" */
  variant?: "primary" | "cta" | "secondary" | "ghost" | "destructive";
  /** Control height. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Disable interaction and dim. */
  disabled?: boolean;
  /** Show a spinner and block input; preserves width. */
  loading?: boolean;
  /** Stretch to the container width. */
  fullWidth?: boolean;
  /** Icon node rendered before the label (inherits currentColor). */
  iconLeft?: React.ReactNode;
  /** Icon node rendered after the label. */
  iconRight?: React.ReactNode;
  /** Render as another element/component (e.g. "a"). @default "button" */
  as?: React.ElementType;
  children?: React.ReactNode;
}

export declare function Button(props: ButtonProps): React.ReactElement;
export default Button;

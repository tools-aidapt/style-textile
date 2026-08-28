import * as React from "react";

/** Compact status or category label. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Colour role. @default "neutral" */
  variant?: "neutral" | "teal" | "info" | "success" | "warning" | "error";
  /** Fill style. @default "soft" */
  appearance?: "soft" | "solid" | "outline";
  /** @default "md" */
  size?: "sm" | "md";
  /** Show a leading status dot. */
  dot?: boolean;
  children?: React.ReactNode;
}

export declare function Badge(props: BadgeProps): React.ReactElement;
export default Badge;

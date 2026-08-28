import * as React from "react";

/** Hover/focus tooltip. Wrap a single focusable trigger; text goes in `label`. */
export interface TooltipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Tooltip text/content. */
  label: React.ReactNode;
  /** @default "top" */
  placement?: "top" | "bottom" | "left" | "right";
  /** The trigger element. */
  children?: React.ReactNode;
}

export declare function Tooltip(props: TooltipProps): React.ReactElement;
export default Tooltip;

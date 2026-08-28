import * as React from "react";

/** Full-width page-level announcement bar. */
export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** neutral · teal (Water hero) · deep (Deep Flow) · gradient (cropped sweep). @default "neutral" */
  variant?: "neutral" | "teal" | "deep" | "gradient";
  /** Message content. */
  children?: React.ReactNode;
  /** Trailing action row (e.g. a single Ember CTA). */
  actions?: React.ReactNode;
  /** Supply to render a dismiss (×) button. */
  onClose?: () => void;
  /** Add film grain (only meaningful on deep/gradient). */
  grain?: boolean;
}

export declare function Banner(props: BannerProps): React.ReactElement;
export default Banner;

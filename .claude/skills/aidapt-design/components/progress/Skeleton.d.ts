import * as React from "react";

/** Loading placeholder with a shimmer sweep. */
export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** @default "text" */
  variant?: "text" | "circle" | "rect";
  /** CSS width (e.g. "100%", 120). */
  width?: number | string;
  /** CSS height (e.g. 40). Defaults sensibly for text. */
  height?: number | string;
  /** For text: number of lines (last line is shortened). @default 1 */
  lines?: number;
}

export declare function Skeleton(props: SkeletonProps): React.ReactElement;
export default Skeleton;

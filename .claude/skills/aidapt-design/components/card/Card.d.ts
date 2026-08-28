import * as React from "react";

/**
 * Content surface — white, hairline border, quiet Deep-Flow-tinted shadow.
 * Compose freely with children, or use the header/footer props.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** default (hairline + sm shadow) · outline (no shadow) · elevated (md shadow). @default "default" */
  variant?: "default" | "outline" | "elevated";
  /** Lift on hover + pointer cursor. */
  interactive?: boolean;
  /** Add a 3px teal top keyline. */
  accent?: boolean;
  /** Inner padding. @default "md" */
  padding?: "md" | "lg";
  /** Uppercase teal eyebrow above the title. */
  eyebrow?: React.ReactNode;
  /** Card title (Manrope h5). */
  title?: React.ReactNode;
  /** Subtitle under the title. */
  subtitle?: React.ReactNode;
  /** Footer row (e.g. buttons), laid out with gap. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export declare function Card(props: CardProps): React.ReactElement;
export default Card;

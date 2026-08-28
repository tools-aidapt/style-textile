import * as React from "react";

/** Chip for filters, keywords and selections. Removable and/or selectable. */
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Optional leading icon node (rendered teal). */
  lead?: React.ReactNode;
  /** Supply to render a remove (×) button; called on click. */
  onRemove?: () => void;
  /** Enable hover/selected affordance. */
  selectable?: boolean;
  /** Selected state (teal). */
  selected?: boolean;
  children?: React.ReactNode;
}

export declare function Tag(props: TagProps): React.ReactElement;
export default Tag;

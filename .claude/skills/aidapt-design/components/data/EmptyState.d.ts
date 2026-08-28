import * as React from "react";

/** Empty / zero-state for tables, lists, and search results. */
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon node (defaults to a folder). Rendered in a teal tile. */
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Action row (e.g. a primary + ghost button). */
  actions?: React.ReactNode;
}

export declare function EmptyState(props: EmptyStateProps): React.ReactElement;
export default EmptyState;

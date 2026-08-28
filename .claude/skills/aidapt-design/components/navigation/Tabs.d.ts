import * as React from "react";

export interface TabItem {
  /** Unique id, used as the controlled value. */
  id: string;
  label: React.ReactNode;
  /** Optional leading icon node. */
  icon?: React.ReactNode;
  /** Optional count pill. */
  count?: number;
  disabled?: boolean;
}

/** Underlined tab bar (controlled). */
export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  tabs: TabItem[];
  /** Currently selected tab id. */
  value: string;
  /** Fired with the new tab id. */
  onChange?: (id: string) => void;
}

export declare function Tabs(props: TabsProps): React.ReactElement;
export default Tabs;

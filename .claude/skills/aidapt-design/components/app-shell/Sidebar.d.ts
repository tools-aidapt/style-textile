import * as React from "react";

export interface SidebarItem {
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Trailing count pill. */
  badge?: React.ReactNode;
  active?: boolean;
  href?: string;
}

export interface SidebarGroup {
  /** Optional uppercase section heading. */
  title?: React.ReactNode;
  items: SidebarItem[];
}

/** Vertical app navigation rail (light or dark). */
export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  groups: SidebarGroup[];
  /** @default "light" */
  theme?: "light" | "dark";
  /** Fired with the item when a non-link item is clicked. */
  onSelect?: (item: SidebarItem) => void;
}

export declare function Sidebar(props: SidebarProps): React.ReactElement;
export default Sidebar;

import * as React from "react";

export interface NavLink {
  label: React.ReactNode;
  href?: string;
  active?: boolean;
}

/** App top navigation bar. */
export interface TopNavProps extends React.HTMLAttributes<HTMLElement> {
  /** Brand/logo node (e.g. an <img>). */
  logo?: React.ReactNode;
  /** Center nav links. */
  items?: NavLink[];
  /** Right-aligned actions (buttons, avatar). */
  actions?: React.ReactNode;
  /** @default "light" */
  theme?: "light" | "dark";
  /** Fired with the item when a non-link item is clicked. */
  onSelect?: (item: NavLink) => void;
}

export declare function TopNav(props: TopNavProps): React.ReactElement;
export default TopNav;

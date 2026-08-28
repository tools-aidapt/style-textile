import * as React from "react";

export interface Crumb {
  label: React.ReactNode;
  /** Link target; omit (or for the last item) to render as plain current text. */
  href?: string;
}

/** Breadcrumb trail; the separator is the brand chevron (from > to). */
export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: Crumb[];
}

export declare function Breadcrumbs(props: BreadcrumbsProps): React.ReactElement;
export default Breadcrumbs;

import * as React from "react";

/** Page navigation with truncation. Controlled via `page` (1-based). */
export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  /** Current page, 1-based. @default 1 */
  page?: number;
  /** Total number of pages. */
  total: number;
  /** Fired with the requested page. */
  onChange?: (page: number) => void;
}

export declare function Pagination(props: PaginationProps): React.ReactElement;
export default Pagination;

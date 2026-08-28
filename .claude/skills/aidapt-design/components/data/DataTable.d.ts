import * as React from "react";

export interface Column<Row = any> {
  /** Row property key (also the sort key). */
  key: string;
  /** Header label. */
  header: React.ReactNode;
  /** Right-align (also switches to tabular mono — use for numbers). */
  align?: "left" | "right";
  /** Show a sort affordance in the header. */
  sortable?: boolean;
  /** Fixed column width (CSS). */
  width?: number | string;
  /** Custom cell renderer; receives the row. */
  render?: (row: Row) => React.ReactNode;
}

/** Data table with sticky-style header, hover rows, and optional sort indicators. */
export interface DataTableProps<Row = any> extends React.HTMLAttributes<HTMLDivElement> {
  columns: Column<Row>[];
  /** Row objects; `id` is used as the key when present. */
  data: Row[];
  /** Highlight rows on hover (teal). @default true */
  hoverable?: boolean;
  /** Tighter row height. */
  dense?: boolean;
  /** Active sort {key, dir}. */
  sort?: { key: string; dir: "asc" | "desc" };
  /** Fired with the column key when a sortable header is clicked. */
  onSort?: (key: string) => void;
}

export declare function DataTable<Row = any>(props: DataTableProps<Row>): React.ReactElement;
export default DataTable;

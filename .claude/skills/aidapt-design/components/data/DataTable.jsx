import React from "react";

function ensureTableStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="table"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "table");
  s.textContent = `
.ads-table-wrap{border:var(--border-hairline) solid var(--border-default);border-radius:var(--radius-lg);
  overflow:hidden;background:var(--surface-card);font-family:var(--font-sans);}
.ads-table{width:100%;border-collapse:collapse;font-size:var(--fs-body-sm);}
.ads-table th{text-align:left;font-weight:var(--fw-semibold);font-size:var(--fs-caption);
  letter-spacing:var(--ls-wide);text-transform:uppercase;color:var(--text-tertiary);
  background:var(--mist-50);padding:11px var(--space-4);border-bottom:var(--border-hairline) solid var(--border-default);
  white-space:nowrap;}
.ads-table th.ads-num,.ads-table td.ads-num{text-align:right;font-variant-numeric:tabular-nums;font-family:var(--font-mono);}
.ads-table td{padding:13px var(--space-4);border-bottom:var(--border-hairline) solid var(--border-subtle);color:var(--text-primary);vertical-align:middle;}
.ads-table tbody tr:last-child td{border-bottom:none;}
.ads-table--hover tbody tr{transition:background var(--dur-fast) var(--ease-standard);}
.ads-table--hover tbody tr:hover{background:var(--teal-50);}
.ads-table--dense td{padding:8px var(--space-4);}
.ads-table--dense th{padding:8px var(--space-4);}
.ads-table th.ads-sortable{cursor:pointer;user-select:none;}
.ads-table th.ads-sortable:hover{color:var(--text-secondary);}
.ads-table th.ads-sortable:active{color:var(--text-primary);}
.ads-table__sort svg{transition:transform var(--dur-base) var(--ease-spring);}
.ads-table__sort{display:inline-flex;align-items:center;gap:5px;}
.ads-table__sort svg{width:13px;height:13px;opacity:.5;}
.ads-table__sort--active svg{opacity:1;color:var(--teal-600);}
`;
  document.head.appendChild(s);
}

/** Data table. `columns`: {key, header, align?: 'left'|'right', sortable?, render?(row)}. */
export function DataTable({ columns = [], data = [], hoverable = true, dense = false, sort, onSort, className = "", ...rest }) {
  ensureTableStyles();
  const cls = ["ads-table", hoverable ? "ads-table--hover" : "", dense ? "ads-table--dense" : ""].filter(Boolean).join(" ");
  return (
    <div className={["ads-table-wrap", className].filter(Boolean).join(" ")} {...rest}>
      <table className={cls}>
        <thead>
          <tr>
            {columns.map((c) => {
              const isNum = c.align === "right";
              const active = sort && sort.key === c.key;
              return (
                <th key={c.key} className={[isNum ? "ads-num" : "", c.sortable ? "ads-sortable" : ""].filter(Boolean).join(" ")}
                    style={c.width ? { width: c.width } : undefined}
                    onClick={c.sortable && onSort ? () => onSort(c.key) : undefined}>
                  {c.sortable ? (
                    <span className={["ads-table__sort", active ? "ads-table__sort--active" : ""].filter(Boolean).join(" ")}>
                      {c.header}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        {active && sort.dir === "asc" ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                      </svg>
                    </span>
                  ) : c.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={row.id ?? ri}>
              {columns.map((c) => (
                <td key={c.key} className={c.align === "right" ? "ads-num" : ""}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;

import React from "react";

function ensureBreadcrumbsStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="breadcrumbs"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "breadcrumbs");
  s.textContent = `
.ads-crumbs{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-family:var(--font-sans);font-size:var(--fs-body-sm);}
.ads-crumbs__item{color:var(--text-secondary);text-decoration:none;display:inline-flex;align-items:center;
  border-radius:var(--radius-xs);transition:var(--transition-colors);}
.ads-crumbs__item:hover{color:var(--teal-700);text-decoration:none;}
.ads-crumbs__item:active{color:var(--teal-800);}
.ads-crumbs__item--current{color:var(--text-primary);font-weight:var(--fw-semibold);pointer-events:none;}
.ads-crumbs__sep{color:var(--teal-400);font-weight:var(--fw-bold);font-size:0.9em;user-select:none;line-height:1;}
`;
  document.head.appendChild(s);
}

/** Breadcrumb trail. Separator is the brand chevron (from > to). Pass `items` of {label, href?}. */
export function Breadcrumbs({ items = [], className = "", ...rest }) {
  ensureBreadcrumbsStyles();
  return (
    <nav className={["ads-crumbs", className].filter(Boolean).join(" ")} aria-label="Breadcrumb" {...rest}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {it.href && !last
              ? <a className="ads-crumbs__item" href={it.href}>{it.label}</a>
              : <span className={`ads-crumbs__item${last ? " ads-crumbs__item--current" : ""}`} aria-current={last ? "page" : undefined}>{it.label}</span>}
            {!last && <span className="ads-crumbs__sep" aria-hidden="true">&rsaquo;</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;

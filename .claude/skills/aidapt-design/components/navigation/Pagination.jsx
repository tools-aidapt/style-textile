import React from "react";

function ensurePaginationStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="pagination"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "pagination");
  s.textContent = `
.ads-page{display:inline-flex;align-items:center;gap:4px;font-family:var(--font-sans);}
.ads-page__btn{min-width:36px;height:36px;padding:0 8px;border:var(--border-hairline) solid transparent;
  background:transparent;color:var(--text-secondary);font-size:var(--fs-body-sm);font-weight:var(--fw-medium);
  border-radius:var(--radius-md);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;
  transition:var(--transition-colors),transform var(--dur-spring) var(--ease-spring);font-variant-numeric:tabular-nums;}
.ads-page__btn:hover:not(:disabled):not(.ads-page__btn--active){background:var(--mist-50);color:var(--text-primary);}
.ads-page__btn:active:not(:disabled):not(.ads-page__btn--active){transform:scale(0.94);transition:var(--transition-colors),transform var(--dur-press) var(--ease-press);}
.ads-page__btn--active{background:var(--teal-400);color:var(--ink-900);font-weight:var(--fw-semibold);cursor:default;}
.ads-page__btn:focus-visible{outline:none;box-shadow:var(--ring);}
.ads-page__btn:disabled{color:var(--text-disabled);cursor:not-allowed;}
.ads-page__btn svg{width:16px;height:16px;}
.ads-page__gap{min-width:24px;text-align:center;color:var(--text-tertiary);user-select:none;}
`;
  document.head.appendChild(s);
}

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }

function pages(current, total) {
  if (total <= 7) return range(1, total);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

/** Page navigation. Controlled via `page` (1-based) + `onChange`. */
export function Pagination({ page = 1, total = 1, onChange, className = "", ...rest }) {
  ensurePaginationStyles();
  const go = (p) => { if (p >= 1 && p <= total && p !== page && onChange) onChange(p); };
  const Chevron = ({ dir }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={dir === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
    </svg>
  );
  return (
    <nav className={["ads-page", className].filter(Boolean).join(" ")} aria-label="Pagination" {...rest}>
      <button type="button" className="ads-page__btn" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Previous"><Chevron dir="left" /></button>
      {pages(page, total).map((p, i) =>
        p === "…"
          ? <span key={`g${i}`} className="ads-page__gap" aria-hidden="true">…</span>
          : <button key={p} type="button"
              className={["ads-page__btn", p === page ? "ads-page__btn--active" : ""].filter(Boolean).join(" ")}
              aria-current={p === page ? "page" : undefined} onClick={() => go(p)}>{p}</button>
      )}
      <button type="button" className="ads-page__btn" onClick={() => go(page + 1)} disabled={page >= total} aria-label="Next"><Chevron dir="right" /></button>
    </nav>
  );
}

export default Pagination;

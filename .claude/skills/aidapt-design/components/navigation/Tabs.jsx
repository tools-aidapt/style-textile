import React, { useLayoutEffect, useRef, useState } from "react";

function ensureTabsStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="tabs"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "tabs");
  s.textContent = `
.ads-tabs{display:flex;gap:var(--space-1);font-family:var(--font-sans);border-bottom:var(--border-hairline) solid var(--border-default);position:relative;}
.ads-tabs__tab{appearance:none;border:none;background:transparent;cursor:pointer;
  font-size:var(--fs-body-sm);font-weight:var(--fw-medium);color:var(--text-secondary);
  padding:var(--space-3) var(--space-4);position:relative;display:inline-flex;align-items:center;gap:8px;
  border-radius:var(--radius-sm) var(--radius-sm) 0 0;transition:var(--transition-colors);margin-bottom:-1px;}
.ads-tabs__tab svg{width:16px;height:16px;}
.ads-tabs__tab:hover:not(:disabled){color:var(--text-primary);background:var(--mist-50);}
.ads-tabs__tab:active:not(:disabled){color:var(--text-primary);background:var(--mist-100);}
.ads-tabs__tab--active{color:var(--teal-700);font-weight:var(--fw-semibold);}
.ads-tabs__tab:focus-visible{outline:none;box-shadow:var(--ring);}
.ads-tabs__tab:disabled{color:var(--text-disabled);cursor:not-allowed;}
/* Single shared indicator SPRINGS between tabs (measured, FLIP-style) */
.ads-tabs__ind{position:absolute;left:0;bottom:0;height:2px;background:var(--teal-400);border-radius:2px 2px 0 0;
  transition:transform var(--dur-spring) var(--ease-spring),width var(--dur-spring) var(--ease-spring);will-change:transform;}
.ads-tabs__count{font:500 11px/1 var(--font-mono);background:var(--mist-100);color:var(--steel-700);
  padding:2px 6px;border-radius:var(--radius-pill);}
.ads-tabs__tab--active .ads-tabs__count{background:var(--teal-100);color:var(--teal-800);}
`;
  document.head.appendChild(s);
}

/** Underlined tab bar; the indicator springs between tabs. Pass `tabs` ({id,label,icon?,count?}) + controlled `value`/`onChange`. */
export function Tabs({ tabs = [], value, onChange, className = "", ...rest }) {
  ensureTabsStyles();
  const wrapRef = useRef(null), firstRef = useRef(true);
  const [ind, setInd] = useState(null);
  const measure = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const el = wrap.querySelector('[data-active="true"]');
    if (!el) { setInd(null); return; }
    const inset = 12;
    setInd({ x: el.offsetLeft + inset, w: Math.max(el.offsetWidth - inset * 2, 8) });
  };
  useLayoutEffect(() => {
    measure();
    const raf = requestAnimationFrame(() => { firstRef.current = false; });
    return () => cancelAnimationFrame(raf);
  }, [value, tabs.map((t) => `${t.id}${t.label}${t.count ?? ""}`).join("|")]);
  useLayoutEffect(() => {
    const onR = () => measure();
    window.addEventListener("resize", onR);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onR).catch(() => {});
    return () => window.removeEventListener("resize", onR);
  }, []);
  return (
    <div ref={wrapRef} className={["ads-tabs", className].filter(Boolean).join(" ")} role="tablist" {...rest}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button key={t.id} type="button" role="tab" aria-selected={active} disabled={t.disabled} data-active={active ? "true" : undefined}
            className={["ads-tabs__tab", active ? "ads-tabs__tab--active" : ""].filter(Boolean).join(" ")}
            onClick={() => onChange && onChange(t.id)}>
            {t.icon && <span aria-hidden="true" style={{ display: "inline-flex" }}>{t.icon}</span>}
            {t.label}
            {t.count != null && <span className="ads-tabs__count">{t.count}</span>}
          </button>
        );
      })}
      {ind && <span className="ads-tabs__ind" aria-hidden="true"
        style={{ width: ind.w, transform: `translateX(${ind.x}px)`, transition: firstRef.current ? "none" : undefined }} />}
    </div>
  );
}

export default Tabs;

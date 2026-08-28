import React from "react";

function ensureTopNavStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="topnav"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "topnav");
  s.textContent = `
.ads-topnav{display:flex;align-items:center;gap:var(--space-6);height:64px;padding:0 var(--space-6);
  background:var(--surface-card);border-bottom:var(--border-hairline) solid var(--border-default);
  font-family:var(--font-sans);box-sizing:border-box;}
.ads-topnav__brand{display:inline-flex;align-items:center;flex:none;}
.ads-topnav__brand img{height:26px;width:auto;display:block;}
.ads-topnav__links{display:flex;align-items:center;gap:2px;flex:1;min-width:0;}
.ads-topnav__link{appearance:none;border:none;background:transparent;cursor:pointer;text-decoration:none;
  font-size:var(--fs-body-sm);font-weight:var(--fw-medium);color:var(--text-secondary);
  padding:8px var(--space-3);border-radius:var(--radius-md);transition:var(--transition-colors);white-space:nowrap;}
.ads-topnav__link:hover{color:var(--text-primary);background:var(--mist-50);}
.ads-topnav__link:active{color:var(--text-primary);background:var(--mist-100);}
.ads-topnav__link--active{color:var(--teal-700);font-weight:var(--fw-semibold);background:var(--teal-50);}
.ads-topnav__actions{display:flex;align-items:center;gap:var(--space-3);flex:none;}
/* Floating chrome: translucent material — content scrolls beneath (pair with sticky) */
.ads-topnav--material{background:var(--material-regular-bg);-webkit-backdrop-filter:blur(var(--material-blur-regular)) saturate(var(--material-saturate));backdrop-filter:blur(var(--material-blur-regular)) saturate(var(--material-saturate));border-bottom-color:var(--border-subtle);}
.ads-topnav--dark{background:var(--deepflow-900);border-bottom-color:rgba(255,255,255,0.1);}
.ads-topnav--dark .ads-topnav__link{color:var(--deepflow-200);}
.ads-topnav--dark .ads-topnav__link:hover{color:var(--white);background:rgba(255,255,255,0.07);}
.ads-topnav--dark .ads-topnav__link--active{color:var(--cyan-300);background:rgba(54,197,224,0.12);}
`;
  document.head.appendChild(s);
}

/** App top navigation bar. Pass a `logo` node, `items` ({label,href?,active}), and right-side `actions`. `material` renders it as floating translucent chrome. */
export function TopNav({ logo, items = [], actions, theme = "light", material = false, onSelect, className = "", ...rest }) {
  ensureTopNavStyles();
  return (
    <header className={["ads-topnav", theme === "dark" ? "ads-topnav--dark" : "", material ? "ads-topnav--material" : "", className].filter(Boolean).join(" ")} {...rest}>
      {logo && <div className="ads-topnav__brand">{logo}</div>}
      <nav className="ads-topnav__links">
        {items.map((it, i) => {
          const cls = ["ads-topnav__link", it.active ? "ads-topnav__link--active" : ""].filter(Boolean).join(" ");
          return it.href
            ? <a key={i} href={it.href} className={cls} aria-current={it.active ? "page" : undefined}>{it.label}</a>
            : <button key={i} type="button" className={cls} onClick={() => onSelect && onSelect(it)}>{it.label}</button>;
        })}
      </nav>
      {actions && <div className="ads-topnav__actions">{actions}</div>}
    </header>
  );
}

export default TopNav;

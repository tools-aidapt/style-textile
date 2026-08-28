import React from "react";

function ensureSidebarStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="sidebar"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "sidebar");
  s.textContent = `
.ads-sidebar{width:248px;flex:none;box-sizing:border-box;display:flex;flex-direction:column;gap:var(--space-1);
  padding:var(--space-4);background:var(--surface-card);border-right:var(--border-hairline) solid var(--border-default);
  font-family:var(--font-sans);height:100%;}
.ads-sidebar__section{font-size:var(--fs-overline);font-weight:var(--fw-semibold);letter-spacing:var(--ls-wider);
  text-transform:uppercase;color:var(--text-tertiary);padding:var(--space-3) var(--space-3) var(--space-1);}
.ads-sidebar__item{display:flex;align-items:center;gap:var(--space-3);width:100%;box-sizing:border-box;
  appearance:none;border:none;background:transparent;cursor:pointer;text-decoration:none;text-align:left;
  font-size:var(--fs-body-sm);font-weight:var(--fw-medium);color:var(--text-secondary);
  padding:9px var(--space-3);border-radius:var(--radius-md);transition:var(--transition-colors);position:relative;}
.ads-sidebar__item:hover{color:var(--text-primary);background:var(--mist-50);}
.ads-sidebar__item:active{color:var(--text-primary);background:var(--mist-100);}
.ads-sidebar__item--active{color:var(--teal-700);background:var(--teal-50);font-weight:var(--fw-semibold);}
/* The keyline springs in vertically on selection */
.ads-sidebar__item::before{content:"";position:absolute;left:0;top:7px;bottom:7px;width:3px;
  background:var(--teal-400);border-radius:0 3px 3px 0;transform:scaleY(0);
  transition:transform var(--dur-spring) var(--ease-spring);}
.ads-sidebar__item--active::before{transform:scaleY(1);}
.ads-sidebar__ico{flex:none;width:18px;height:18px;display:inline-flex;}
.ads-sidebar__ico svg{width:18px;height:18px;}
.ads-sidebar__label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ads-sidebar__badge{flex:none;font:600 11px/1 var(--font-mono);background:var(--mist-100);color:var(--steel-700);
  padding:2px 7px;border-radius:var(--radius-pill);}
.ads-sidebar__item--active .ads-sidebar__badge{background:var(--teal-100);color:var(--teal-800);}
.ads-sidebar--dark{background:var(--deepflow-900);border-right-color:rgba(255,255,255,0.1);}
.ads-sidebar--dark .ads-sidebar__item{color:var(--deepflow-200);}
.ads-sidebar--dark .ads-sidebar__item:hover{color:var(--white);background:rgba(255,255,255,0.07);}
.ads-sidebar--dark .ads-sidebar__item--active{color:var(--cyan-300);background:rgba(54,197,224,0.12);}
.ads-sidebar--dark .ads-sidebar__item--active::before{background:var(--cyan-300);}
.ads-sidebar--dark .ads-sidebar__section{color:var(--deepflow-300);}
/* Structural translucency — thick material separates the region */
.ads-sidebar--material{background:var(--material-thick-bg);-webkit-backdrop-filter:blur(var(--material-blur-thick)) saturate(var(--material-saturate));backdrop-filter:blur(var(--material-blur-thick)) saturate(var(--material-saturate));border-right-color:var(--border-subtle);}
`;
  document.head.appendChild(s);
}

/** Vertical app navigation. `groups`: [{title?, items:[{label,icon?,badge?,active?,href?}]}]. `material` renders it as a translucent structural layer. */
export function Sidebar({ groups = [], theme = "light", material = false, onSelect, className = "", style, ...rest }) {
  ensureSidebarStyles();
  return (
    <aside className={["ads-sidebar", theme === "dark" ? "ads-sidebar--dark" : "", material ? "ads-sidebar--material" : "", className].filter(Boolean).join(" ")} style={style} {...rest}>
      {groups.map((g, gi) => (
        <React.Fragment key={gi}>
          {g.title && <div className="ads-sidebar__section">{g.title}</div>}
          {g.items.map((it, i) => {
            const cls = ["ads-sidebar__item", it.active ? "ads-sidebar__item--active" : ""].filter(Boolean).join(" ");
            const inner = (
              <>
                {it.icon && <span className="ads-sidebar__ico" aria-hidden="true">{it.icon}</span>}
                <span className="ads-sidebar__label">{it.label}</span>
                {it.badge != null && <span className="ads-sidebar__badge">{it.badge}</span>}
              </>
            );
            return it.href
              ? <a key={i} href={it.href} className={cls} aria-current={it.active ? "page" : undefined}>{inner}</a>
              : <button key={i} type="button" className={cls} onClick={() => onSelect && onSelect(it)}>{inner}</button>;
          })}
        </React.Fragment>
      ))}
    </aside>
  );
}

export default Sidebar;

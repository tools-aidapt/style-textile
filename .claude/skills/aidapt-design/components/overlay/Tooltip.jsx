import React from "react";

function ensureTooltipStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="tooltip"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "tooltip");
  s.textContent = `
.ads-tip{position:relative;display:inline-flex;}
.ads-tip__pop{position:absolute;z-index:var(--z-popover);pointer-events:none;
  background:var(--deepflow-900);color:var(--white);font-family:var(--font-sans);
  font-size:var(--fs-caption);font-weight:var(--fw-medium);line-height:1.35;
  padding:6px 10px;border-radius:var(--radius-sm);white-space:nowrap;max-width:240px;
  box-shadow:var(--shadow-md);opacity:0;transform:scale(.92);
  transition:opacity var(--dur-fast) var(--ease-standard),transform var(--dur-base) var(--ease-spring);}
.ads-tip__pop::after{content:"";position:absolute;width:7px;height:7px;background:var(--deepflow-900);transform:rotate(45deg);}
.ads-tip:hover .ads-tip__pop,.ads-tip:focus-within .ads-tip__pop{opacity:1;transform:scale(1);}
/* top — scales from its trigger, not its center */
.ads-tip__pop--top{bottom:calc(100% + 8px);left:50%;translate:-50% 0;transform-origin:50% 100%;}
.ads-tip__pop--top::after{top:100%;left:50%;margin:-3.5px 0 0 -3.5px;}
/* bottom */
.ads-tip__pop--bottom{top:calc(100% + 8px);left:50%;translate:-50% 0;transform-origin:50% 0%;}
.ads-tip__pop--bottom::after{bottom:100%;left:50%;margin:0 0 -3.5px -3.5px;}
/* left */
.ads-tip__pop--left{right:calc(100% + 8px);top:50%;translate:0 -50%;transform-origin:100% 50%;}
.ads-tip__pop--left::after{left:100%;top:50%;margin:-3.5px 0 0 -3.5px;}
/* right */
.ads-tip__pop--right{left:calc(100% + 8px);top:50%;translate:0 -50%;transform-origin:0% 50%;}
.ads-tip__pop--right::after{right:100%;top:50%;margin:-3.5px -3.5px 0 0;}
@media (prefers-reduced-motion:reduce){.ads-tip__pop{transition:opacity var(--dur-fade) linear;transform:none!important}}
`;
  document.head.appendChild(s);
}

/** Hover/focus tooltip. Wrap a single focusable trigger; pass the text in `label`. */
export function Tooltip({ label, placement = "top", children, className = "", ...rest }) {
  ensureTooltipStyles();
  return (
    <span className={["ads-tip", className].filter(Boolean).join(" ")} {...rest}>
      {children}
      <span className={`ads-tip__pop ads-tip__pop--${placement}`} role="tooltip">{label}</span>
    </span>
  );
}

export default Tooltip;

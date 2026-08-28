import React from "react";

const ensureIconButtonStyles = (() => {
  let done = false;
  return () => {
    if (done || typeof document === "undefined") return;
    done = true;
    const s = document.createElement("style");
    s.setAttribute("data-ads", "icon-button");
    s.textContent = `
.ads-iconbtn{
  --_bg:transparent;--_fg:var(--steel-600);--_bd:transparent;
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--_bg);color:var(--_fg);border:var(--border-thin) solid var(--_bd);
  border-radius:var(--radius-md);cursor:pointer;padding:0;
  transition:var(--transition-colors),transform var(--dur-spring) var(--ease-spring);
  touch-action:manipulation;-webkit-tap-highlight-color:transparent;
}
.ads-iconbtn--md{width:44px;height:44px;}
.ads-iconbtn--sm{width:36px;height:36px;border-radius:var(--radius-sm);}
.ads-iconbtn--lg{width:52px;height:52px;}
.ads-iconbtn svg{width:1.25em;height:1.25em;display:block;}
.ads-iconbtn--md{font-size:20px;}.ads-iconbtn--sm{font-size:18px;}.ads-iconbtn--lg{font-size:22px;}
.ads-iconbtn:focus-visible{outline:none;box-shadow:var(--ring);}
.ads-iconbtn:active:not([disabled]){transform:translateY(1px) scale(0.96);transition:var(--transition-colors),transform var(--dur-press) var(--ease-press);}
.ads-iconbtn--ghost:hover:not([disabled]){--_bg:var(--mist-50);--_fg:var(--ink-900);}
.ads-iconbtn--primary{--_bg:var(--teal-400);--_fg:var(--ink-900);}
.ads-iconbtn--primary:hover:not([disabled]){--_bg:var(--teal-500);}
.ads-iconbtn--outline{--_bd:var(--border-default);--_fg:var(--steel-600);}
.ads-iconbtn--outline:hover:not([disabled]){--_bd:var(--teal-400);--_fg:var(--teal-700);}
.ads-iconbtn[disabled]{cursor:not-allowed;opacity:.45;}
`;
    document.head.appendChild(s);
  };
})();

/** Square, icon-only button. Always pass an accessible `label`. */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  type = "button",
  disabled = false,
  className = "",
  ...rest
}) {
  ensureIconButtonStyles();
  const cls = ["ads-iconbtn", `ads-iconbtn--${variant}`, `ads-iconbtn--${size}`, className]
    .filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} disabled={disabled} aria-label={label} title={label} {...rest}>
      {icon}
    </button>
  );
}

export default IconButton;

import React from "react";

/* Inject component styles once (ships inside the bundle; relies on design tokens). */
const ensureButtonStyles = (() => {
  let done = false;
  return () => {
    if (done || typeof document === "undefined") return;
    done = true;
    const s = document.createElement("style");
    s.setAttribute("data-ads", "button");
    s.textContent = `
.ads-btn{
  --_bg:var(--teal-400); --_fg:var(--ink-900); --_bd:transparent;
  display:inline-flex;align-items:center;justify-content:center;gap:var(--space-2);
  font-family:var(--font-sans);font-weight:var(--fw-semibold);
  border:var(--border-thin) solid var(--_bd);
  background:var(--_bg);color:var(--_fg);
  border-radius:var(--radius-md);cursor:pointer;white-space:nowrap;
  text-decoration:none;position:relative;isolation:isolate;
  transition:var(--transition-colors),transform var(--dur-spring) var(--ease-spring),box-shadow var(--dur-fast) var(--ease-standard);
  touch-action:manipulation;-webkit-tap-highlight-color:transparent;
}
.ads-btn--md{height:44px;padding:0 var(--space-5);font-size:var(--fs-body);}
.ads-btn--sm{height:36px;padding:0 var(--space-4);font-size:var(--fs-body-sm);border-radius:var(--radius-sm);}
.ads-btn--lg{height:52px;padding:0 var(--space-6);font-size:var(--fs-body-lg);}
.ads-btn--full{width:100%;}
.ads-btn:focus-visible{outline:none;box-shadow:var(--ring);}
/* Press: instant on pointer-DOWN (--dur-press), sprung release via the base transition */
.ads-btn:active:not([disabled]){transform:translateY(1px) scale(0.985);transition:var(--transition-colors),transform var(--dur-press) var(--ease-press),box-shadow var(--dur-press) var(--ease-press);}

/* Primary — Aidapt Teal, Ink label (never white on teal) */
.ads-btn--primary{--_bg:var(--teal-400);--_fg:var(--ink-900);}
.ads-btn--primary:hover:not([disabled]){--_bg:var(--teal-500);}
.ads-btn--primary:active:not([disabled]){--_bg:var(--teal-600);}

/* CTA — Ember spark, Ink label. ≤5%, the one action that matters */
.ads-btn--cta{--_bg:var(--ember-300);--_fg:var(--ink-900);}
.ads-btn--cta:hover:not([disabled]){--_bg:var(--ember-400);}
.ads-btn--cta:active:not([disabled]){--_bg:var(--ember-500);--_fg:var(--white);}

/* Secondary — keyline, teal label */
.ads-btn--secondary{--_bg:var(--white);--_fg:var(--teal-700);--_bd:var(--teal-400);}
.ads-btn--secondary:hover:not([disabled]){--_bg:var(--teal-50);--_bd:var(--teal-500);}
.ads-btn--secondary:active:not([disabled]){--_bg:var(--teal-100);}

/* Tertiary / ghost */
.ads-btn--ghost{--_bg:transparent;--_fg:var(--teal-700);--_bd:transparent;}
.ads-btn--ghost:hover:not([disabled]){--_bg:var(--teal-50);}
.ads-btn--ghost:active:not([disabled]){--_bg:var(--teal-100);}

/* Destructive */
.ads-btn--destructive{--_bg:var(--error-600);--_fg:var(--white);}
.ads-btn--destructive:hover:not([disabled]){--_bg:var(--error-700);}

.ads-btn[disabled]{cursor:not-allowed;opacity:.45;}
.ads-btn--loading{cursor:progress;color:transparent !important;}
.ads-btn__spin{position:absolute;width:1.1em;height:1.1em;border-radius:50%;
  border:2px solid currentColor;border-top-color:transparent;
  color:var(--ink-900);animation:ads-btn-spin .7s linear infinite;}
.ads-btn--destructive .ads-btn__spin{color:var(--white);}
@keyframes ads-btn-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.ads-btn__spin{animation-duration:1.4s}}
.ads-btn__icon{display:inline-flex;align-items:center;justify-content:center;}
.ads-btn__icon svg{width:1.15em;height:1.15em;display:block;}
`;
    document.head.appendChild(s);
  };
})();

/**
 * Aidapt Button — the primary action primitive.
 * variant: primary (Teal) · cta (Ember, the one key action) · secondary · ghost · destructive
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  loading = false,
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  as = "button",
  className = "",
  ...rest
}) {
  ensureButtonStyles();
  const Tag = as;
  const cls = [
    "ads-btn",
    `ads-btn--${variant}`,
    `ads-btn--${size}`,
    fullWidth ? "ads-btn--full" : "",
    loading ? "ads-btn--loading" : "",
    className,
  ].filter(Boolean).join(" ");

  const tagProps = Tag === "button"
    ? { type, disabled: disabled || loading }
    : { "aria-disabled": disabled || loading };

  return (
    <Tag className={cls} {...tagProps} {...rest}>
      {loading && <span className="ads-btn__spin" aria-hidden="true" />}
      {iconLeft && <span className="ads-btn__icon">{iconLeft}</span>}
      {children && <span>{children}</span>}
      {iconRight && <span className="ads-btn__icon">{iconRight}</span>}
    </Tag>
  );
}

export default Button;

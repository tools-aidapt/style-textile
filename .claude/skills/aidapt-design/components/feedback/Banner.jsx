import React from "react";

function ensureBannerStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="banner"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "banner");
  s.textContent = `
.ads-banner{display:flex;align-items:center;gap:var(--space-4);width:100%;box-sizing:border-box;
  padding:var(--space-3) var(--space-5);font-family:var(--font-sans);position:relative;overflow:hidden;}
.ads-banner--neutral{background:var(--mist-50);border-bottom:var(--border-hairline) solid var(--border-default);}
.ads-banner--teal{background:var(--teal-400);color:var(--ink-900);}
.ads-banner--deep{background:var(--deepflow-900);color:var(--white);}
.ads-banner--gradient{background:var(--grad-sweep-dark);color:var(--white);}
.ads-banner__msg{flex:1;min-width:0;font-size:var(--fs-body-sm);line-height:1.45;}
.ads-banner__msg strong{font-weight:var(--fw-semibold);}
.ads-banner--neutral .ads-banner__msg{color:var(--text-primary);}
.ads-banner__actions{display:flex;align-items:center;gap:var(--space-3);flex:none;position:relative;z-index:2;}
.ads-banner__x{flex:none;border:none;background:transparent;cursor:pointer;color:currentColor;opacity:.7;
  width:26px;height:26px;border-radius:var(--radius-sm);display:inline-flex;align-items:center;justify-content:center;
  transition:opacity var(--dur-fast) var(--ease-standard);}
.ads-banner__x:hover{opacity:1;}
.ads-banner__x:active{opacity:1;transform:scale(.92);}
.ads-banner__x svg{width:16px;height:16px;}
`;
  document.head.appendChild(s);
}

/** Full-width, page-level announcement. Use a Water tone; pair an Ember CTA sparingly. */
export function Banner({ variant = "neutral", children, actions, onClose, grain = false, className = "", ...rest }) {
  ensureBannerStyles();
  const cls = [
    "ads-banner",
    `ads-banner--${variant}`,
    grain && (variant === "gradient" || variant === "deep") ? "has-grain" : "",
    className,
  ].filter(Boolean).join(" ");
  return (
    <div className={cls} role="region" {...rest}>
      <div className="ads-banner__msg" style={{ position: "relative", zIndex: 2 }}>{children}</div>
      {(actions || onClose) && (
        <div className="ads-banner__actions">
          {actions}
          {onClose && (
            <button type="button" className="ads-banner__x" aria-label="Dismiss" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Banner;

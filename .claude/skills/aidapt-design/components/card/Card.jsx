import React from "react";

function ensureCardStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="card"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "card");
  s.textContent = `
.ads-card{background:var(--surface-card);border-radius:var(--radius-lg);
  border:var(--border-hairline) solid var(--border-default);box-shadow:var(--shadow-sm);
  color:var(--text-primary);overflow:hidden;
  transition:box-shadow var(--dur-base) var(--ease-forward),border-color var(--dur-base) var(--ease-forward),transform var(--dur-spring) var(--ease-spring);}
.ads-card--outline{box-shadow:none;}
.ads-card--elevated{box-shadow:var(--shadow-md);border-color:var(--border-subtle);}
.ads-card--interactive{cursor:pointer;}
.ads-card--interactive:hover{box-shadow:var(--shadow-lg);border-color:var(--teal-200);transform:translateY(-2px);}
.ads-card--interactive:active{transform:translateY(0) scale(0.995);box-shadow:var(--shadow-md);transition-duration:var(--dur-fast),var(--dur-fast),var(--dur-press);}
.ads-card--accent{border-top:var(--border-thick) solid var(--teal-400);}
.ads-card__pad{padding:var(--pad-card);}
.ads-card__pad--lg{padding:var(--pad-card-lg);}
.ads-card__eyebrow{font:var(--fw-semibold) var(--fs-overline)/1.33 var(--font-sans);
  letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--teal-700);margin:0 0 var(--space-2);}
.ads-card__title{font:var(--fw-bold) var(--fs-h5)/var(--lh-h5) var(--font-display);letter-spacing:var(--ls-snug);margin:0;}
.ads-card__subtitle{font:var(--fw-regular) var(--fs-body-sm)/1.5 var(--font-sans);color:var(--text-secondary);margin:var(--space-2) 0 0;}
.ads-card__body{margin-top:var(--space-3);font-size:var(--fs-body);line-height:var(--lh-normal);color:var(--text-secondary);}
.ads-card__footer{margin-top:var(--space-5);display:flex;gap:var(--space-3);align-items:center;}
`;
  document.head.appendChild(s);
}

/** Content surface. Compose freely via children, or use the title/subtitle/footer props. */
export function Card({
  variant = "default",
  interactive = false,
  accent = false,
  padding = "md",
  eyebrow,
  title,
  subtitle,
  footer,
  children,
  className = "",
  ...rest
}) {
  ensureCardStyles();
  const cls = [
    "ads-card",
    `ads-card--${variant}`,
    interactive ? "ads-card--interactive" : "",
    accent ? "ads-card--accent" : "",
    className,
  ].filter(Boolean).join(" ");
  const hasHeader = eyebrow || title || subtitle;
  return (
    <div className={cls} {...rest}>
      <div className={padding === "lg" ? "ads-card__pad ads-card__pad--lg" : "ads-card__pad"}>
        {eyebrow && <p className="ads-card__eyebrow">{eyebrow}</p>}
        {title && <h3 className="ads-card__title">{title}</h3>}
        {subtitle && <p className="ads-card__subtitle">{subtitle}</p>}
        {children && <div className={hasHeader ? "ads-card__body" : ""}>{children}</div>}
        {footer && <div className="ads-card__footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Card;

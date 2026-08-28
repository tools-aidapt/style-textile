import React from "react";

function ensureModalStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="modal"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "modal");
  s.textContent = `
.ads-modal__scrim{position:fixed;inset:0;z-index:var(--z-modal);
  background:var(--scrim-modal);
  backdrop-filter:blur(6px) saturate(120%);display:flex;align-items:center;justify-content:center;padding:var(--space-6);
  animation:ads-modal-in var(--dur-base) var(--ease-standard);}
@keyframes ads-modal-in{from{opacity:0}to{opacity:1}}
.ads-modal{background:var(--surface-card);border-radius:var(--radius-xl);box-shadow:var(--shadow-xl);
  width:100%;max-width:520px;max-height:calc(100vh - 96px);display:flex;flex-direction:column;
  overflow:hidden;font-family:var(--font-sans);border:var(--border-hairline) solid var(--border-subtle);
  animation:ads-modal-pop var(--dur-spring) var(--ease-spring);}
.ads-modal--static{box-shadow:var(--shadow-lg);}
/* Materialize: blur + scale + rise resolve together — the surface arrives as a material, not a fade */
@keyframes ads-modal-pop{from{opacity:0;transform:translateY(12px) scale(.97);filter:blur(8px)}to{opacity:1;transform:none;filter:none}}
@media (prefers-reduced-motion:reduce){.ads-modal,.ads-modal__scrim{animation:ads-modal-in var(--dur-fade) ease}}
.ads-modal__head{display:flex;align-items:flex-start;gap:var(--space-4);padding:var(--space-6) var(--space-6) var(--space-3);}
.ads-modal__titles{flex:1;min-width:0;}
.ads-modal__title{font:var(--fw-bold) var(--fs-h4)/var(--lh-h4) var(--font-display);letter-spacing:var(--ls-snug);margin:0;}
.ads-modal__sub{font-size:var(--fs-body-sm);color:var(--text-secondary);margin:5px 0 0;line-height:1.5;}
.ads-modal__x{flex:none;border:none;background:transparent;cursor:pointer;color:var(--text-tertiary);
  width:32px;height:32px;border-radius:var(--radius-md);display:inline-flex;align-items:center;justify-content:center;
  margin:-4px -4px 0 0;transition:var(--transition-colors);}
.ads-modal__x:hover{color:var(--text-primary);background:var(--mist-50);}
.ads-modal__x svg{width:18px;height:18px;}
.ads-modal__body{padding:0 var(--space-6) var(--space-5);font-size:var(--fs-body);line-height:var(--lh-normal);
  color:var(--text-secondary);overflow:auto;}
.ads-modal__footer{display:flex;justify-content:flex-end;gap:var(--space-3);padding:var(--space-4) var(--space-6);
  border-top:var(--border-hairline) solid var(--border-subtle);background:var(--mist-50);}
`;
  document.head.appendChild(s);
}

/** Centered dialog over a Deep-Flow scrim. Controlled via `open`; `static` renders the panel inline for docs. */
export function Modal({ open = true, onClose, title, subtitle, children, footer, static: isStatic = false, className = "", maxWidth }) {
  ensureModalStyles();
  if (!open) return null;
  const panel = (
    <div className={["ads-modal", isStatic ? "ads-modal--static" : "", className].filter(Boolean).join(" ")}
         role="dialog" aria-modal={!isStatic} style={maxWidth ? { maxWidth } : undefined}
         onClick={(e) => e.stopPropagation()}>
      <div className="ads-modal__head">
        <div className="ads-modal__titles">
          {title && <h2 className="ads-modal__title">{title}</h2>}
          {subtitle && <p className="ads-modal__sub">{subtitle}</p>}
        </div>
        {onClose && (
          <button type="button" className="ads-modal__x" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        )}
      </div>
      {children && <div className="ads-modal__body">{children}</div>}
      {footer && <div className="ads-modal__footer">{footer}</div>}
    </div>
  );
  if (isStatic) return panel;
  return <div className="ads-modal__scrim" onClick={onClose}>{panel}</div>;
}

export default Modal;

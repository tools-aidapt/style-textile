import React, { useEffect, useRef, useState } from "react";
import { Motion } from "../motion/Motion.jsx";

function ensureSheetStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="sheet"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "sheet");
  s.textContent = `
.ads-sheet__scrim{position:fixed;inset:0;z-index:var(--z-modal);background:var(--scrim-modal);opacity:0;will-change:opacity;}
.ads-sheet{position:fixed;left:0;right:0;bottom:0;margin:0 auto;z-index:calc(var(--z-modal) + 1);
  width:min(560px, calc(100vw - 16px));max-height:calc(100vh - 56px);display:flex;flex-direction:column;
  background:var(--material-thick-bg);-webkit-backdrop-filter:blur(var(--material-blur-thick)) saturate(var(--material-saturate));backdrop-filter:blur(var(--material-blur-thick)) saturate(var(--material-saturate));
  border:var(--border-hairline) solid var(--border-subtle);border-top-color:var(--material-edge);border-bottom:none;
  border-radius:var(--radius-2xl) var(--radius-2xl) 0 0;box-shadow:var(--shadow-xl);
  font-family:var(--font-sans);will-change:transform;transform:translateY(100vh);}
.ads-sheet--solid{background:var(--surface-card);-webkit-backdrop-filter:none;backdrop-filter:none;}
.ads-sheet--static{position:static;transform:none;width:100%;border-bottom:var(--border-hairline) solid var(--border-subtle);border-radius:var(--radius-2xl) var(--radius-2xl) var(--radius-lg) var(--radius-lg);box-shadow:var(--shadow-lg);}
.ads-sheet__grab{flex:none;cursor:grab;touch-action:none;padding:10px var(--space-6) 0;-webkit-user-select:none;user-select:none;}
.ads-sheet__grab:active{cursor:grabbing;}
.ads-sheet__grip{width:36px;height:5px;border-radius:var(--radius-pill);background:var(--mist-300);margin:0 auto;}
.ads-sheet__head{display:flex;align-items:flex-start;gap:var(--space-4);padding:var(--space-4) 0 var(--space-3);}
.ads-sheet__title{font:var(--fw-bold) var(--fs-h5)/var(--lh-h5) var(--font-display);letter-spacing:var(--ls-snug);margin:0;color:var(--text-vibrant);}
.ads-sheet__sub{font-size:var(--fs-body-sm);color:var(--text-vibrant-secondary);margin:4px 0 0;line-height:1.5;}
.ads-sheet__body{padding:0 var(--space-6) var(--space-6);font-size:var(--fs-body);line-height:var(--lh-normal);color:var(--text-vibrant-secondary);overflow:auto;overscroll-behavior:contain;}
.ads-sheet__footer{display:flex;justify-content:flex-end;gap:var(--space-3);padding:var(--space-4) var(--space-6);border-top:var(--border-hairline) solid var(--border-subtle);}
@media (prefers-reduced-motion:reduce){.ads-sheet__scrim{transition:opacity var(--dur-fade) ease;}}
`;
  document.head.appendChild(s);
}

/**
 * Bottom sheet — the system's fluid-gesture flagship.
 * Drag the grab region 1:1 (grab offset respected); edges rubber-band; release
 * projects momentum to open/closed; the spring inherits release velocity and is
 * grabbable mid-flight. Controlled via `open` + `onClose`.
 */
export function Sheet({ open = false, onClose, title, subtitle, children, footer, material = true, static: isStatic = false, className = "", ...rest }) {
  ensureSheetStyles();
  const panelRef = useRef(null), scrimRef = useRef(null), springRef = useRef(null);
  const hRef = useRef(480), enteredRef = useRef(false), closingRef = useRef(false), dragRef = useRef(null);
  const [mounted, setMounted] = useState(open);

  const getSpring = () => {
    if (!springRef.current) {
      springRef.current = Motion.createSpring({
        ...Motion.presets.sheet,
        restDelta: 0.3,
        onUpdate: (y) => {
          if (panelRef.current) panelRef.current.style.transform = `translateY(${y}px)`;
          if (scrimRef.current) scrimRef.current.style.opacity = String(Math.min(1, Math.max(0, 1 - y / hRef.current)));
        },
        onRest: (y) => {
          if (closingRef.current && y >= hRef.current - 1) { closingRef.current = false; enteredRef.current = false; setMounted(false); }
        },
      });
    }
    return springRef.current;
  };

  useEffect(() => {
    if (isStatic) return;
    if (open) { closingRef.current = false; setMounted(true); }
    else if (enteredRef.current) { closingRef.current = true; getSpring().to(hRef.current); }
  }, [open]);

  useEffect(() => {
    if (!mounted || isStatic || !open) return;
    const p = panelRef.current;
    if (!p) return;
    hRef.current = Math.ceil(p.getBoundingClientRect().height) + 40;
    const sp = getSpring();
    if (!enteredRef.current) { sp.set(hRef.current); enteredRef.current = true; }
    sp.to(0); // reopening mid-dismiss retargets from the live value
  }, [mounted, open]);

  useEffect(() => {
    if (!mounted || isStatic) return;
    const onKey = (e) => { if (e.key === "Escape" && onClose) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounted, isStatic, onClose]);

  useEffect(() => () => springRef.current && springRef.current.stop(), []);

  const onPointerDown = (e) => {
    if (isStatic) return;
    const sp = getSpring();
    sp.stop(); // grab mid-flight
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { grab: e.clientY - sp.value, tracker: Motion.createVelocityTracker() };
    dragRef.current.tracker.add(e.clientY);
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    let y = e.clientY - d.grab;
    if (y < 0) y = Motion.rubberband(y, hRef.current); // resist above rest
    getSpring().set(y); // 1:1 while the finger is down
    d.tracker.add(e.clientY);
  };
  const onPointerUp = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    const sp = getSpring(), H = hRef.current, v = d.tracker.get();
    const projected = sp.value + Motion.project(v); // decide from momentum, not position
    if (projected > H * 0.5) {
      closingRef.current = true;
      sp.to(H, { velocity: v });
      if (onClose) onClose();
    } else sp.to(0, { velocity: v });
  };

  if (!mounted && !isStatic) return null;
  const panel = (
    <div ref={panelRef} className={["ads-sheet", material ? "" : "ads-sheet--solid", isStatic ? "ads-sheet--static" : "", className].filter(Boolean).join(" ")}
         role="dialog" aria-modal={!isStatic} {...rest}>
      <div className="ads-sheet__grab" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <div className="ads-sheet__grip" aria-hidden="true"></div>
        {(title || subtitle) && (
          <div className="ads-sheet__head">
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && <h2 className="ads-sheet__title">{title}</h2>}
              {subtitle && <p className="ads-sheet__sub">{subtitle}</p>}
            </div>
          </div>
        )}
      </div>
      {children && <div className="ads-sheet__body">{children}</div>}
      {footer && <div className="ads-sheet__footer">{footer}</div>}
    </div>
  );
  if (isStatic) return panel;
  return (
    <React.Fragment>
      <div ref={scrimRef} className="ads-sheet__scrim" onClick={onClose}></div>
      {panel}
    </React.Fragment>
  );
}

export default Sheet;

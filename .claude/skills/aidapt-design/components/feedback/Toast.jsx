import React, { useRef } from "react";
import { Motion } from "../motion/Motion.jsx";

function ensureToastStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="toast"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "toast");
  s.textContent = `
.ads-toast{display:flex;gap:var(--space-3);align-items:flex-start;width:360px;max-width:100%;
  background:var(--surface-card);border:var(--border-hairline) solid var(--border-default);
  border-radius:var(--radius-md);box-shadow:var(--shadow-lg);padding:var(--space-3) var(--space-4);
  font-family:var(--font-sans);position:relative;overflow:hidden;will-change:transform;
  animation:ads-toast-in var(--dur-spring) var(--ease-spring);}
.ads-toast--swipe{touch-action:pan-y;cursor:grab;}
.ads-toast--swipe:active{cursor:grabbing;}
@keyframes ads-toast-in{from{opacity:0;transform:translateY(12px) scale(.97);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
@keyframes ads-toast-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.ads-toast{animation:ads-toast-fade var(--dur-fade) ease}}
.ads-toast::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--steel-400);}
.ads-toast--info::before{background:var(--info);}
.ads-toast--success::before{background:var(--success);}
.ads-toast--warning::before{background:var(--warning);}
.ads-toast--error::before{background:var(--error);}
.ads-toast__icon{flex:none;width:20px;height:20px;margin-top:1px;}
.ads-toast__icon svg{width:20px;height:20px;}
.ads-toast--info .ads-toast__icon{color:var(--info);}
.ads-toast--success .ads-toast__icon{color:var(--success);}
.ads-toast--warning .ads-toast__icon{color:var(--warning-500);}
.ads-toast--error .ads-toast__icon{color:var(--error);}
.ads-toast__body{flex:1;min-width:0;}
.ads-toast__title{font-size:var(--fs-body-sm);font-weight:var(--fw-semibold);color:var(--text-primary);margin:0;}
.ads-toast__msg{font-size:var(--fs-caption);line-height:1.45;color:var(--text-secondary);margin:2px 0 0;}
.ads-toast__x{flex:none;border:none;background:transparent;cursor:pointer;color:var(--text-tertiary);
  width:22px;height:22px;border-radius:var(--radius-sm);display:inline-flex;align-items:center;justify-content:center;
  margin:-1px -2px 0 0;transition:var(--transition-colors);}
.ads-toast__x:hover{color:var(--text-primary);background:rgba(6,42,59,0.06);}
.ads-toast__x svg{width:14px;height:14px;}
`;
  document.head.appendChild(s);
}

const T_ICONS = {
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  success: <><circle cx="12" cy="12" r="10" /><polyline points="8.5 12.5 11 15 16 9" /></>,
  warning: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  error: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
};

/** Transient floating notification. Render inside your own positioned viewport.
    With `onClose` it is swipeable: 1:1 drag, leftward rubber-bands, a rightward flick
    dismisses by projected momentum (the brand's forward direction). */
export function Toast({ variant = "info", title, children, onClose, className = "", ...rest }) {
  ensureToastStyles();
  const rootRef = useRef(null), springRef = useRef(null), dragRef = useRef(null), closeRef = useRef(onClose);
  closeRef.current = onClose;
  const getSpring = () => {
    if (!springRef.current) {
      springRef.current = Motion.createSpring({
        ...Motion.presets.move, restDelta: 0.3,
        onUpdate: (x) => {
          const el = rootRef.current;
          if (!el) return;
          el.style.transform = x ? `translateX(${x}px)` : "";
          el.style.opacity = String(Math.max(0, 1 - Math.max(x, 0) / 340));
        },
        onRest: (x) => { if (x > 300 && closeRef.current) closeRef.current(); },
      });
    }
    return springRef.current;
  };
  const onPointerDown = (e) => {
    if (!onClose || e.target.closest("button")) return;
    const el = rootRef.current;
    el.style.animation = "none"; // presentation value takes over
    el.setPointerCapture(e.pointerId);
    getSpring().stop();
    dragRef.current = { startX: e.clientX, grab: e.clientX - getSpring().value, engaged: false, tracker: Motion.createVelocityTracker() };
    dragRef.current.tracker.add(e.clientX);
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.engaged && Math.abs(e.clientX - d.startX) < 10) return; // hysteresis before committing
    d.engaged = true;
    let x = e.clientX - d.grab;
    if (x < 0) x = Motion.rubberband(x, 80); // wrong direction resists
    getSpring().set(x);
    d.tracker.add(e.clientX);
  };
  const onPointerUp = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    if (!d.engaged) return;
    const sp = getSpring(), v = d.tracker.get();
    const projected = sp.value + Motion.project(v);
    if (projected > 96) sp.to(380, { velocity: v });
    else sp.to(0, { velocity: v });
  };
  return (
    <div ref={rootRef} className={["ads-toast", `ads-toast--${variant}`, onClose ? "ads-toast--swipe" : "", className].filter(Boolean).join(" ")} role="status"
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} {...rest}>
      <span className="ads-toast__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{T_ICONS[variant]}</svg>
      </span>
      <div className="ads-toast__body">
        {title && <p className="ads-toast__title">{title}</p>}
        {children && <p className="ads-toast__msg">{children}</p>}
      </div>
      {onClose && (
        <button type="button" className="ads-toast__x" aria-label="Dismiss" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      )}
    </div>
  );
}

export default Toast;

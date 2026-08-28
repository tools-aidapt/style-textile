/* Aidapt Motion — interruptible springs with velocity handoff.
   Damping 1.0 = no overshoot (default UI); ~0.8 = slight bounce, ONLY after a
   gesture with momentum. Response = time-to-target feel in seconds, not a duration.
   Springs animate from the PRESENTATION value, so they are grabbable mid-flight. */

const reduceMQ = typeof matchMedia !== "undefined" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
const prefersReducedMotion = () => !!(reduceMQ && reduceMQ.matches);

function coeffs(damping, response) {
  const omega = (2 * Math.PI) / Math.max(response, 0.01); // mass = 1
  return { k: omega * omega, c: 2 * damping * omega };
}

function createSpring({ damping = 1, response = 0.35, onUpdate, onRest, restDelta = 0.05 } = {}) {
  let { k, c } = coeffs(damping, response);
  let value = 0, velocity = 0, target = 0, raf = null, last = 0;
  const step = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    const n = 4, h = dt / n; // substepped semi-implicit Euler: stable at any frame rate
    for (let i = 0; i < n; i++) {
      velocity += (-k * (value - target) - c * velocity) * h;
      value += velocity * h;
    }
    if (Math.abs(value - target) < restDelta && Math.abs(velocity) < restDelta * 20) {
      value = target; velocity = 0; raf = null;
      if (onUpdate) onUpdate(value);
      if (onRest) onRest(value);
      return;
    }
    if (onUpdate) onUpdate(value);
    raf = requestAnimationFrame(step);
  };
  const api = {
    get value() { return value; },
    get velocity() { return velocity; },
    get target() { return target; },
    get animating() { return raf != null; },
    configure(d, r) { ({ k, c } = coeffs(d ?? damping, r ?? response)); damping = d ?? damping; response = r ?? response; return api; },
    /** Jump without animating (also how a drag feeds 1:1 positions). */
    set(v) { api.stop(); value = target = v; velocity = 0; if (onUpdate) onUpdate(value); return api; },
    /** Retarget from the CURRENT value; existing velocity carries unless overridden (px/s). */
    to(t, opts = {}) {
      target = t;
      if (opts.velocity != null) velocity = opts.velocity;
      if (prefersReducedMotion()) { api.stop(); value = target; velocity = 0; if (onUpdate) onUpdate(value); if (onRest) onRest(value); return api; }
      if (raf == null) { last = performance.now(); raf = requestAnimationFrame(step); }
      return api;
    },
    stop() { if (raf != null) cancelAnimationFrame(raf); raf = null; return api; },
  };
  return api;
}

/** Apple's momentum projection — where a flick would land. velocity px/s. */
function project(initialVelocity, decelerationRate = 0.998) {
  return ((initialVelocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Soft boundary: the further past the edge, the less it follows. */
function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Short pointer history → release velocity (px/s). Feed one axis. */
function createVelocityTracker() {
  let samples = [];
  return {
    add(v) { const t = performance.now(); samples.push({ t, v }); samples = samples.filter((s) => t - s.t < 100); },
    get() {
      if (samples.length < 2) return 0;
      const a = samples[0], b = samples[samples.length - 1];
      const dt = (b.t - a.t) / 1000;
      return dt > 0 ? (b.v - a.v) / dt : 0;
    },
    reset() { samples = []; },
  };
}

/** Ship values (WWDC "Designing Fluid Interfaces"). */
const presets = {
  default: { damping: 1, response: 0.35 },
  move: { damping: 1, response: 0.4 },
  rotate: { damping: 0.8, response: 0.4 },
  sheet: { damping: 0.8, response: 0.3 },
};

export const Motion = { createSpring, project, rubberband, createVelocityTracker, presets, prefersReducedMotion };
if (typeof window !== "undefined") window.AidaptMotion = Motion;
export default Motion;

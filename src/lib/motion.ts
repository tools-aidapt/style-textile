/**
 * The fluid-motion engine.
 *
 * The design system's motion tokens describe springs — damping ratio and
 * response, plus momentum projection and rubber-banding — but nothing in the
 * app read them, so every transition was a fixed CSS curve. A fixed curve
 * cannot be grabbed mid-flight: it interpolates from where it started to where
 * it was told to go, and a second input mid-animation restarts it from a jump.
 *
 * These primitives are the alternative. A spring always animates from the
 * *presentation* value (what is on screen right now) and carries its velocity
 * through a re-target, which is what makes motion interruptible rather than
 * merely short. Everything here is dependency-free and respects
 * `prefers-reduced-motion` by settling instantly — reduced motion means no
 * vestibular movement, not no feedback, so callers pair it with an opacity
 * crossfade (`--dur-fade`) rather than removing the state change.
 */

import * as React from "react";

/** Damping ratio and response, in the two parameters the tokens name. */
export interface SpringConfig {
  /** 1.0 settles without overshoot. ~0.8 bounces, and is earned by a flick. */
  damping: number;
  /** Seconds to reach the target. Not a duration — a spring has none. */
  response: number;
}

/**
 * The spring presets, mirroring `--spring-*` in tokens/motion.css.
 *
 * `default` is critically damped and is the right answer for almost every
 * state change. `sheet` is the only preset with bounce, because a sheet is
 * thrown and a throw carries momentum; a menu that merely appeared has not
 * earned an overshoot.
 */
export const SPRING = {
  default: { damping: 1.0, response: 0.35 },
  move: { damping: 1.0, response: 0.4 },
  rotate: { damping: 0.8, response: 0.4 },
  sheet: { damping: 0.8, response: 0.3 },
} as const satisfies Record<string, SpringConfig>;

/**
 * Where a flick is going, not where it was released.
 *
 * Apple's own projection from the Designing Fluid Interfaces sample code: an
 * exponential decay, the same curve scroll deceleration uses. The
 * physics-textbook `v²/2a` is a different shape and lands short, which reads
 * as the interface resisting the throw.
 *
 * @param velocity px/s at release
 * @param decelerationRate 0.998 for normal scroll feel; 0.99 is snappier
 */
export const project = (velocity: number, decelerationRate = 0.998): number =>
  ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);

/**
 * Progressive resistance past a boundary.
 *
 * A hard stop reads as frozen — the user cannot tell a limit from a bug. The
 * further past the edge they drag, the less the surface follows, so it stays
 * responsive while saying plainly that there is nothing more here.
 */
export const rubberband = (overshoot: number, dimension: number, constant = 0.55): number =>
  (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));

/** Snap target nearest a projected landing point. */
export const nearestSnap = (projected: number, points: readonly number[]): number =>
  points.reduce((best, p) => (Math.abs(p - projected) < Math.abs(best - projected) ? p : best), points[0]);

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches;

/** Live `prefers-reduced-motion`, so a mid-session change is honoured. */
export const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = React.useState(prefersReducedMotion);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
};

export interface Spring {
  /** Re-target. Motion continues from the current value and velocity. */
  set(target: number, options?: { velocity?: number }): void;
  /** Jump to a value with no motion — for mounts and reduced motion. */
  snap(value: number): void;
  /** Abandon the animation where it is. */
  stop(): void;
  readonly value: number;
  readonly velocity: number;
}

/** A frame budget cap: a backgrounded tab must not integrate one huge step. */
const MAX_STEP_S = 1 / 30;

/** Below these, the spring has arrived and the loop is wasting frames. */
const EPSILON_VALUE = 0.01;
const EPSILON_VELOCITY = 0.05;

/**
 * A single sprung number.
 *
 * `onUpdate` is called per frame with the presentation value; the caller writes
 * it to a transform. Integration is semi-implicit Euler, which is stable at the
 * step sizes a display gives us and — unlike an analytic solution — needs no
 * special case when the target moves mid-flight. That is the whole point:
 * `set()` during an animation keeps both the position and the velocity, so a
 * reversal blends instead of hitting a brick wall.
 */
export const createSpring = ({
  from = 0,
  config = SPRING.default,
  onUpdate,
  onRest,
}: {
  from?: number;
  config?: SpringConfig;
  onUpdate: (value: number) => void;
  onRest?: () => void;
}): Spring => {
  let value = from;
  let velocity = 0;
  let target = from;
  let frame: number | null = null;
  let lastTime = 0;

  const omega = (2 * Math.PI) / config.response;
  const stiffness = omega * omega;
  const damping = 2 * config.damping * omega;

  const cancel = () => {
    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
  };

  const tick = (now: number) => {
    // Clamp rather than trust the timestamp: a tab restored after a minute
    // would otherwise integrate a single 60-second step and fling the value
    const dt = Math.min(MAX_STEP_S, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;

    const displacement = value - target;
    const acceleration = -stiffness * displacement - damping * velocity;
    velocity += acceleration * dt;
    value += velocity * dt;

    if (Math.abs(value - target) < EPSILON_VALUE && Math.abs(velocity) < EPSILON_VELOCITY) {
      value = target;
      velocity = 0;
      frame = null;
      onUpdate(value);
      onRest?.();
      return;
    }

    onUpdate(value);
    frame = requestAnimationFrame(tick);
  };

  const start = () => {
    if (frame !== null) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  };

  return {
    set(next, options) {
      target = next;
      if (options?.velocity !== undefined) velocity = options.velocity;

      // Reduced motion: the state change still lands, it just does not travel
      if (prefersReducedMotion()) {
        cancel();
        value = next;
        velocity = 0;
        onUpdate(value);
        onRest?.();
        return;
      }
      start();
    },
    snap(next) {
      cancel();
      value = next;
      target = next;
      velocity = 0;
      onUpdate(value);
    },
    stop() {
      cancel();
      velocity = 0;
    },
    get value() {
      return value;
    },
    get velocity() {
      return velocity;
    },
  };
};

/** How many pointer samples to keep. Enough to smooth a jittery trackpad. */
const VELOCITY_SAMPLES = 5;

/** A sample old enough to be stale tells us the pointer has stopped. */
const VELOCITY_WINDOW_MS = 100;

/**
 * Pointer velocity from a short position history.
 *
 * The last two events are not enough — a single stalled frame before release
 * reports zero velocity and the throw dies in the hand. Sampling a window and
 * ignoring anything older than it gives the release the speed the finger
 * actually had.
 */
export const createVelocityTracker = () => {
  let samples: { position: number; time: number }[] = [];

  return {
    reset(position: number) {
      samples = [{ position, time: performance.now() }];
    },
    add(position: number) {
      samples.push({ position, time: performance.now() });
      if (samples.length > VELOCITY_SAMPLES) samples.shift();
    },
    /** px/s, or 0 once the pointer has been still long enough to mean it. */
    velocity(): number {
      if (samples.length < 2) return 0;
      const last = samples[samples.length - 1];
      const first = samples.find((s) => last.time - s.time <= VELOCITY_WINDOW_MS) ?? samples[0];
      const elapsed = last.time - first.time;
      if (elapsed <= 0) return 0;
      return ((last.position - first.position) / elapsed) * 1000;
    },
  };
};

/**
 * A sprung number bound to a DOM node's style, driven outside React.
 *
 * A spring updates every frame; routing 60 of those a second through `setState`
 * re-renders a whole subtree for a transform. The ref is written directly
 * instead, which is also what lets the motion survive an interrupt — React
 * never sees an intermediate value it might discard.
 */
export const useSpringStyle = <T extends HTMLElement>(
  target: number,
  write: (element: T, value: number) => void,
  config: SpringConfig = SPRING.default,
) => {
  const ref = React.useRef<T | null>(null);
  const springRef = React.useRef<Spring | null>(null);
  const writeRef = React.useRef(write);
  writeRef.current = write;

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const spring = createSpring({
      from: target,
      config,
      onUpdate: (value) => writeRef.current(element, value),
    });
    springRef.current = spring;
    spring.snap(target);

    return () => {
      spring.stop();
      springRef.current = null;
    };
    // The spring owns its own target from here; re-creating it on every change
    // would throw away the velocity that makes an interrupt smooth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.damping, config.response]);

  React.useEffect(() => {
    springRef.current?.set(target);
  }, [target]);

  return ref;
};

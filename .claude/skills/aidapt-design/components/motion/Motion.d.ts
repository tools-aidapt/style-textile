export interface SpringHandle {
  /** Current on-screen (presentation) value. */
  readonly value: number;
  /** Current velocity (units/s). */
  readonly velocity: number;
  readonly target: number;
  readonly animating: boolean;
  /** Retarget from the CURRENT value — interruptible by design. Pass the gesture's release velocity (px/s) for a seamless drag→animation handoff. */
  to(target: number, opts?: { velocity?: number }): SpringHandle;
  /** Jump without animating; also how a drag feeds 1:1 positions. */
  set(value: number): SpringHandle;
  stop(): SpringHandle;
  configure(damping?: number, response?: number): SpringHandle;
}

export interface SpringConfig {
  /** 1.0 = critically damped, no overshoot (default UI). ~0.8 = slight bounce — only when the gesture carried momentum. */
  damping?: number;
  /** Time-to-target feel in seconds. Not a fixed duration. */
  response?: number;
  onUpdate?: (value: number) => void;
  onRest?: (value: number) => void;
  restDelta?: number;
}

export interface VelocityTracker {
  add(sample: number): void;
  /** Release velocity in units/s from the last ~100ms of samples. */
  get(): number;
  reset(): void;
}

/** Aidapt's fluid-motion engine. Also exposed as window.AidaptMotion. */
export const Motion: {
  createSpring(config?: SpringConfig): SpringHandle;
  /** Momentum projection: where a flick would land. `current + project(v)`, then snap to the nearest detent. */
  project(initialVelocity: number, decelerationRate?: number): number;
  /** Soft boundary resistance past an edge. */
  rubberband(overshoot: number, dimension: number, constant?: number): number;
  createVelocityTracker(): VelocityTracker;
  /** Ship values: default 1.0/0.35 · move 1.0/0.4 · rotate 0.8/0.4 · sheet 0.8/0.3. */
  presets: Record<"default" | "move" | "rotate" | "sheet", { damping: number; response: number }>;
  prefersReducedMotion(): boolean;
};
export default Motion;

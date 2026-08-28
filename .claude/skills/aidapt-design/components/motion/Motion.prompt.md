# Motion — Aidapt's fluid-motion engine

`window.AidaptMotion` (or `const { Motion } = window.<Namespace>`). Springs, not fixed curves, for anything a user can touch.

## Rules
- **Respond on pointer-down**, track 1:1 during the gesture (`spring.set(x)` per move, respecting the grab offset), never animate only at the end.
- **Interruptible always**: `spring.to(t)` retargets from the current on-screen value; a moving element can be grabbed (`spring.stop()`) at any instant.
- **Velocity handoff**: on release, `spring.to(target, { velocity })` with the tracker's px/s so there is no seam between drag and animation.
- **Project momentum**: pick the target from `current + Motion.project(v)`, not from the release point.
- **Rubber-band** past boundaries: `Motion.rubberband(overshoot, dimension)`.
- Damping `1.0` by default; `~0.8` bounce only when the gesture carried momentum.
- Reduced motion is built in: springs jump to target and fire `onRest`.

## Example — draggable with momentum
```js
const M = window.AidaptMotion;
const spring = M.createSpring({ ...M.presets.move, onUpdate: (x) => (el.style.transform = `translateX(${x}px)`) });
el.addEventListener("pointerdown", (e) => {
  el.setPointerCapture(e.pointerId);
  spring.stop();
  const grab = e.clientX - spring.value, tracker = M.createVelocityTracker();
  const move = (ev) => { let x = ev.clientX - grab; if (x < 0) x = M.rubberband(x, 120); spring.set(x); tracker.add(ev.clientX); };
  const up = () => {
    const v = tracker.get(), target = clamp(spring.value + M.project(v), 0, MAX);
    spring.to(target, { velocity: v });
    el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up);
  };
  el.addEventListener("pointermove", move); el.addEventListener("pointerup", up);
});
```

For CSS-only (non-gesture) transitions, use the spring easing tokens instead: `transition: transform var(--dur-spring) var(--ease-spring)`.

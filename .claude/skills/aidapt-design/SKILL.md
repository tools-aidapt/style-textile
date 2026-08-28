---
name: aidapt-design
description: Use this skill whenever creating anything visual for Aidapt — interfaces, prototypes, mockups, slides, dashboards, documents, or brand assets, whether production code or throwaway. Contains the locked brand system - colors, typography, self-hosted fonts, logos, gradients, motion rules, and React UI components. Trigger even when the user does not say "design" but the output should look like Aidapt.
---

Read the `readme.md` file within this skill, and explore the other available files.

Aidapt is the operator's AI firm — it builds the AI your business actually runs on, with a translation-first approach and three client-facing capabilities: Operations, Intelligence, and Enablement. The brand counter-positions on **calm** — spare, ordered, premium, restrained. "Complexity made calm." Lead with white; Water (teal `#11A8A0`) is the always-present hero; colour is earned; Fire/Ember (`#FF8A5B`) is a ≤5% CTA-only spark; every layout passes a 2-second squint test; the chevron `>` means *from > to*.

## What's here
- `styles.css` — the single entry point. Link it and you get every token + the four self-hosted fonts (Manrope, Inter, Source Serif 4, IBM Plex Mono).
- `tokens/` — colour ramps + semantics, type scale, spacing, radius/shadow/z, motion (springs + curves), materials (translucency + vibrancy + scrims), gradients/grain.
- `components/` — React primitives (Button, Input, Card, Badge, Alert, Modal, Sheet, Tabs, DataTable, Sidebar, …) plus `Motion` — the fluid-motion engine (`window.AidaptMotion`: interruptible springs, velocity handoff, momentum projection, rubber-banding). Each has a `.jsx`, a `.d.ts` props contract, and a `.prompt.md` with usage.
- `patterns/` — assembled examples (stat row, form, card grid, gradient hero).
- `ui_kits/aidapt-console/` — a full interactive product screen built from the system.
- `assets/` — logos (light/dark), the chevron mark in its five approved colours, fonts.
- `guidelines/` — specimen cards + the developer handoff (full `:root` + JSON token dump).

## How to work
- **Visual artifacts** (slides, mocks, throwaway prototypes): copy the assets you need out of `assets/`, link or inline `styles.css`, and produce static/standalone HTML for the user to view. Use the tokens and the rules in `readme.md` (CONTENT FUNDAMENTALS + VISUAL FOUNDATIONS) so it looks unmistakably Aidapt.
- **Production code**: lift the token CSS (`tokens/`) and the component implementations (`components/<group>/<Name>.jsx`), read the `.prompt.md` files, and design as an expert in the brand.
- **Non-negotiables**: never put white text on Teal or Ember (use Ink); keep Fire ≤5%; never introduce magenta/purple/pink; headlines are Manrope, sentence case, no trailing periods (verb series take periods, questions take "?"); the serif is for pull quotes only; gradients are always cropped, Water-led, and grain-textured, never run fully warm.
- **Fluid interaction (non-negotiable too)**: feedback on pointer-down, never on release; anything draggable tracks 1:1 and uses `window.AidaptMotion` springs (interruptible, velocity handed off on release, momentum projected to pick the target, rubber-band at edges); damping 1.0 by default, ~0.8 bounce only after a flick; fixed curves (`--ease-*`) only for non-gesture state changes; translucent materials encode hierarchy (thick = structure, thin = floating controls, never stacked); reduced motion gets a crossfade (`--dur-fade`), never dead lock-out.

If the user invokes this skill without other guidance, ask what they want to build or design, ask a few focused questions, then act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

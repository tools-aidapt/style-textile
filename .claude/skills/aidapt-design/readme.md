# Aidapt Design System

> Complexity made calm. The living source of truth for Aidapt's brand, interface, and voice — shared by designers and developers. Last refreshed alongside the v1 component set (29 components, 338 tokens).

Aidapt is the operator's AI firm: it builds the AI your business actually runs on. The approach is translation-first, serving MEA and APAC, with three client-facing capabilities — Operations, Intelligence, and Enablement. The brand **counter-positions on calm**: where the category shouts about speed, scale, and dazzle, Aidapt is spare, ordered, premium, and restrained. The job of every screen, slide, and sentence is to make complex, high-stakes AI work feel effortless and trustworthy.

This project is a **design system**: a folder of tokens, components, UI kits, and guidelines that an automated compiler bundles into a runtime library. Consumers link one file — `styles.css` — and pull components from the `window.AidaptDesignSystem_0090ec` namespace.

**At a glance:** ~400 design tokens (incl. a `[data-theme="dark"]` Deep Flow theme) · 4 self-hosted font families · 31 React components incl. a fluid-motion engine · 40 specimen/preview cards · a developer handoff (full `:root` + JSON) · an interactive Aidapt Console UI kit. Validated end-to-end by the compiler.

**Fluid-interface doctrine (v2).** The system adopts Apple's fluid-interface methodology, translated to the web and to Aidapt's calm: respond on pointer-down; track gestures 1:1; every animation interruptible (springs from the presentation value); velocity handed off on release; momentum projected to choose targets; boundaries rubber-band; materials encode hierarchy; reduced motion gets crossfades. See `tokens/motion.css`, `tokens/materials.css`, `components/motion/`, and the Motion / Materials / Interaction cards.

---

## Sources & provenance

Everything here is derived from materials supplied directly by the Aidapt brand team. No external brand databases were consulted. (The raw `uploads/` source files are not shipped in this package — the extracted fonts and logo art live in `assets/`.)

| Source | What it gave us |
|---|---|
| `uploads/Aidapt New Logo 2026.png` (1562×781, transparent) | The master wordmark + chevron. Primary logo art. |
| `uploads/Aidapt New Logo 2026.svg` | Vector wordmark (the chevron in this file is a broken embedded raster — **do not use the SVG's chevron**; use the PNG art). |
| `uploads/Manrope.zip` | Manrope (wordmark + headlines). Weights 700/800 extracted. |
| `uploads/Inter (1).zip` | Inter (body/UI). Weights 400/500/600 extracted (18pt optical). |
| `uploads/Source_Serif_4.zip` | Source Serif 4 (2nd-level headings, pull quotes). 400/600. |
| `uploads/IBM_Plex_Mono.zip` | IBM Plex Mono (code, data, tokens). 400/500. |
| Brand brief (locked spec) | Palette anchors, colour governance, type rules, gradient recipe, accessibility pairings, chevron meaning. |

**All fonts are the genuine supplied families** — no Google Fonts substitutions were needed. Fonts are self-hosted from `assets/fonts/`.

---

## The locked system (do not redesign)

Aidapt's brand is engineered on the **feng-shui productive cycle** — Metal 金 → Water 水 → Wood 木 — used as *invisible engineering*, never named in the product UI. It governs how colour relates, not what users read.

- **Lead with white.** White is the default ground; whitespace is the loudest material.
- **Water (teal) is the hero and is always present.** Every layout carries a Water anchor.
- **Colour is earned, never decorative.** A surface starts neutral and earns colour by meaning.
- **Fire/Ember is a spark, ≤5%, CTAs only.** It marks the one action that matters.
- **Every layout passes the 2-second squint test.** One clear focal point, calm hierarchy.
- **Compositions move the eye forward.** The brand's `>` chevron means *from > to* — translation, progress, "this becomes that."

---

## CONTENT FUNDAMENTALS — how Aidapt writes

The voice is **calm, precise, and quietly confident** — a senior expert who has nothing to prove. It never hypes. It earns trust by being exact.

**Person & address.** Speak to the reader as **"you"**; speak as **"we"** for Aidapt. Warm but not chummy. ("You stay in control of the work. We build the AI that runs it.")

**Casing.** **Sentence case everywhere** — headlines, buttons, nav, labels. Title Case and ALL-CAPS are reserved: overlines/eyebrows may use uppercase with wide tracking (`--ls-wider`); nothing else shouts.

**Headlines.** Set in Manrope. **No trailing periods.** A question takes a `?`. A *series of verbs* takes periods between them as a rhythmic device — the brand signature: **"Translate. Adapt. Outperform."** A single headline statement never ends in a period.

**Tone of body copy.** Plain, concrete, short sentences. Lead with the benefit, then the mechanism. Prefer verbs over nouns ("adapt" not "adaptation"). Avoid hedging ("might," "could help"). Avoid jargon and AI-hype words ("revolutionary," "cutting-edge," "supercharge," "unleash," "10x").

**Numbers & claims.** Specific and verifiable — real figures anchored to real sources, never vague superlatives. If a number isn't real or verified, don't use one.

**Emoji.** **Never.** Not in product, marketing, or docs. The brand's expressive mark is the chevron `>`, not emoji.

**The chevron as punctuation.** `>` may appear in copy to mean *from → to* or to lead a label ("manual > automated"). Used sparingly, always pointing forward (right).

**Do / Don't examples**

| Do | Don't |
|---|---|
| Translate. Adapt. Outperform. | Translate, Adapt, And Outperform! |
| You stay in control of the work. | We revolutionize business with AI 🚀 |
| Three capabilities, one operating rhythm | Unlimited AI, infinite possibilities |
| Review the draft before it ships. | Click here to get started now!! |

---

## VISUAL FOUNDATIONS — how Aidapt looks

**Overall feel.** Editorial calm. Generous white space, a single confident focal point per view, hairline structure, quiet depth. Premium through restraint, not ornament. If a screen feels busy, remove — don't rebalance.

**Colour.** Built on three anchored families plus neutrals and a spark:
- **Water 水** (hero, always present): Deep Flow `#062A3B`, Aidapt Teal `#11A8A0`, Current Cyan `#36C5E0`.
- **Wood 木** (growth accents, never lead): Spring `#4FD1A5`, Sage `#9AD9C5`, Frost `#D6F0E9`.
- **Earth 土** (sparing warmth): Sand `#E8D8B0`, Warm Mist `#F4EEE0`.
- **Fire 火** (the spark, ≤5%, CTAs only): Ember `#FF8A5B`.
- **Metal 金** (neutrals, spend generously): Ink `#0A1A22`, Steel `#5A6B72`, Mist Grey `#EDF1F2`, White.
- Every anchor has a 50→900 OKLCH ramp (hue held, chroma tapered) — anchors are never altered. **No off-palette colour ever — no magenta, purple, or pink.**
- **Ratios.** Moments of impact: Water 50 / Metal 30 / Wood 10 / Earth 5 / Fire 5. Everyday: Metal 55 / Water 30 / Wood 10 / Earth+Fire 5.

**Type.** Manrope (700/800) for the wordmark and all headlines, sentence case. Inter (400/500/600) is the workhorse for body, UI, captions. Source Serif 4 (400/600) appears **only** for second-level headings and pull quotes — the human, Earth warmth — and **never** for headlines. IBM Plex Mono (400/500) for code, data tables, and tokens. One Water tone plus Ink/White is the most colour a headline ever carries; never colour both a headline and its subhead.

**Spacing.** 4px base, 8px rhythm. The scale runs 2→160px. Whitespace is intentional and large; when unsure, choose the bigger step. Reading measure caps ~66ch.

**Backgrounds.** Default is flat **white**. Dark surfaces use **Deep Flow** `#062A3B`. Gradients are reserved for hero moments and are **always cropped, never used whole, never run fully warm**:
- *Diagonal sweep* (2–3 stops, corner to corner) — the workhorse.
- *Flow mesh* (soft teal-led radial blooms over Deep Flow, cyan luminous core) — landmark heroes.
- The cool→warm bridge runs the productive cycle **Spring → Sand → Ember** (analogous, so it never greys); **teal is never blended directly into ember**.
- Every gradient carries a **fine film-grain overlay** (two speckle layers, black ~38% / white ~30%, through the alpha) to add texture and kill banding.
- No photographic imagery is part of the locked system; no hand-drawn illustration. Texture comes from grain, not pattern.

**Corner radii.** Restrained and soft, never bubbly: 8px default (buttons, inputs), 12px cards, 16px modals, pills only for chips/toggles/avatars.

**Borders.** Hairline `1px` is the default structural line (Mist Grey). 2px marks focus/selection; a 3px keyline is reserved for the chevron mark and rare emphasis.

**Cards.** White surface, `12px` radius, **hairline border** (`--border-default`), and a **quiet shadow tinted toward Deep Flow** (`--shadow-sm`) — elevation is on-brand, never neutral grey/black. Cards lift on hover by deepening the shadow one step, not by scaling.

**Elevation & shadows.** All shadows are tinted with Deep Flow `rgba(6,42,59,…)` at low opacity — calm depth, soft and low-contrast. A teal glow (`--shadow-teal`) exists only for brand/hero focus moments.

**Animation.** Motion has meaning — it carries the eye **forward** (left→right, the reading/chevron direction) and never decorates. The system is **springs-first**: anything a user can touch animates with `window.AidaptMotion` — interruptible springs that start from the current on-screen value, track the finger 1:1 (respecting the grab offset), inherit release velocity, **project momentum** to choose the landing, and **rubber-band** at boundaries. Damping `1.0` (no overshoot) is the default; `~0.8` bounce is *earned* by a flick or throw, never granted to a menu. Fixed curves (`--ease-forward` et al., 140–340ms) serve only non-gesture state changes; `--ease-spring`/`--ease-spring-bounce` give CSS transitions a sprung settle. **No infinite decorative loops.** All motion respects `prefers-reduced-motion` — which means a `--dur-fade` crossfade, never dead lock-out.

**Hover states.** Buttons/links deepen one ramp step (e.g. teal-400 → teal-600); ghost/secondary fill a faint teal/mist wash. Cards deepen their shadow. Opacity dimming is avoided — we change colour, not transparency.

**Press / active states.** Feedback lands on pointer-**down**, never on release: a 90ms (`--dur-press`) settle of `translateY(1px)` + a whisper of scale (≥0.985) plus the next-darker ramp step; release springs home via `--ease-spring`. Commit still happens on release, so dragging away cancels. No large scale changes. Tap latency is engineered out (`touch-action: manipulation`, no tap flash).

**Transparency & blur — materials.** Translucency is a functional layer that encodes hierarchy, never decoration on flat white. Three materials (`--material-thick/regular/thin-bg` + blur tokens, light and dark): **thick** separates structure (sidebars, sheets), **regular** carries toolbars/nav with content scrolling beneath, **thin** floats small controls. Bigger surfaces read thicker (deeper blur + shadow). **Never stack two materials.** Over a material, use the vibrant text tokens (`--text-vibrant*`) — a step heavier, never flat grey; colour stays on solid layers. Scrims (`--scrim-modal`) dim only blocking tasks; parallel panels float without one. Prefer a scroll-edge fade (`.ads-scroll-edge-*`) to hard 1px dividers under floating chrome. `prefers-reduced-transparency` → solid; `prefers-contrast: more` → solid + border — built into the tokens.

**Focus.** Always visible: a 3px teal ring (`--ring`), cyan in dark mode. Never removed.

**Layout rules.** Sticky top-nav and side-nav sit at `--z-sticky`. Content respects the container max-width and page gutters. The chevron, when used as a graphic device, points forward and sits at a layout's leading edge or between "from" and "to" states.

---

## ICONOGRAPHY

Aidapt ships **no proprietary icon font or custom icon set** in the supplied materials. The one true brand mark is the **chevron `>`** (`assets/logo/aidapt-chevron*.png`) — see the Chevron section in the Design System tab. It may appear solid or as a keyline, and **only** in Aidapt Teal, Deep Flow, Current Cyan, Ink, or White — **never warm**. It always means *from > to / translation* and always points forward.

For UI affordance icons (arrows, close, check, search, etc.), this system uses **[Lucide](https://lucide.dev)** loaded from CDN — chosen because its **1.5px–2px even stroke, rounded joins, and geometric calm** match Manrope/Inter and the brand's restraint. Icons inherit `currentColor`, size to the text they sit beside (16/20/24px), and never carry their own colour fill. Where a "forward" affordance is needed, prefer Lucide's `chevron-right` / `arrow-right` to echo the brand mark.

- **CDN:** `<script src="https://unpkg.com/lucide@latest"></script>` then `lucide.createIcons()`, or the inline SVG per icon.
- **Substitution flag:** Lucide is a substitution for an as-yet-unspecified Aidapt icon set. If Aidapt has (or commissions) a bespoke set, replace the CDN reference and update this section.
- **Emoji and unicode dingbats are never used as icons.** The only unicode mark in play is the chevron `>` / `›`.

---

## VISUAL ASSETS

In `assets/`:
- `logo/aidapt-logo.png` — master wordmark + chevron (Ink wordmark, Teal chevron) for light backgrounds.
- `logo/aidapt-logo-dark.png` — white wordmark + Teal chevron, for Deep Flow / dark backgrounds.
- `logo/aidapt-logo.svg` — vector wordmark master (chevron not usable — see Sources).
- `logo/aidapt-chevron.png` — standalone Teal chevron mark, plus `-white`, `-deepflow`, `-cyan`, `-ink` recolours (the only approved colours).
- `fonts/` — the four self-hosted families.

Never recolour the wordmark into a warm tone. Never place white text on the Teal chevron.

---

## INDEX — what's in this project

**Root**
- `styles.css` — the single global entry point (import manifest only). Link this.
- `readme.md` — this document.
- `SKILL.md` — Agent-Skills wrapper so the system can be used inside Claude Code.

**`tokens/`** — CSS custom properties, one file per concern, all reached from `styles.css`:
`fonts.css` · `colors.css` · `typography.css` · `spacing.css` · `elevation.css` (radius/borders/shadow/z) · `motion.css` (durations/curves + spring parameters) · `materials.css` (translucency, vibrancy, scrims, adaptive fallbacks) · `layout.css` (breakpoints/gradients/grain) · `base.css` (element defaults, tap-latency kill).

**`guidelines/`** — foundation specimen cards (the Design System tab): colour ramps, semantic + contrast, type scale, spacing, radius/shadow, motion, gradients, the chevron mark, and the developer handoff (CSS `:root` + JSON).

**`components/`** — reusable React primitives (namespace `AidaptDesignSystem_0090ec`): buttons, forms, cards, badges/tags, feedback (alert/toast/banner), overlays (modal/tooltip), navigation (tabs/breadcrumbs/pagination), data (table/avatar/progress), etc. Each has `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md`, and a `@dsCard` HTML.

**`patterns/`** — assembled examples proving the system in context: dashboard stat row, form layout, content-card grid, and a cropped teal-gradient hero with a single Ember CTA.

**`templates/`** — starting points offered to consuming projects. `aidapt-console/` is the interactive translation-console dashboard.

**`ui_kits/`** — full-screen product views composed from the components. `aidapt-console/` is the specimen copy rendered in the Design System tab (the consumable template lives in `templates/`).

**Generated by the compiler (never hand-edit):** `_ds_bundle.js` — the pre-built component bundle the specimen card HTMLs load.

### Current inventory (v1)
- **Components (31):** Button, IconButton · Input, Textarea, Select, Checkbox, Radio, Switch, FormField · Card · Badge, Tag · Avatar, AvatarGroup · Alert, Toast, Banner · Progress, Spinner, Skeleton · Modal, Sheet, Tooltip · Tabs, Breadcrumbs, Pagination · DataTable, EmptyState · TopNav, Sidebar · Motion (the fluid-motion engine, `window.AidaptMotion`).
- **Cards (40):** Brand 4 · Colors 8 · Type 4 · Spacing 3 · Motion 2 · Materials 1 · Interaction 1 · Components 12 · Patterns 4 · Handoff 1 · Aidapt Console 1.
- **Tokens (338):** colour, type, spacing, radius, elevation, motion, layout — plus a `[data-theme="dark"]` Deep Flow theme scope.
- **Templates:** Aidapt Console (`templates/aidapt-console/`) — the starting point consuming projects copy.
- **Fonts (4):** Manrope, Inter, Source Serif 4, IBM Plex Mono — all self-hosted.

> The Design System tab renders every `@dsCard`-tagged HTML in the project, grouped by section.

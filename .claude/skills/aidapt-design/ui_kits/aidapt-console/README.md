# Aidapt Console — UI kit

A full-screen, interactive recreation of the **Aidapt translation console**, composed entirely from this design system's primitives — no bespoke styling beyond layout glue.

> Note: Aidapt supplied a brand system, not a product codebase or Figma. This console is a faithful *application* of the system (the brand's own tokens, components, voice, and the chevron `from > to` motif) — not a redesign and not a copy of any third-party product.

## Screen
- `index.html` — the **Projects dashboard**. Interactive:
  - Sidebar + top-nav chrome (`Sidebar`, `TopNav`, `IconButton`, `Avatar`).
  - A stat row, tabs filter, and a sortable `DataTable` with `Badge`, `Progress`, and `AvatarGroup` cells.
  - **New project** (Ember CTA) opens a `Modal` with a real `FormField`/`Input`/`Select`/`Textarea` form, inline duplicate-name validation, then creates a row and fires a success `Toast`.
  - Tabs filter to an `EmptyState` when a filter has no matches.

## Components used
TopNav · Sidebar · Breadcrumbs · Tabs · DataTable · Card · Badge · Progress · Avatar / AvatarGroup · Button · IconButton · Modal · FormField · Input · Select · Textarea · Switch · Toast · EmptyState.

## Conventions
- One Ember CTA per view ("New project"); everything else is Teal/ghost.
- Sentence-case copy, no trailing periods on headings, the `EN › JA` chevron pair for language direction.
- Icons: Lucide (CDN) at 18px, `currentColor` — see the README ICONOGRAPHY section.

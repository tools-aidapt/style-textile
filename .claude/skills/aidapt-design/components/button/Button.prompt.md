Aidapt's primary action button — use for any clickable action; `primary` (Teal) by default, `cta` (Ember) for the single most important action on a view.

```jsx
<Button variant="primary" onClick={save}>Save changes</Button>
<Button variant="cta" iconRight={<ChevronRight/>}>Start a project</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost" size="sm">Learn more</Button>
<Button variant="destructive" loading>Deleting…</Button>
```

Variants: `primary` · `cta` · `secondary` · `ghost` · `destructive`. Sizes: `sm` (36px) · `md` (44px) · `lg` (52px). Props: `loading`, `disabled`, `fullWidth`, `iconLeft`, `iconRight`, `as`.

Rules: Teal and Ember buttons always carry an **Ink** label, never white. Use at most one `cta` per view (Fire ≤5%). Reach for `secondary`/`ghost` for everything supporting.

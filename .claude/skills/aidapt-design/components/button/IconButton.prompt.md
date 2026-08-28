Icon-only square button for toolbars and compact controls — always pass an accessible `label`.

```jsx
<IconButton icon={<Search/>} label="Search" />
<IconButton icon={<Plus/>} label="New project" variant="primary" />
<IconButton icon={<Settings/>} label="Settings" variant="outline" size="sm" />
```

Variants: `ghost` (default) · `primary` · `outline`. Sizes match Button (`sm`/`md`/`lg`). Hit target is never below 36px.

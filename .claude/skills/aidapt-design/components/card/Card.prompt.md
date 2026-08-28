The content surface for grouping related information — white, hairline border, quiet shadow.

```jsx
<Card eyebrow="Localization" title="Spring launch" subtitle="12 languages · 4 in review"
      footer={<Button variant="primary" size="sm">Open</Button>}>
  Terminology locked. Two markets pending sign-off.
</Card>

<Card variant="elevated" interactive accent>…</Card>
```

Variants: `default` · `outline` · `elevated`. Flags: `interactive` (hover lift), `accent` (teal top keyline), `padding="lg"`. You can ignore the header props entirely and just pass children for full control.

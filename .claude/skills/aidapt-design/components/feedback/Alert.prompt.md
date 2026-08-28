Status messaging at three scales: `Alert` (inline, tied to a region), `Toast` (transient float), `Banner` (full-width page-level).

```jsx
<Alert variant="success" title="Translation memory updated" onClose={dismiss}>
  428 segments synced across 3 languages.
</Alert>

<Toast variant="error" title="Export failed" onClose={dismiss}>Retry in a moment.</Toast>

<Banner variant="gradient" grain actions={<Button variant="cta" size="sm">Start a project</Button>}>
  <strong>New:</strong> adaptive glossaries are live.
</Banner>
```

Variants map to semantic colours (info/success/warning/error). Banners take a Water tone (`teal`/`deep`/`gradient`) and may carry at most one Ember CTA. Errors get `role="alert"`.

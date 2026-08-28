Full-width, page-level announcement. Use a Water tone; carry at most one Ember CTA.

```jsx
<Banner variant="teal" actions={<Button variant="cta" size="sm">Upgrade</Button>} onClose={dismiss}>
  <strong>Trial ends in 5 days.</strong> Keep your glossaries and memory.
</Banner>
```
Variants: neutral · teal · deep · gradient (add `grain` on deep/gradient). Sits at the top of a page or app region.
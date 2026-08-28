Zero-state for empty tables, lists, and no-result searches — guide the user to the next action.

```jsx
<EmptyState title="No projects yet" description="Start your first translation project to see it here."
  actions={<Button variant="cta">Start a project</Button>} />
```
Keep one primary action (at most one Ember CTA). Icon sits in a calm teal tile.
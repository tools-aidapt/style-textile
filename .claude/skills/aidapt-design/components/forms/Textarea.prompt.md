Multi-line text input; vertically resizable. Wrap in FormField for label/help/error.

```jsx
<FormField label="Brief" htmlFor="b"><Textarea id="b" rows={4} placeholder="Tone, audience…" /></FormField>
```
Pass `invalid` for the error border. Shares the field styling + focus ring with Input/Select.
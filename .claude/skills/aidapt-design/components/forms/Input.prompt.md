Text input controls and form primitives. Use `Input`, `Textarea`, `Select` for entry; `Checkbox`, `Radio`, `Switch` for toggles; wrap each in `FormField` for label/help/error.

```jsx
<FormField label="Work email" htmlFor="email" required help="We'll only use this for project updates.">
  <Input id="email" type="email" placeholder="you@company.com" prefix={<Mail/>} />
</FormField>

<FormField label="Target language" htmlFor="lang">
  <Select id="lang"><option>Japanese</option><option>German</option></Select>
</FormField>

<FormField label="Notes" htmlFor="n" error="Notes can't be empty">
  <Textarea id="n" invalid />
</FormField>

<Checkbox label="Use my saved glossary" defaultChecked />
<Radio name="tone" label="Formal" defaultChecked />
<Switch label="Auto-publish approved segments" />
```

All controls share one focus ring (teal) and one error treatment (error-600 border + helper). `invalid` flips Input/Select/Textarea to the error border; pass `error` to FormField to show the message.

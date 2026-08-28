Field wrapper: label (+ required/optional marker), the control, and help OR error text.

```jsx
<FormField label="Work email" htmlFor="e" required error="That email is taken">
  <Input id="e" invalid />
</FormField>
```
`error` replaces `help` and adds an alert icon + role="alert". Required shows a teal asterisk.
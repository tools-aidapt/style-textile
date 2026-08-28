Status and category labels. `Badge` is a read-only status pill; `Tag` is an interactive chip (removable / selectable).

```jsx
<Badge variant="success" dot>Approved</Badge>
<Badge variant="teal" appearance="solid">Beta</Badge>
<Badge variant="warning">In review</Badge>

<Tag onRemove={() => drop('ja')}>Japanese</Tag>
<Tag selectable selected lead={<Filter/>}>Formal</Tag>
```

Badge variants: `neutral · teal · info · success · warning · error`; appearance `soft` (default) · `solid` · `outline`; `dot` for a status dot; `size="sm"`. Never code a feature by colour alone — pair colour with text.

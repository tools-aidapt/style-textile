User avatar with an initials fallback and optional presence dot; `AvatarGroup` overlaps several with a “+N”.

```jsx
<Avatar name="Aiko Tanaka" src={url} status="online" />
<Avatar name="Lev Petrov" size="lg" />
<AvatarGroup max={3} size="sm">
  <Avatar name="Aiko Tanaka" /><Avatar name="Lev Petrov" /><Avatar name="Mei Lin" /><Avatar name="Sam Ortiz" />
</AvatarGroup>
```

Sizes `xs–xl`; `shape="square"` for org/workspace avatars. Initials use the brand teal tint with Ink text (never white on teal).

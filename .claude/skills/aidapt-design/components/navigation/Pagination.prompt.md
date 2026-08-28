Page navigation with automatic truncation (…) for long ranges. Controlled, 1-based.

```jsx
const [page,setPage]=React.useState(1);
<Pagination page={page} total={24} onChange={setPage} />
```
Active page is teal with an Ink label. Prev/next disable at the ends.
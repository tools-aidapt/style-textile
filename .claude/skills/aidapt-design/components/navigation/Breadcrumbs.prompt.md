Breadcrumb trail — the separator is the brand chevron (from > to).

```jsx
<Breadcrumbs items={[
  {label:'Projects',href:'/projects'},
  {label:'Spring launch',href:'/p/spring'},
  {label:'German'},
]}/>
```
The last item renders as the current page (bold, non-interactive). Keep trails shallow.
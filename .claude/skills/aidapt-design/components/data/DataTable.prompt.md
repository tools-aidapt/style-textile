Tabular data with hover rows, right-aligned numeric (mono) columns, and optional sort.

```jsx
<DataTable
  sort={{key:'updated',dir:'desc'}} onSort={k=>setSort(k)}
  columns={[
    {key:'name',header:'Project'},
    {key:'lang',header:'Languages'},
    {key:'segments',header:'Segments',align:'right',sortable:true},
    {key:'status',header:'Status',render:r=><Badge variant={r.tone}>{r.status}</Badge>},
  ]}
  data={rows}
/>
```
Right-aligned columns auto-switch to tabular mono. Provide `render` to embed Badges/Avatars. Use `dense` for long lists.
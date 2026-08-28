Vertical navigation rail, grouped into sections with icons and count badges.

```jsx
<Sidebar
  groups={[
    {items:[{label:'Dashboard',icon:<Home/>,active:true},{label:'Projects',icon:<Folder/>,badge:12}]},
    {title:'Library',items:[{label:'Memory',icon:<Database/>},{label:'Glossaries',icon:<Book/>}]},
  ]}
/>
```
Active item gets a teal wash + leading keyline. `theme="dark"` for a Deep Flow rail (cyan active). 248px wide by default.
- `material` — renders the rail as a thick translucent material (structural layer). Never stack another material on top of it.

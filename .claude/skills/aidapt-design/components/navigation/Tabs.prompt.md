Underlined tab bar for switching views within a page (controlled).

```jsx
const [tab,setTab]=React.useState('all');
<Tabs value={tab} onChange={setTab} tabs={[
  {id:'all',label:'All',count:128},
  {id:'review',label:'In review',count:4},
  {id:'done',label:'Approved'},
]}/>
```
Active tab is teal with a sliding underline. Supports `icon` and `count` per tab, and `disabled`.
- The underline is a single shared indicator that **springs** between tabs (measured FLIP-style, `--ease-spring`), instead of fading per-tab.

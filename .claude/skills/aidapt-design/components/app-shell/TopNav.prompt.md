Top navigation bar for the app/marketing shell — brand on the left, links center, actions right.

```jsx
<TopNav
  logo={<img src="/assets/logo/aidapt-logo.png" alt="Aidapt" />}
  items={[{label:'Projects',active:true},{label:'Memory'},{label:'Glossaries'}]}
  actions={<><Button variant="ghost" size="sm">Docs</Button><Avatar name="Aiko Tanaka" size="sm"/></>}
/>
```
`theme="dark"` swaps to a Deep Flow bar with cyan active state. Active link is teal.
- `material` — renders the bar as floating translucent chrome (regular material); pair with `position: sticky` so content scrolls beneath. Adaptive fallbacks (reduced transparency / contrast) are automatic.

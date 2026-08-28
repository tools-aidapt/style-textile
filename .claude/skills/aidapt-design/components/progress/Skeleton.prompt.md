Content-shaped loading placeholder with a calm shimmer.

```jsx
<div style={{display:'flex',gap:12}}>
  <Skeleton variant="circle" width={40} height={40} />
  <div style={{flex:1}}><Skeleton variant="text" lines={2} /></div>
</div>
<Skeleton variant="rect" height={140} />
```
Variants: text (use `lines`) · circle · rect. Mirror the real content's layout so the swap is calm.
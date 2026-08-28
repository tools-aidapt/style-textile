Overlays: `Modal` (centered dialog over a Deep-Flow scrim) and `Tooltip` (hover/focus hint).

```jsx
const [open, setOpen] = React.useState(false);
<Button onClick={() => setOpen(true)}>Delete project</Button>
<Modal open={open} onClose={() => setOpen(false)} title="Delete project?"
  subtitle="This removes the memory and glossary too."
  footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive">Delete</Button></>}>
  You can't undo this. Exported files are unaffected.
</Modal>

<Tooltip label="Re-runs translation memory" placement="top">
  <IconButton icon={<RefreshCw/>} label="Sync" />
</Tooltip>
```

Modal: pass `static` to render the panel inline (docs). Scrim click + × call `onClose`. Tooltip placements: `top·bottom·left·right`; it shows on hover and keyboard focus.

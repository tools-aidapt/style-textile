# Sheet

Bottom sheet for parallel, dismissible tasks — pickers, detail peeks, quick forms. Use Modal for blocking decisions; Sheet for tasks the user may toss away.

```jsx
const [open, setOpen] = useState(false);
<Sheet open={open} onClose={() => setOpen(false)}
  title="Share report" subtitle="Choose a format"
  footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button>Share</Button></>}>
  …content…
</Sheet>
```

- Gesture physics are built in: the grab region (grip + header) tracks 1:1, rubber-bands above rest, and a downward flick dismisses based on **projected momentum**, not release position. The settle spring inherits the finger's velocity and can be grabbed mid-flight.
- `material` (default true) renders the thick translucent material; text inside uses the vibrant tokens. Pass `material={false}` over busy imagery if legibility suffers — or when stacking (never stack two materials).
- `static` renders the panel inline for docs.
- Reduced motion: jumps + scrim crossfade, handled automatically.

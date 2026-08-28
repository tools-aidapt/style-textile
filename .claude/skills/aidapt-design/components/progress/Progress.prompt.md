Loading and progress feedback: `Progress` (linear bar), `Spinner` (inline ring), `Skeleton` (content placeholder).

```jsx
<Progress value={68} label="Translating" showValue />
<Progress indeterminate label="Syncing memory" />
<Spinner size="sm" /> <Spinner onDark />
<Skeleton variant="circle" width={40} height={40} />
<Skeleton variant="text" lines={3} />
<Skeleton variant="rect" height={120} />
```

Progress fill is Aidapt Teal by default (semantic variants available). Spinner top arc is teal (cyan on dark). Skeletons use a calm Mist shimmer — keep sequences short. All respect `prefers-reduced-motion`.

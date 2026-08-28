Transient floating notification — render inside your own fixed/positioned viewport and auto-dismiss on a timer.

```jsx
<div style={{position:'fixed',right:24,bottom:24,display:'flex',flexDirection:'column',gap:12}}>
  <Toast variant="success" title="Saved" onClose={dismiss}>Draft saved to memory.</Toast>
</div>
```
Variants: info/success/warning/error (a left colour rail). Keep messages to one line; for richer in-page messages use Alert.
- With `onClose`, the toast is **swipeable**: 1:1 horizontal drag (10px hysteresis), leftward rubber-bands, a rightward flick dismisses by projected momentum; the exit spring inherits release velocity.

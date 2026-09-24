Diagnostic toast at z-level 3 — stack them bottom-right with 0.5rem gaps and a 1rem viewport margin.

```jsx
<Toast tone="warn" timestamp="12:04:51" leading={<Icon name="triangle-alert" size={14} />}
  title="provider degraded" detail="openai us-east p50 3.8s — falling back to @fast"
  action={<Button size="sm" variant="ghost">view trace</Button>} onDismiss={close} />
```

Copy is lowercase, technical and specific: name the provider, the code and the action taken. Tone maps to the same colour logic as `Badge`.

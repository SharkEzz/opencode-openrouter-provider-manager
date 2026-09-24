Micro-pill for metadata attached to a row, model or provider. Text is lowercase mono, uppercased by the label-sm treatment.

```jsx
<Badge tone="telemetry" dot>live</Badge>
<Badge tone="meta">cache 41%</Badge>
<Badge tone="warn" shape="pill" dot>degraded</Badge>
```

Tone carries meaning: cyan = active telemetry, magenta = cache/build metadata, blue = routing alias, amber = degradation, crimson = fault, emerald = healthy. Keep to one or two badges per row.

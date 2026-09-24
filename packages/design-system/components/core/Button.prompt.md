Primary action trigger — use for commit/route actions in palettes, dialogs and toolbars; never for navigation.

```jsx
<Button variant="primary" size="md" leading={<Icon name="zap" size={14} />}>Route request</Button>
```

Variants: `primary` (electric blue fill, white label, glow on hover), `secondary` (pane fill + 1px outline), `ghost` (transparent, slate glyph → cyan on hover), `telemetry` (cyan tint + cyan rim, for live-data actions), `danger` (crimson outline, fills on hover). Sizes map to the density scale: `sm` 24px, `md` 28px, `lg` 36px. Labels are mono, sentence case, never title case.

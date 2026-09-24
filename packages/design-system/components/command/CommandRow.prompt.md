A single palette row. Columns are fixed-width mono so figures align vertically down the list.

```jsx
<CommandRow selected name="claude-sonnet-4.6" provider="anthropic"
  cost="$0.11 in / $0.55 out /M" context="ctx 1.1M"
  health={{ tone: 'ok', label: '99.9%' }} alias="@fast" />
```

Selected rows take the solid `#0058be` fill with bold white text, a 1px cyan inset rim, a cyan glow and a trailing indicator dot. Use `dense` for log and trace lists.

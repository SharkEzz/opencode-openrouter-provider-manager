The system's signature surface — a centred frosted-glass palette for Ctrl+P, model routing and provider selection.

```jsx
<CommandPalette
  query={q} onQueryChange={setQ} selectedId={sel} onSelect={setSel}
  groups={[{ label: 'frontier', meta: '3', items: models }]}
  footer={<><span>↑↓ navigate</span><span>⏎ route</span></>} />
```

Sits at z-level 2, centred with 1rem viewport margins, 640–720px wide, 95% fill with a 16px backdrop blur and an electric top rim. Groups are lowercase section labels; rows are `CommandRow`. Never nest a palette inside a docked panel.

Tree row for MCP registries, context inspectors and file lineage. Fixed 28px dense height.

```jsx
<TreeItem label="filesystem" expanded={open} onToggle={toggle} status="ok" meta="14 tools">
  <TreeItem depth={1} label="read_file" meta="1.2k" />
</TreeItem>
```

Lineage lines are `rgba(255,255,255,.08)`; connected servers get an emerald dot with a soft ping glow. Selection is the slate tint plus a 1px cyan left edge, never the solid blue fill (that is reserved for palette rows).

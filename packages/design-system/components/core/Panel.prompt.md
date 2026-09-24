Structural container for every docked or floating surface. Depth comes from the 1px rim and translucency, not drop shadows.

```jsx
<Panel title="mcp registry" meta="7 connected" tone="docked" padded={false} actions={<IconButton label="Refresh"><Icon name="refresh-cw" size={12} /></IconButton>}>
  <TreeItem label="filesystem" status="ok" />
</Panel>
```

Use `tone="glass"` + `rim` for command palettes and modals (95% fill, 16px backdrop blur, electric top rim). Set `padded={false}` when the body is a flush list of fixed-height rows.

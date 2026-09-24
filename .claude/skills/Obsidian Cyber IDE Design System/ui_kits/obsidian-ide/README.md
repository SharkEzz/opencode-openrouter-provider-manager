# Obsidian Cyber IDE — UI kit

A click-through recreation of the product's four core surfaces, composed entirely from this
design system's primitives (`window.ObsidianCyberIDEDesignSystem_fe171d`). Nothing here
re-implements a primitive; screens are layout + fake data only.

## Files

| File | Surface |
| --- | --- |
| `index.html` | App shell — activity rail, tab bar, status bar, palette overlay, toast stack. Entry point. |
| `Chrome.jsx` | `ActivityRail`, `TitleBar`, `StatusBar` — the persistent chrome. |
| `EditorWorkspace.jsx` | Explorer + code canvas + terminal/router log + right-hand context & MCP inspector. |
| `McpRegistry.jsx` | MCP server registry: tree of servers and tools, connection telemetry, call log. |
| `ProviderSettings.jsx` | Provider table with enable switches, routing policy, spend, keys, hotkeys. |
| `TraceLog.jsx` | Request trace list with a detail pane and stage timings. |
| `RoutePalette.jsx` | The Ctrl+P model router — glass palette over a dimmed workspace. |

## Interactions that work

- **Ctrl+P / ⌘P** or the title-bar search opens the route palette; type to filter, click a row
  to route. Routing updates the status bar and fires a confirmation toast. **Esc** closes.
- The activity rail switches between the four screens.
- Explorer, MCP and context trees expand/collapse and hold selection.
- Provider switches, routing-policy toggles and trace selection are all live.
- Toasts dismiss individually; the degraded-provider toast jumps to the trace screen.

## Deliberate gaps

Nothing is wired to a backend: code content, telemetry figures, prices and uptimes are fixed
fake data. Editing in the code canvas, resizing panes and real keyboard navigation of palette
rows (↑↓) are out of scope for the kit.

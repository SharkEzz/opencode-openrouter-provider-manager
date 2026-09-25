[Design system colors](assets/ds-colors.png)

# Obsidian Cyber IDE — Design System

A developer-first command surface for an AI-native IDE: model routing, provider telemetry, MCP
tooling and prompt tracing. The system is built for **high information throughput on a dark
canvas** — terminal-grade density, monospace everywhere it matters, and neon-accented glass for
anything that floats above the editor.

## Sources

This system was authored from a **written brand and style brief only** (pasted into the project
chat: name, colour tokens, typography scale, radii, spacing, plus prose on tone, colour,
elevation, shape and component behaviour).

- No codebase, repository or local folder was attached.
- No Figma file or link was provided.
- No slide deck, screenshots or existing product build were provided.
- **No logo or brand asset files were provided** — see *Brand mark* below.

Everything visual here is derived from those written values. Where the brief gave two different
answers, the decision is recorded under *Known conflicts in the brief*.

## Products

The brief describes a single product with four surfaces, all recreated in `ui_kits/obsidian-ide/`:

1. **Editor workspace** — explorer, code canvas, terminal / router log, context + MCP inspector.
2. **Route palette** — the Ctrl+P model router (the system's signature surface).
3. **MCP registry** — server/tool tree with connection telemetry and a call log.
4. **Providers & routing** — provider table, routing policy, spend, keys, hotkeys.
5. **Traces** — request trace list with detail pane and stage timings.

## Content fundamentals

Copy is written the way a good CLI writes its output: lowercase, specific, and never chatty.

- **Casing.** Interface labels, buttons, placeholders and toast titles are **lowercase**
  (`route request`, `evict cache`, `route to model…`). Only `label-sm` section headers are
  uppercased, and that is done by the type treatment (letter-spacing `+0.04em`), not by writing
  in caps. Headlines set in Inter are sentence case (`Model routing`).
- **Person.** Neither "I" nor "you". The interface names the system and the object:
  `provider degraded`, `falling back to @fast`, `3 retries exhausted`. No "we", no apologies,
  no "oops".
- **Specificity over reassurance.** Every message carries the identifier, the figure and the
  action taken: `openai us-east p50 3.8s — falling back to @fast` rather than
  "something went wrong, retrying".
- **Numbers are data.** Always with units and always abbreviated the same way: `412ms`, `1.1M`,
  `96k`, `41.2%`, `$0.11 in / $0.55 out /M`, `82 tok/s`. Thousands use commas (`12,884`);
  token counts use `k`/`M`. Never round a price.
- **Aliases are first-class nouns.** `@fast`, `@deep`, `@cheap`, `@local` appear inline in copy
  and right-aligned in rows.
- **Punctuation.** Middle dot `·` separates peer facts (`anthropic · us-east · stream`); em dash
  introduces a consequence (`p50 breach — abandoned`); colon prefixes a code
  (`route failed: 429`). Placeholders end in `…`.
- **Emoji: never.** Not in UI, not in docs, not in commit-style strings. Status is carried by a
  coloured dot, a badge or a glyph.
- **Vibe.** An instrument panel, not an assistant. The reader is a senior engineer mid-debug who
  wants the number, the provider and the fallback — in that order.

## Visual foundations

### Colour

Four strata, no decoration. Base canvas is pure black (`#000000`) for the editor only; app chrome
sits on `#131313`, docked panes step up `#1b1b1b → #1f1f1f → #2a2a2a → #353535`. Accents are
strictly functional:

| Accent | Value | Meaning |
| --- | --- | --- |
| Terminal electric blue | `#0058be` (ink `#adc6ff`) | active selection, routing triggers, consumed tokens |
| Cyber cyan | `#006970` (ink `#85d3db`) | live telemetry, uptime pings, hover ink, rate metrics |
| Neon magenta | `#9e00b5` (ink `#fbabff`) | cache, build metadata, context thresholds |
| Emerald / amber / crimson | `#10b981` / `#f59e0b` / `#ef4444` | healthy / degraded / fault |

Text runs on a four-step ramp: `#e2e2e2` primary, `#c2c6d5` secondary, `#94a3b8` muted,
`#64748b` faint. On the solid blue selection fill, ink goes to pure white at weight 600.
Maximum one accent per row; two badges per row is the ceiling.

### Type

Two faces, split by job. **Inter** (600, negative tracking) for headlines and administrative
chrome only — three sizes, 28/20/16px. **JetBrains Mono** for everything else: body copy,
telemetry, prices, logs, labels, code. `font-feature-settings: "tnum" 1, "zero" 1` is applied
globally on `body` so a streaming token counter never reflows, and zeros stay slashed.
Nothing is smaller than 11px (`label-sm`, uppercase, used for section headers only).

### Spacing and layout

4px modular grid: `4 / 8 / 12 / 16 / 24`. Panels and drawers have **zero outer margin** and a
strict `0.75rem` internal gutter — they dock edge to edge and are separated by 1px hairlines, not
whitespace. Floating palettes are 640–720px wide, centred, with a `1rem` viewport edge margin.
Row heights are fixed and never fluid: **28px** dense (code, logs, trees), **36px** item rows,
**44px** search inputs; the toolbar is 36px and the status bar 24px. Sidebars are 248px, the
inspector 296px. Layout is a docked split-pane shell: rail → sidebar → canvas → inspector, with
the status bar pinned to the bottom edge.

### Backgrounds and imagery

No photography, no illustration, no repeating pattern, no full-bleed gradient. The only
gradient permitted is a wide, very low-opacity radial bloom of blue or cyan behind glass
(see `guidelines/brand-glass.html`) to suggest a HUD backlight — never as a card fill, never
purple. Surfaces are flat colour plus a 1px rim.

### Elevation, transparency and blur

Depth is translucency and rims, not diffuse shadows. Docked surfaces get a 1px
`rgba(255,255,255,.08)` hairline and **no** shadow. Floating surfaces (palettes, modals,
toasts) get a 95%-opacity `#131313` fill, `backdrop-filter: blur(16px)`, a 1px `#1e293b`
border and an electric top rim `rgba(0,88,190,.3)`; only they carry a shadow
(`0 16px 48px rgba(0,0,0,.6)`). Blur is used **only** at z-level 2 and above — never on a
docked panel. Z-order: 0 canvas, 1 docked panes, 2 palettes, 3 toasts.

### Shapes, borders and cards

Roundedness is chiselled: 2px micro-tags, **4px** for panels, inputs, rows and buttons, 8px for
outer floating dialogs, 12px reserved, fully rounded only for status pills and dots. There is
no "card" in the marketing sense: a container is a `Panel` — flat fill, 1px hairline, 4px
radius, uppercase `label-sm` header on a 36px bar, 0.75rem body gutter. No elevation tiers, no
coloured left-border cards, no rounded-corner-plus-accent-stripe motif.

### States

- **Hover:** `rgba(255,255,255,.04)` fill on rows; ghost glyphs shift from `#94a3b8` to cyan;
  primary buttons brighten their fill ~12% and pick up a blue glow.
- **Selected (palette rows):** solid `#0058be` fill, bold white text, 1px inset cyan rim,
  `0 0 12px rgba(0,105,112,.25)` glow and a trailing cyan indicator dot.
- **Selected (trees/lists):** `#1e293b` tint plus a 1px cyan left edge — never the solid fill.
- **Press:** 0.5px downward nudge. No scale transforms, no bounce.
- **Focus:** 1px `#adc6ff` ring via `box-shadow`, plus a blue glow on inputs.
- **Disabled:** 38% opacity, no colour change.

### Motion

Three durations on one curve, `cubic-bezier(.2,.8,.3,1)`: **90ms** for row hover and dot pings,
**140ms** for button fills, focus rims and switch thumbs, **220ms** for budget-bar fills and
palette mounts. Properties animated are limited to `background`, `color`, `box-shadow`,
`border-color`, `width` and `left`. No fades on page regions, no easing-in on exits, no bounce,
no parallax. At most one `ping` indicator visible at a time.

## Iconography

- **Set:** [Lucide](https://lucide.dev) — 24px grid, 2px stroke, round caps. It matches the
  brief's "muted slate iconography" and thin-line HUD character.
- **Substitution flag:** the brief named no icon library and shipped no SVGs, so Lucide is a
  **substitution chosen by this system**, loaded from a CDN
  (`https://unpkg.com/lucide-static@latest/icons/<name>.svg`) rather than vendored into
  `assets/`. If the product has its own glyph set, drop the SVGs into `assets/icons/` and
  repoint `ICON_BASE` in `components/icon/Icon.jsx` — nothing else needs to change.
- **Implementation:** `<Icon name="git-branch" size={12} />` renders the SVG as a CSS mask so the
  glyph inherits `currentColor` and follows row ink automatically.
- **Sizes:** 11–12px inside 28px dense rows, 14px default (buttons, toolbars), 16px in the
  44px palette search and the activity rail.
- **Common glyphs:** `search`, `terminal`, `git-branch`, `activity`, `database`, `zap`,
  `plug`, `box`, `file-code`, `gauge`, `history`, `refresh-cw`, `triangle-alert`,
  `circle-stop`, `settings-2`, `chevron-right`.
- **No emoji, ever.** Unicode is used sparingly and only where it is typographic rather than
  pictorial: `·` separators, `▸ ▾` tree carets, `↑↓ ⏎ ⌥` in hotkey legends, `×` for dismiss,
  `>` as the palette prompt.
- **Brand mark:** none was supplied. Wherever a logo would sit, the system sets the name in
  JetBrains Mono 600 with tight tracking (`obsidian/cyber-ide`), or an `ob` tile on the primary
  blue at 28px for chrome. See `guidelines/brand-wordmark.html`. **No mark was drawn or
  approximated** — supply the real files and replace both.

## Light theme

An alternate light mode, opt in via `[data-theme="light"]` on any ancestor element — every
component re-themes automatically since it only ever reads the semantic aliases in
`tokens/colors.css`, and those are what `tokens/theme-light.css` overrides. No raw `--obs-*`
value or component file changes between themes.

- **Surfaces:** white canvas/panes, `#f3f5f8` app chrome — same four-strata structure as dark,
  just inverted in value.
- **Ink and accent text** move to darker pairs (`#0058be` route, `#00707a` telemetry,
  `#8a0099` meta) so they clear 4.5:1 on white; badge/status fills reuse the same alpha tints,
  since those composite correctly over any base.
- **Glass is more transparent and more blurred than dark** — 66% white fill and a 28px blur
  (dark uses 95% fill and 16px) — so palettes, toasts and the route-picker scrim genuinely show
  what's behind them.
- **Gradient background:** the app shell (`--app-gradient`) carries a soft radial bloom of blue
  and teal over an off-white wash instead of a flat fill — the one gradient in the system, used
  only at the outer app-background level, never inside cards or buttons.
- Toggle it live in `ui_kits/obsidian-ide/index.html` via the sun/moon icon in the title bar;
  specimens are under the "Light Theme" card group (`guidelines/light-*.html`).

## Known conflicts in the brief

1. **Canvas colour.** The token block sets `surface: #131313`; the prose calls for `#000000`
   base canvas and a `#0B0F19` docked surface. Resolution: tokens win for chrome and panes
   (`#131313`/`#1b1b1b`…), pure black is kept for the editor canvas only
   (`--surface-canvas`), and the blue-tinted `#0B0F19` is **not** used — it would have
   introduced a second neutral hue. `#1e293b` (also from the prose) is kept as the list
   selection tint.
2. **Accent ink vs container.** The prose names `#0058be`, `#006970`, `#9e00b5` as "the"
   accents; at the required 4.5:1 on dark surfaces those work as fills, not as text. Text and
   glyph accents therefore use the token block's lighter pairs (`#adc6ff`, `#85d3db`,
   `#fbabff`), with the darker values reserved for fills, tints and rims.
3. **Fonts.** Inter and JetBrains Mono are named but no binaries were supplied — both are
   loaded from public CDNs (`tokens/fonts.css`). Drop real files into `assets/fonts/` and
   repoint the two `@font-face` rules if you have licensed copies.

## Index

| Path | What it is |
| --- | --- |
| `styles.css` | Global entry point — `@import` list only. Consumers link this one file. |
| `tokens/fonts.css` | `@font-face` for Inter + JetBrains Mono (CDN). |
| `tokens/palette.css` | Raw palette: Material-3 role names, semantics, alpha primitives. |
| `tokens/colors.css` | Semantic aliases — surfaces, ink, lines, accents, status, syntax. |
| `tokens/typography.css` | Font stacks, the nine-step scale, mono feature settings, type utility classes. |
| `tokens/spacing.css` | 4px scale, radii, fixed row heights, panel/palette widths. |
| `tokens/elevation.css` | Glass, shadows, glows, focus ring, z-ladder, durations and easing. |
| `tokens/base.css` | Reset, body defaults, link colours, selection, scrollbars. |
| `guidelines/*.html` | 21 foundation specimen cards (Colors, Type, Spacing, Depth, Brand). |
| `components/**` | The reusable primitives, one directory per concern. |
| `ui_kits/obsidian-ide/` | Click-through recreation of the four product surfaces — start at `index.html`. |
| `thumbnail.html` | Homepage tile for the design system. |
| `.claude/skills/Obsidian Cyber IDE Design System/SKILL.md` (repository root) | Agent-skill wrapper that points Claude Code to this package. |

## Components

Mounted at `window.ObsidianCyberIDEDesignSystem_fe171d`. Each directory holds the `.jsx`, a
`.d.ts` props contract, a `.prompt.md` usage note and one specimen card.

**`components/core/`** — `Button`, `IconButton`, `Input`, `Switch`, `Panel`, `Kbd`
**`components/telemetry/`** — `Badge`, `StatusDot`, `TokenBudgetBar`, `MetricPair`
**`components/command/`** — `CommandPalette`, `CommandRow`
**`components/inspector/`** — `TreeItem`
**`components/feedback/`** — `Toast`
**`components/icon/`** — `Icon` (plus the `ICON_BASE` constant)

### Intentional additions

The brief described components as behaviour rather than an inventory, so the set above maps
1:1 onto the families it names (command & route selectors, routing/telemetry badges, buttons &
switches, telemetry & MCP inspector lists, token budget bar, toast diagnostics). Two primitives
were added because the described UI cannot be built without them:

- **`Icon`** — the brief mandates "muted slate iconography" but names no set; this is the single
  wrapper that keeps glyph sizing and `currentColor` inheritance consistent.
- **`Kbd`** — the brief requires "trailing hotkey indicators (`esc`, `ctrl+p`)" in palette
  headers; this is that chip.

No Avatar, Tabs, Tooltip, Select or Menu is provided: the brief does not describe them, and
inventing them would put unrecognisable primitives in front of consumers.

# Assets

**Empty by design.** The brand brief that this design system was authored from contained no
binary assets — no logo, no icon set, no imagery, no font files. Nothing here was drawn or
reconstructed from memory.

Drop real files in and the system will pick them up:

- `assets/logo.svg` — replaces the type-set wordmark in `guidelines/brand-wordmark.html`,
  `thumbnail.html` and the UI kit's activity rail (`ui_kits/obsidian-ide/Chrome.jsx`).
- `assets/fonts/*.woff2` — repoint the two `@font-face` rules in `tokens/fonts.css`,
  which currently load Inter and JetBrains Mono from public CDNs.
- `assets/icons/*.svg` — a vendored glyph set; repoint `ICON_BASE` in
  `components/icon/Icon.jsx`, which currently masks Lucide SVGs from unpkg.

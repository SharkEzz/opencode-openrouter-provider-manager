The only icon primitive in the system — wraps a Lucide glyph in a CSS mask so it inherits `currentColor`.

```jsx
<Icon name="git-branch" size={12} />
<Icon name="activity" size={14} color="var(--accent-telemetry-ink)" />
```

Sizes: 12px in dense 28px rows, 14px default, 16px in the 44px palette search. Never mix in a second icon set, never substitute emoji. Glyphs are decorative unless `title` is passed.

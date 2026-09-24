import React from 'react';

/** Hotkey chip. Lowercase mono on a hairline-bordered micro-tag. */
export function Kbd({ children, tone = 'default', style }) {
  const ink = tone === 'accent' ? 'var(--accent-route-ink)' : 'var(--text-muted)';
  return (
    <kbd
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '18px',
        padding: '0 5px',
        borderRadius: 'var(--radius-sm)',
        background: tone === 'accent' ? 'var(--obs-blue-12)' : 'var(--surface-raised)',
        border: '1px solid ' + (tone === 'accent' ? 'var(--obs-blue-20)' : 'var(--hairline)'),
        color: ink,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--label-sm-size)',
        lineHeight: '16px',
        letterSpacing: 'var(--label-sm-ls)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      {children}
    </kbd>
  );
}

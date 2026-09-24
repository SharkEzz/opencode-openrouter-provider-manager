import React from 'react';

const TONES = {
  docked: { background: 'var(--surface-docked)', border: '1px solid var(--hairline)', boxShadow: 'var(--shadow-docked)', backdropFilter: 'none' },
  pane: { background: 'var(--surface-pane)', border: '1px solid var(--hairline)', boxShadow: 'var(--shadow-docked)', backdropFilter: 'none' },
  glass: { background: 'var(--glass-fill)', border: 'var(--glass-border)', boxShadow: 'var(--shadow-float)', backdropFilter: 'var(--glass-blur)' },
  canvas: { background: 'var(--surface-canvas)', border: '1px solid var(--hairline)', boxShadow: 'none', backdropFilter: 'none' }
};

/** Docked or floating container: 1px rim, 0.75rem gutter, optional electric top rim. */
export function Panel({ title, meta, actions, tone = 'docked', rim = false, padded = true, children, style, bodyStyle }) {
  const t = TONES[tone] || TONES.docked;
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        borderRadius: tone === 'glass' ? 'var(--radius-lg)' : 'var(--radius)',
        borderTop: rim ? '1px solid var(--rim-electric)' : t.border,
        overflow: 'hidden',
        ...t,
        ...style
      }}
    >
      {(title || actions) && (
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            height: 'var(--bar-toolbar)',
            flex: '0 0 auto',
            padding: '0 var(--gutter)',
            borderBottom: '1px solid var(--hairline)'
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--label-sm-size)', lineHeight: 'var(--label-sm-lh)', letterSpacing: 'var(--label-sm-ls)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: '0 1 auto' }}>{title}</span>
          {meta && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--body-sm-size)', color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: '0 1 auto' }}>{meta}</span>}
          <span style={{ flex: '1 1 auto' }} />
          {actions && <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>{actions}</span>}
        </header>
      )}
      <div style={{ flex: '1 1 auto', minHeight: 0, padding: padded ? 'var(--gutter)' : 0, overflow: 'auto', ...bodyStyle }}>{children}</div>
    </section>
  );
}

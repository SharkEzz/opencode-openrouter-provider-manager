import React from 'react';
import { CommandRow } from './CommandRow.jsx';

/** Frosted-glass command surface: search header, grouped rows, hotkey footer. */
export function CommandPalette({
  query = '',
  onQueryChange,
  placeholder = 'route to model…',
  groups = [],
  selectedId,
  onSelect,
  footer,
  hotkeys = ['esc', 'ctrl+p'],
  width = 'var(--palette-max)',
  style
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        width: '100%',
        maxWidth: width,
        minWidth: 0,
        background: 'var(--glass-fill)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: 'var(--glass-border)',
        borderTop: 'var(--glass-rim)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-float)',
        overflow: 'hidden',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', height: 'var(--row-input)', padding: '0 var(--space-lg)', borderBottom: '1px solid var(--hairline)' }}>
        <span style={{ color: 'var(--accent-route-ink)', fontFamily: 'var(--font-mono)', fontSize: 'var(--body-lg-size)', flex: '0 0 auto' }}>&gt;</span>
        <input
          value={query}
          onChange={(e) => onQueryChange && onQueryChange(e.target.value)}
          placeholder={placeholder}
          autoFocus
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--body-lg-size)',
            letterSpacing: 'var(--body-lg-ls)',
            fontFeatureSettings: 'var(--mono-features)'
          }}
        />
        <span style={{ display: 'flex', gap: 'var(--space-xs)', flex: '0 0 auto' }}>
          {hotkeys.map((k) => (
            <kbd key={k} style={{ display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 5px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-raised)', border: '1px solid var(--hairline)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--label-sm-size)', lineHeight: '16px', letterSpacing: 'var(--label-sm-ls)', fontWeight: 600 }}>{k}</kbd>
          ))}
        </span>
      </div>

      <div style={{ maxHeight: '360px', overflow: 'auto', padding: 'var(--space-xs) 0' }}>
        {groups.map((g) => (
          <div key={g.label} style={{ paddingBottom: 'var(--space-xs)' }}>
            {g.label && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', height: '22px', padding: '0 var(--gutter)', fontFamily: 'var(--font-mono)', fontSize: 'var(--label-sm-size)', letterSpacing: 'var(--label-sm-ls)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-faint)' }}>
                <span>{g.label}</span>
                {g.meta && <span style={{ color: 'var(--obs-outline-variant)' }}>{g.meta}</span>}
              </div>
            )}
            <div style={{ padding: '0 var(--space-xs)' }}>
              {(g.items || []).map((it) => (
                <CommandRow
                  key={it.id}
                  {...it}
                  selected={it.id === selectedId}
                  onClick={() => onSelect && onSelect(it.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {footer && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', height: 'var(--bar-status)', padding: '0 var(--space-lg)', borderTop: '1px solid var(--hairline)', background: 'var(--obs-white-04)', fontFamily: 'var(--font-mono)', fontSize: 'var(--body-sm-size)', color: 'var(--text-faint)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}

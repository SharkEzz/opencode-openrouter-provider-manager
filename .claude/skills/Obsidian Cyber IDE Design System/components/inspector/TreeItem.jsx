import React, { useState } from 'react';

const DOT = { ok: 'var(--status-ok)', warn: 'var(--status-warn)', fault: 'var(--status-fault)', idle: 'var(--status-idle)' };

/** Tree row with lineage lines, disclosure caret and connection status. */
export function TreeItem({
  label,
  depth = 0,
  expanded,
  onToggle,
  leading,
  meta,
  status,
  selected = false,
  trailing,
  children,
  style
}) {
  const [hover, setHover] = useState(false);
  const hasKids = typeof expanded === 'boolean';
  return (
    <div style={{ minWidth: 0, ...style }}>
      <div
        onClick={onToggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          height: 'var(--row-dense)',
          paddingRight: 'var(--gutter)',
          paddingLeft: 'calc(var(--gutter) + ' + depth * 14 + 'px)',
          background: selected ? 'var(--surface-selected-tint)' : hover ? 'var(--surface-hover)' : 'transparent',
          boxShadow: selected ? 'inset 1px 0 0 var(--accent-telemetry-ink)' : 'none',
          color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--body-sm-size)',
          fontFeatureSettings: 'var(--mono-features)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background var(--dur-fast) var(--ease-out)'
        }}
      >
        {depth > 0 && (
          <span style={{ position: 'absolute', left: 'calc(var(--gutter) + ' + (depth * 14 - 7) + 'px)', top: 0, bottom: 0, width: '1px', background: 'var(--hairline)' }} />
        )}
        <span style={{ width: '10px', display: 'grid', placeItems: 'center', color: 'var(--text-faint)', flex: '0 0 auto', fontSize: '9px' }}>
          {hasKids ? (expanded ? '▾' : '▸') : ''}
        </span>
        {leading && <span style={{ display: 'grid', placeItems: 'center', color: selected ? 'var(--accent-telemetry-ink)' : 'var(--text-muted)', flex: '0 0 auto' }}>{leading}</span>}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{label}</span>
        {status && <span style={{ width: '5px', height: '5px', borderRadius: 'var(--radius-full)', background: DOT[status] || DOT.idle, boxShadow: status === 'ok' ? '0 0 6px var(--status-ok)' : 'none', flex: '0 0 auto' }} />}
        <span style={{ flex: '1 1 auto' }} />
        {meta && <span style={{ color: 'var(--text-faint)', whiteSpace: 'nowrap', flex: '0 0 auto' }}>{meta}</span>}
        {trailing}
      </div>
      {expanded && children}
    </div>
  );
}

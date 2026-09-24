import React from 'react';

const fmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(n));

/** Slim 3px context-budget track: blue consumed, magenta cached. */
export function TokenBudgetBar({ used = 0, cached = 0, total = 1, label, showValues = true, height, style }) {
  const cap = Math.max(total, 1);
  const pctUsed = Math.min(100, (used / cap) * 100);
  const pctCached = Math.min(100 - pctUsed, (cached / cap) * 100);
  const over = used / cap >= 0.9;
  return (
    <div style={{ display: 'grid', gap: '6px', minWidth: 0, ...style }}>
      {(label || showValues) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: 'var(--label-sm-size)', letterSpacing: 'var(--label-sm-ls)', fontWeight: 600, textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{label}</span>
          <span style={{ flex: '1 1 auto' }} />
          {showValues && (
            <span style={{ display: 'flex', gap: 'var(--space-sm)', textTransform: 'none', flex: '0 0 auto', whiteSpace: 'nowrap' }}>
              <span style={{ color: over ? 'var(--status-warn)' : 'var(--accent-route-ink)', whiteSpace: 'nowrap' }}>{fmt(used)}</span>
              {cached > 0 && <span style={{ color: 'var(--accent-meta-ink)', whiteSpace: 'nowrap' }}>+{fmt(cached)} cached</span>}
              <span style={{ color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>/ {fmt(total)}</span>
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pctUsed)}
        style={{
          display: 'flex',
          height: (height || 3) + 'px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--obs-white-08)',
          overflow: 'hidden'
        }}
      >
        <span style={{ width: pctUsed + '%', background: over ? 'var(--status-warn)' : 'var(--accent-route)', transition: 'width var(--dur-slow) var(--ease-out)' }} />
        <span style={{ width: pctCached + '%', background: 'var(--accent-meta)', transition: 'width var(--dur-slow) var(--ease-out)' }} />
      </div>
    </div>
  );
}

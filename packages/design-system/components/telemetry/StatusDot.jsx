import React from 'react';

const TONES = {
  ok: 'var(--status-ok)',
  warn: 'var(--status-warn)',
  fault: 'var(--status-fault)',
  idle: 'var(--status-idle)',
  live: 'var(--accent-telemetry-ink)',
  route: 'var(--accent-route-ink)'
};

/** Connection / health indicator, optionally pinging. */
export function StatusDot({ tone = 'ok', size = 6, ping = false, label, style }) {
  const color = TONES[tone] || TONES.ok;
  const dot = (
    <span style={{ position: 'relative', display: 'inline-grid', placeItems: 'center', flex: '0 0 auto', width: size + 'px', height: size + 'px' }}>
      <span style={{ width: size + 'px', height: size + 'px', borderRadius: 'var(--radius-full)', background: color, boxShadow: ping ? '0 0 8px ' + color : 'none' }} />
      {ping && (
        <span
          style={{
            position: 'absolute',
            width: size * 2 + 'px',
            height: size * 2 + 'px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid ' + color,
            opacity: 0.35
          }}
        />
      )}
    </span>
  );
  if (!label) return dot;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)', ...style }}>
      {dot}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--body-sm-size)', color: 'var(--text-muted)' }}>{label}</span>
    </span>
  );
}

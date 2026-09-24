import React from 'react';

const INK = {
  default: 'var(--text-primary)',
  route: 'var(--accent-route-ink)',
  telemetry: 'var(--accent-telemetry-ink)',
  meta: 'var(--accent-meta-ink)',
  warn: 'var(--status-warn)',
  fault: 'var(--status-fault)',
  ok: 'var(--status-ok)'
};

/** Label-over-value telemetry readout with tabular figures. */
export function MetricPair({ label, value, unit, tone = 'default', align = 'left', style }) {
  return (
    <div style={{ display: 'grid', gap: '1px', textAlign: align, minWidth: 0, ...style }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--label-sm-size)', lineHeight: 'var(--label-sm-lh)', letterSpacing: 'var(--label-sm-ls)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-faint)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--body-md-size)', lineHeight: 'var(--body-md-lh)', fontFeatureSettings: 'var(--mono-features)', color: INK[tone] || INK.default, whiteSpace: 'nowrap' }}>
        {value}
        {unit && <span style={{ color: 'var(--text-faint)', marginLeft: '2px' }}>{unit}</span>}
      </span>
    </div>
  );
}

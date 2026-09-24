import React from 'react';

const TONES = {
  info:  { ink: 'var(--accent-route-ink)',     rim: 'var(--obs-blue-30)',      glow: 'var(--glow-blue)' },
  live:  { ink: 'var(--accent-telemetry-ink)', rim: 'var(--obs-cyan-20)',      glow: 'var(--glow-cyan)' },
  cache: { ink: 'var(--accent-meta-ink)',      rim: 'var(--obs-magenta-20)',   glow: 'var(--glow-magenta)' },
  warn:  { ink: 'var(--status-warn)',          rim: 'var(--status-warn-bg)',   glow: 'none' },
  fault: { ink: 'var(--status-fault)',         rim: 'var(--status-fault-bg)',  glow: 'none' },
  ok:    { ink: 'var(--status-ok)',            rim: 'var(--status-ok-bg)',     glow: 'none' }
};

/** Level-3 diagnostic toast: glass fill, coloured rim, mono body, optional action. */
export function Toast({ title, detail, tone = 'info', leading, action, onDismiss, timestamp, style }) {
  const t = TONES[tone] || TONES.info;
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-md)',
        width: '100%',
        maxWidth: '380px',
        padding: 'var(--space-md)',
        background: 'var(--glass-fill)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--hairline)',
        borderLeft: '2px solid ' + t.ink,
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-toast)',
        fontFamily: 'var(--font-mono)',
        ...style
      }}
    >
      {leading && <span style={{ color: t.ink, display: 'grid', placeItems: 'center', height: '18px', flex: '0 0 auto' }}>{leading}</span>}
      <div style={{ display: 'grid', gap: '2px', flex: '1 1 auto', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
          <span style={{ fontSize: 'var(--label-md-size)', lineHeight: '18px', letterSpacing: 'var(--label-md-ls)', fontWeight: 500, color: t.ink }}>{title}</span>
          <span style={{ flex: '1 1 auto' }} />
          {timestamp && <span style={{ fontSize: 'var(--label-sm-size)', color: 'var(--text-faint)', fontFeatureSettings: 'var(--mono-features)' }}>{timestamp}</span>}
        </div>
        {detail && <span style={{ fontSize: 'var(--body-sm-size)', lineHeight: 'var(--body-sm-lh)', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{detail}</span>}
        {action && <span style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: '6px' }}>{action}</span>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', padding: 0, width: '16px', height: '18px', color: 'var(--text-faint)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 'var(--body-md-size)', flex: '0 0 auto' }}
        >
          ×
        </button>
      )}
    </div>
  );
}

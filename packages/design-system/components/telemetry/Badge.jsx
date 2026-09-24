import React from 'react';

const TONES = {
  route:     { fg: 'var(--obs-primary)',   bg: 'var(--obs-blue-20)',     bd: 'var(--obs-blue-30)' },
  telemetry: { fg: 'var(--obs-secondary)', bg: 'var(--obs-cyan-20)',     bd: 'var(--obs-cyan-20)' },
  meta:      { fg: 'var(--obs-tertiary)',  bg: 'var(--obs-magenta-20)',  bd: 'var(--obs-magenta-20)' },
  ok:        { fg: 'var(--status-ok)',     bg: 'var(--status-ok-bg)',    bd: 'var(--status-ok-bg)' },
  warn:      { fg: 'var(--status-warn)',   bg: 'var(--status-warn-bg)',  bd: 'var(--status-warn-bg)' },
  fault:     { fg: 'var(--status-fault)',  bg: 'var(--status-fault-bg)', bd: 'var(--status-fault-bg)' },
  neutral:   { fg: 'var(--text-muted)',    bg: 'var(--surface-raised)',  bd: 'var(--hairline)' },
  solid:     { fg: 'var(--text-on-accent)', bg: 'var(--accent-route)',   bd: 'var(--accent-route)' }
};

/** Micro-pill for provider, routing and telemetry metadata. */
export function Badge({ children, tone = 'neutral', shape = 'tag', dot = false, leading, style }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        height: '18px',
        padding: shape === 'pill' ? '0 8px' : '0 6px',
        borderRadius: shape === 'pill' ? 'var(--radius-full)' : 'var(--radius)',
        background: t.bg,
        border: '1px solid ' + t.bd,
        color: t.fg,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--label-sm-size)',
        lineHeight: '16px',
        letterSpacing: 'var(--label-sm-ls)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      {dot && <span style={{ width: '5px', height: '5px', borderRadius: 'var(--radius-full)', background: 'currentColor', flex: '0 0 auto' }} />}
      {leading}
      {children}
    </span>
  );
}

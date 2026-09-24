import React, { useState } from 'react';

const DOT = { ok: 'var(--status-ok)', warn: 'var(--status-warn)', fault: 'var(--status-fault)', idle: 'var(--status-idle)' };

/** Split-column palette row: provider + name, cost metrics, context, health, alias. */
export function CommandRow({
  name,
  provider,
  leading,
  cost,
  context,
  health,
  alias,
  badges,
  selected = false,
  dense = false,
  onClick,
  onMouseEnter,
  style
}) {
  const [hover, setHover] = useState(false);
  const bg = selected ? 'var(--surface-selected)' : hover ? 'var(--surface-hover)' : 'transparent';
  const ink = selected ? 'var(--text-on-accent)' : 'var(--text-primary)';
  const sub = selected ? 'rgba(255,255,255,.72)' : 'var(--text-faint)';
  const metric = selected ? 'rgba(255,255,255,.88)' : 'var(--text-muted)';

  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={onClick}
      onMouseEnter={(e) => { setHover(true); onMouseEnter && onMouseEnter(e); }}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        height: dense ? 'var(--row-dense)' : 'var(--row-item)',
        padding: '0 var(--gutter)',
        background: bg,
        borderRadius: 'var(--radius-sm)',
        boxShadow: selected ? 'inset 0 0 0 1px var(--obs-cyan-20), var(--glow-cyan)' : 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--body-md-size)',
        fontFeatureSettings: 'var(--mono-features)',
        transition: 'background var(--dur-fast) var(--ease-out)',
        ...style
      }}
    >
      {leading && <span style={{ display: 'grid', placeItems: 'center', color: selected ? 'var(--text-on-accent)' : 'var(--text-muted)', flex: '0 0 auto' }}>{leading}</span>}

      <span style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)', minWidth: 0, flex: '1 1 auto' }}>
        <span style={{ color: ink, fontWeight: selected ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        {provider && <span style={{ color: sub, fontSize: 'var(--body-sm-size)', whiteSpace: 'nowrap' }}>{provider}</span>}
        {badges}
      </span>

      {cost && <span style={{ color: metric, fontSize: 'var(--body-sm-size)', whiteSpace: 'nowrap', flex: '0 0 auto' }}>{cost}</span>}
      {context && <span style={{ color: sub, fontSize: 'var(--body-sm-size)', whiteSpace: 'nowrap', flex: '0 0 auto', minWidth: '58px', textAlign: 'right' }}>{context}</span>}

      {health && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flex: '0 0 auto', minWidth: '62px', justifyContent: 'flex-end' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: 'var(--radius-full)', background: DOT[health.tone] || DOT.ok, flex: '0 0 auto' }} />
          <span style={{ color: metric, fontSize: 'var(--body-sm-size)' }}>{health.label}</span>
        </span>
      )}

      {alias && (
        <span style={{ color: selected ? 'var(--text-on-accent)' : 'var(--accent-route-ink)', fontSize: 'var(--label-sm-size)', letterSpacing: 'var(--label-sm-ls)', fontWeight: 600, flex: '0 0 auto', textAlign: 'right', minWidth: '52px' }}>{alias}</span>
      )}

      {selected && <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: 'var(--obs-secondary)', boxShadow: '0 0 8px var(--obs-secondary)', flex: '0 0 auto' }} />}
    </div>
  );
}

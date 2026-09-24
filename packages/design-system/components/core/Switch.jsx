import React from 'react';

/** Compact 14px-track toggle with a glowing thumb. */
export function Switch({ checked = false, onChange, disabled = false, label, hint, id, style }) {
  const track = (
    <span
      style={{
        position: 'relative',
        flex: '0 0 auto',
        width: '26px',
        height: 'var(--track-switch)',
        borderRadius: 'var(--radius-full)',
        background: checked ? 'var(--accent-route)' : 'var(--surface-raised)',
        border: '1px solid ' + (checked ? 'var(--accent-route)' : 'var(--border-strong)'),
        boxShadow: checked ? 'var(--glow-blue)' : 'none',
        transition: 'background var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out)'
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '1px',
          left: checked ? '13px' : '1px',
          width: '10px',
          height: '10px',
          borderRadius: 'var(--radius-full)',
          background: checked ? '#fff' : 'var(--text-muted)',
          transition: 'left var(--dur) var(--ease-out), background var(--dur) var(--ease-out)'
        }}
      />
    </span>
  );

  return (
    <label
      htmlFor={id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        ...style
      }}
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.checked)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />
      {track}
      {(label || hint) && (
        <span style={{ display: 'grid', gap: '1px', minWidth: 0 }}>
          {label && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--label-md-size)', lineHeight: 'var(--label-md-lh)', letterSpacing: 'var(--label-md-ls)', color: 'var(--text-primary)' }}>{label}</span>
          )}
          {hint && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--body-sm-size)', lineHeight: 'var(--body-sm-lh)', color: 'var(--text-faint)' }}>{hint}</span>
          )}
        </span>
      )}
    </label>
  );
}

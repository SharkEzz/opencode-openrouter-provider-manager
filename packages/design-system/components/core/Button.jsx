import React, { useState } from 'react';

const SIZES = {
  sm: { height: '24px', padding: '0 8px', font: 'var(--label-sm-size)', ls: 'var(--label-sm-ls)', weight: 600 },
  md: { height: '28px', padding: '0 12px', font: 'var(--label-md-size)', ls: 'var(--label-md-ls)', weight: 500 },
  lg: { height: '36px', padding: '0 16px', font: 'var(--body-md-size)', ls: 'var(--body-md-ls)', weight: 500 }
};

/** Primary action trigger. Electric blue fill, 4px radius, mono label. */
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  leading,
  trailing,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  style
}) {
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const s = SIZES[size] || SIZES.md;

  const skin = {
    primary: {
      background: hover ? 'color-mix(in srgb, var(--accent-route) 88%, white)' : 'var(--accent-route)',
      color: 'var(--text-on-accent)',
      border: '1px solid transparent',
      boxShadow: hover ? 'var(--glow-blue)' : 'none'
    },
    secondary: {
      background: hover ? 'var(--surface-raised)' : 'var(--surface-pane)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-strong)',
      boxShadow: 'none'
    },
    ghost: {
      background: hover ? 'var(--surface-hover)' : 'transparent',
      color: hover ? 'var(--accent-telemetry-ink)' : 'var(--text-secondary)',
      border: '1px solid transparent',
      boxShadow: 'none'
    },
    telemetry: {
      background: hover ? 'var(--obs-cyan-20)' : 'var(--obs-cyan-12)',
      color: 'var(--accent-telemetry-ink)',
      border: '1px solid var(--obs-cyan-20)',
      boxShadow: hover ? 'var(--glow-cyan)' : 'none'
    },
    danger: {
      background: hover ? 'var(--obs-error-container)' : 'transparent',
      color: hover ? 'var(--obs-on-error-container)' : 'var(--obs-error)',
      border: '1px solid var(--obs-error-container)',
      boxShadow: 'none'
    }
  }[variant] || {};

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setDown(false); }}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      style={{
        display: fullWidth ? 'flex' : 'inline-flex',
        width: fullWidth ? '100%' : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-sm)',
        height: s.height,
        padding: s.padding,
        borderRadius: 'var(--radius)',
        fontFamily: 'var(--font-mono)',
        fontSize: s.font,
        fontWeight: s.weight,
        letterSpacing: s.ls,
        fontFeatureSettings: 'var(--mono-features)',
        whiteSpace: 'nowrap',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        transform: down && !disabled ? 'translateY(0.5px)' : 'none',
        transition: 'background var(--dur) var(--ease-out), color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out)',
        ...skin,
        ...style
      }}
    >
      {leading}
      {children}
      {trailing}
    </button>
  );
}

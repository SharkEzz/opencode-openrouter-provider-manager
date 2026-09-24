import React, { useState } from 'react';

const SIZES = { sm: 20, md: 24, lg: 28 };

/** Square transparent glyph trigger for toolbars and panel headers. */
export function IconButton({ children, size = 'md', active = false, disabled = false, label, onClick, style }) {
  const [hover, setHover] = useState(false);
  const px = SIZES[size] || SIZES.md;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: px + 'px',
        height: px + 'px',
        display: 'inline-grid',
        placeItems: 'center',
        padding: 0,
        borderRadius: 'var(--radius)',
        border: '1px solid ' + (active ? 'var(--obs-cyan-20)' : 'transparent'),
        background: active ? 'var(--obs-cyan-12)' : hover ? 'var(--surface-hover)' : 'transparent',
        color: active ? 'var(--accent-telemetry-ink)' : hover ? 'var(--accent-telemetry-ink)' : 'var(--text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        transition: 'background var(--dur) var(--ease-out), color var(--dur) var(--ease-out)',
        ...style
      }}
    >
      {children}
    </button>
  );
}

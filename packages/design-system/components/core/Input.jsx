import React, { useState } from 'react';

const SIZES = { sm: '28px', md: '36px', lg: '44px' };

/** Search / filter input with optional leading glyph and trailing hotkey slot. */
export function Input({
  value,
  onChange,
  placeholder,
  size = 'md',
  leading,
  trailing,
  mono = true,
  invalid = false,
  disabled = false,
  bare = false,
  autoFocus = false,
  onKeyDown,
  style
}) {
  const [focus, setFocus] = useState(false);
  const border = invalid ? 'var(--status-fault)' : focus ? 'var(--border-focus)' : 'var(--border-input)';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        height: SIZES[size] || SIZES.md,
        padding: '0 var(--space-md)',
        background: bare ? 'transparent' : 'var(--surface-input)',
        border: bare ? '1px solid transparent' : '1px solid ' + border,
        borderBottom: bare ? '1px solid var(--hairline)' : '1px solid ' + border,
        borderRadius: bare ? 0 : 'var(--radius)',
        boxShadow: focus && !bare ? 'var(--glow-blue)' : 'none',
        opacity: disabled ? 0.38 : 1,
        transition: 'border-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out)',
        ...style
      }}
    >
      {leading && <span style={{ display: 'grid', placeItems: 'center', color: 'var(--text-muted)', flex: '0 0 auto' }}>{leading}</span>}
      <input
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: '1 1 auto',
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
          fontSize: size === 'lg' ? 'var(--body-lg-size)' : 'var(--body-md-size)',
          letterSpacing: 'var(--body-md-ls)',
          fontFeatureSettings: 'var(--mono-features)'
        }}
      />
      {trailing && <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flex: '0 0 auto' }}>{trailing}</span>}
    </div>
  );
}

/* @ds-bundle: {"format":4,"namespace":"ObsidianCyberIDEDesignSystem_fe171d","components":[{"name":"CommandPalette","sourcePath":"components/command/CommandPalette.jsx"},{"name":"CommandRow","sourcePath":"components/command/CommandRow.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"Kbd","sourcePath":"components/core/Kbd.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"Switch","sourcePath":"components/core/Switch.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"ICON_BASE","sourcePath":"components/icon/Icon.jsx"},{"name":"Icon","sourcePath":"components/icon/Icon.jsx"},{"name":"TreeItem","sourcePath":"components/inspector/TreeItem.jsx"},{"name":"Badge","sourcePath":"components/telemetry/Badge.jsx"},{"name":"MetricPair","sourcePath":"components/telemetry/MetricPair.jsx"},{"name":"StatusDot","sourcePath":"components/telemetry/StatusDot.jsx"},{"name":"TokenBudgetBar","sourcePath":"components/telemetry/TokenBudgetBar.jsx"}],"sourceHashes":{"components/command/CommandPalette.jsx":"5f0f36f31c3f","components/command/CommandRow.jsx":"1c5b67a55f56","components/core/Button.jsx":"c3206d928397","components/core/IconButton.jsx":"bcadbb640135","components/core/Input.jsx":"0ce1a7e9b9b1","components/core/Kbd.jsx":"8ad495c22cb5","components/core/Panel.jsx":"29a5d9668e29","components/core/Switch.jsx":"2f2eb22878cb","components/feedback/Toast.jsx":"6f051415454b","components/icon/Icon.jsx":"8f5fb8254ce1","components/inspector/TreeItem.jsx":"8a015fe5a97a","components/telemetry/Badge.jsx":"7b1500235357","components/telemetry/MetricPair.jsx":"71d852f952b5","components/telemetry/StatusDot.jsx":"94962f75af19","components/telemetry/TokenBudgetBar.jsx":"9275f59076ae","ui_kits/obsidian-ide/Chrome.jsx":"1b41b91a13ea","ui_kits/obsidian-ide/EditorWorkspace.jsx":"840fe9005c19","ui_kits/obsidian-ide/McpRegistry.jsx":"cd8c9e7044ce","ui_kits/obsidian-ide/ProviderSettings.jsx":"48b9da7a9195","ui_kits/obsidian-ide/RoutePalette.jsx":"d7e60b16c27a","ui_kits/obsidian-ide/TraceLog.jsx":"3a3f129609cb"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ObsidianCyberIDEDesignSystem_fe171d = window.ObsidianCyberIDEDesignSystem_fe171d || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/command/CommandRow.jsx
try { (() => {
const {
  useState
} = React;
const DOT = {
  ok: 'var(--status-ok)',
  warn: 'var(--status-warn)',
  fault: 'var(--status-fault)',
  idle: 'var(--status-idle)'
};

/** Split-column palette row: provider + name, cost metrics, context, health, alias. */
function CommandRow({
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
  return /*#__PURE__*/React.createElement("div", {
    role: "option",
    "aria-selected": selected,
    onClick: onClick,
    onMouseEnter: e => {
      setHover(true);
      onMouseEnter && onMouseEnter(e);
    },
    onMouseLeave: () => setHover(false),
    style: {
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
    }
  }, leading && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      color: selected ? 'var(--text-on-accent)' : 'var(--text-muted)',
      flex: '0 0 auto'
    }
  }, leading), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--space-sm)',
      minWidth: 0,
      flex: '1 1 auto'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: ink,
      fontWeight: selected ? 600 : 400,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, name), provider && /*#__PURE__*/React.createElement("span", {
    style: {
      color: sub,
      fontSize: 'var(--body-sm-size)',
      whiteSpace: 'nowrap'
    }
  }, provider), badges), cost && /*#__PURE__*/React.createElement("span", {
    style: {
      color: metric,
      fontSize: 'var(--body-sm-size)',
      whiteSpace: 'nowrap',
      flex: '0 0 auto'
    }
  }, cost), context && /*#__PURE__*/React.createElement("span", {
    style: {
      color: sub,
      fontSize: 'var(--body-sm-size)',
      whiteSpace: 'nowrap',
      flex: '0 0 auto',
      minWidth: '58px',
      textAlign: 'right'
    }
  }, context), health && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      flex: '0 0 auto',
      minWidth: '62px',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '5px',
      height: '5px',
      borderRadius: 'var(--radius-full)',
      background: DOT[health.tone] || DOT.ok,
      flex: '0 0 auto'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: metric,
      fontSize: 'var(--body-sm-size)'
    }
  }, health.label)), alias && /*#__PURE__*/React.createElement("span", {
    style: {
      color: selected ? 'var(--text-on-accent)' : 'var(--accent-route-ink)',
      fontSize: 'var(--label-sm-size)',
      letterSpacing: 'var(--label-sm-ls)',
      fontWeight: 600,
      flex: '0 0 auto',
      textAlign: 'right',
      minWidth: '52px'
    }
  }, alias), selected && /*#__PURE__*/React.createElement("span", {
    style: {
      width: '6px',
      height: '6px',
      borderRadius: 'var(--radius-full)',
      background: 'var(--obs-secondary)',
      boxShadow: '0 0 8px var(--obs-secondary)',
      flex: '0 0 auto'
    }
  }));
}
Object.assign(__ds_scope, { CommandRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/command/CommandRow.jsx", error: String((e && e.message) || e) }); }

// components/command/CommandPalette.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Frosted-glass command surface: search header, grouped rows, hotkey footer. */
function CommandPalette({
  query = '',
  onQueryChange,
  placeholder = 'route to model…',
  groups = [],
  selectedId,
  onSelect,
  footer,
  hotkeys = ['esc', 'ctrl+p'],
  width = 'var(--palette-max)',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    style: {
      width: '100%',
      maxWidth: width,
      minWidth: 0,
      background: 'var(--glass-fill)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      border: 'var(--glass-border)',
      borderTop: 'var(--glass-rim)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-float)',
      overflow: 'hidden',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      height: 'var(--row-input)',
      padding: '0 var(--space-lg)',
      borderBottom: '1px solid var(--hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent-route-ink)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-lg-size)',
      flex: '0 0 auto'
    }
  }, ">"), /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => onQueryChange && onQueryChange(e.target.value),
    placeholder: placeholder,
    autoFocus: true,
    style: {
      flex: '1 1 auto',
      minWidth: 0,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-lg-size)',
      letterSpacing: 'var(--body-lg-ls)',
      fontFeatureSettings: 'var(--mono-features)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 'var(--space-xs)',
      flex: '0 0 auto'
    }
  }, hotkeys.map(k => /*#__PURE__*/React.createElement("kbd", {
    key: k,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: '18px',
      padding: '0 5px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface-raised)',
      border: '1px solid var(--hairline)',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm-size)',
      lineHeight: '16px',
      letterSpacing: 'var(--label-sm-ls)',
      fontWeight: 600
    }
  }, k)))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: '360px',
      overflow: 'auto',
      padding: 'var(--space-xs) 0'
    }
  }, groups.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.label,
    style: {
      paddingBottom: 'var(--space-xs)'
    }
  }, g.label && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      height: '22px',
      padding: '0 var(--gutter)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm-size)',
      letterSpacing: 'var(--label-sm-ls)',
      fontWeight: 600,
      textTransform: 'uppercase',
      color: 'var(--text-faint)'
    }
  }, /*#__PURE__*/React.createElement("span", null, g.label), g.meta && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--obs-outline-variant)'
    }
  }, g.meta)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--space-xs)'
    }
  }, (g.items || []).map(it => /*#__PURE__*/React.createElement(__ds_scope.CommandRow, _extends({
    key: it.id
  }, it, {
    selected: it.id === selectedId,
    onClick: () => onSelect && onSelect(it.id)
  }))))))), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      height: 'var(--bar-status)',
      padding: '0 var(--space-lg)',
      borderTop: '1px solid var(--hairline)',
      background: 'var(--obs-white-04)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-sm-size)',
      color: 'var(--text-faint)'
    }
  }, footer));
}
Object.assign(__ds_scope, { CommandPalette });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/command/CommandPalette.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const {
  useState
} = React;
const SIZES = {
  sm: {
    height: '24px',
    padding: '0 8px',
    font: 'var(--label-sm-size)',
    ls: 'var(--label-sm-ls)',
    weight: 600
  },
  md: {
    height: '28px',
    padding: '0 12px',
    font: 'var(--label-md-size)',
    ls: 'var(--label-md-ls)',
    weight: 500
  },
  lg: {
    height: '36px',
    padding: '0 16px',
    font: 'var(--body-md-size)',
    ls: 'var(--body-md-ls)',
    weight: 500
  }
};

/** Primary action trigger. Electric blue fill, 4px radius, mono label. */
function Button({
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
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setDown(false);
    },
    onMouseDown: () => setDown(true),
    onMouseUp: () => setDown(false),
    style: {
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
    }
  }, leading, children, trailing);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
const {
  useState
} = React;
const SIZES = {
  sm: 20,
  md: 24,
  lg: 28
};

/** Square transparent glyph trigger for toolbars and panel headers. */
function IconButton({
  children,
  size = 'md',
  active = false,
  disabled = false,
  label,
  onClick,
  style
}) {
  const [hover, setHover] = useState(false);
  const px = SIZES[size] || SIZES.md;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
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
    }
  }, children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
const {
  useState
} = React;
const SIZES = {
  sm: '28px',
  md: '36px',
  lg: '44px'
};

/** Search / filter input with optional leading glyph and trailing hotkey slot. */
function Input({
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
  return /*#__PURE__*/React.createElement("div", {
    style: {
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
    }
  }, leading && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      color: 'var(--text-muted)',
      flex: '0 0 auto'
    }
  }, leading), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: onChange,
    onKeyDown: onKeyDown,
    placeholder: placeholder,
    disabled: disabled,
    autoFocus: autoFocus,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
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
    }
  }), trailing && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      flex: '0 0 auto'
    }
  }, trailing));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/Kbd.jsx
try { (() => {
/** Hotkey chip. Lowercase mono on a hairline-bordered micro-tag. */
function Kbd({
  children,
  tone = 'default',
  style
}) {
  const ink = tone === 'accent' ? 'var(--accent-route-ink)' : 'var(--text-muted)';
  return /*#__PURE__*/React.createElement("kbd", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: '18px',
      padding: '0 5px',
      borderRadius: 'var(--radius-sm)',
      background: tone === 'accent' ? 'var(--obs-blue-12)' : 'var(--surface-raised)',
      border: '1px solid ' + (tone === 'accent' ? 'var(--obs-blue-20)' : 'var(--hairline)'),
      color: ink,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm-size)',
      lineHeight: '16px',
      letterSpacing: 'var(--label-sm-ls)',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Kbd });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Kbd.jsx", error: String((e && e.message) || e) }); }

// components/core/Panel.jsx
try { (() => {
const TONES = {
  docked: {
    background: 'var(--surface-docked)',
    border: '1px solid var(--hairline)',
    boxShadow: 'var(--shadow-docked)',
    backdropFilter: 'none'
  },
  pane: {
    background: 'var(--surface-pane)',
    border: '1px solid var(--hairline)',
    boxShadow: 'var(--shadow-docked)',
    backdropFilter: 'none'
  },
  glass: {
    background: 'var(--glass-fill)',
    border: 'var(--glass-border)',
    boxShadow: 'var(--shadow-float)',
    backdropFilter: 'var(--glass-blur)'
  },
  canvas: {
    background: 'var(--surface-canvas)',
    border: '1px solid var(--hairline)',
    boxShadow: 'none',
    backdropFilter: 'none'
  }
};

/** Docked or floating container: 1px rim, 0.75rem gutter, optional electric top rim. */
function Panel({
  title,
  meta,
  actions,
  tone = 'docked',
  rim = false,
  padded = true,
  children,
  style,
  bodyStyle
}) {
  const t = TONES[tone] || TONES.docked;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      borderRadius: tone === 'glass' ? 'var(--radius-lg)' : 'var(--radius)',
      borderTop: rim ? '1px solid var(--rim-electric)' : t.border,
      overflow: 'hidden',
      ...t,
      ...style
    }
  }, (title || actions) && /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      height: 'var(--bar-toolbar)',
      flex: '0 0 auto',
      padding: '0 var(--gutter)',
      borderBottom: '1px solid var(--hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm-size)',
      lineHeight: 'var(--label-sm-lh)',
      letterSpacing: 'var(--label-sm-ls)',
      fontWeight: 600,
      textTransform: 'uppercase',
      color: 'var(--text-secondary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      flex: '0 1 auto'
    }
  }, title), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-sm-size)',
      color: 'var(--text-faint)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      flex: '0 1 auto'
    }
  }, meta), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), actions && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)'
    }
  }, actions)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 auto',
      minHeight: 0,
      padding: padded ? 'var(--gutter)' : 0,
      overflow: 'auto',
      ...bodyStyle
    }
  }, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Panel.jsx", error: String((e && e.message) || e) }); }

// components/core/Switch.jsx
try { (() => {
/** Compact 14px-track toggle with a glowing thumb. */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  hint,
  id,
  style
}) {
  const track = /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      flex: '0 0 auto',
      width: '26px',
      height: 'var(--track-switch)',
      borderRadius: 'var(--radius-full)',
      background: checked ? 'var(--accent-route)' : 'var(--surface-raised)',
      border: '1px solid ' + (checked ? 'var(--accent-route)' : 'var(--border-strong)'),
      boxShadow: checked ? 'var(--glow-blue)' : 'none',
      transition: 'background var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: '1px',
      left: checked ? '13px' : '1px',
      width: '10px',
      height: '10px',
      borderRadius: 'var(--radius-full)',
      background: checked ? '#fff' : 'var(--text-muted)',
      transition: 'left var(--dur) var(--ease-out), background var(--dur) var(--ease-out)'
    }
  }));
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.38 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    id: id,
    type: "checkbox",
    role: "switch",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), track, (label || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      gap: '1px',
      minWidth: 0
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-md-size)',
      lineHeight: 'var(--label-md-lh)',
      letterSpacing: 'var(--label-md-ls)',
      color: 'var(--text-primary)'
    }
  }, label), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-sm-size)',
      lineHeight: 'var(--body-sm-lh)',
      color: 'var(--text-faint)'
    }
  }, hint)));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Switch.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const TONES = {
  info: {
    ink: 'var(--accent-route-ink)',
    rim: 'var(--obs-blue-30)',
    glow: 'var(--glow-blue)'
  },
  live: {
    ink: 'var(--accent-telemetry-ink)',
    rim: 'var(--obs-cyan-20)',
    glow: 'var(--glow-cyan)'
  },
  cache: {
    ink: 'var(--accent-meta-ink)',
    rim: 'var(--obs-magenta-20)',
    glow: 'var(--glow-magenta)'
  },
  warn: {
    ink: 'var(--status-warn)',
    rim: 'var(--status-warn-bg)',
    glow: 'none'
  },
  fault: {
    ink: 'var(--status-fault)',
    rim: 'var(--status-fault-bg)',
    glow: 'none'
  },
  ok: {
    ink: 'var(--status-ok)',
    rim: 'var(--status-ok-bg)',
    glow: 'none'
  }
};

/** Level-3 diagnostic toast: glass fill, coloured rim, mono body, optional action. */
function Toast({
  title,
  detail,
  tone = 'info',
  leading,
  action,
  onDismiss,
  timestamp,
  style
}) {
  const t = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
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
    }
  }, leading && /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.ink,
      display: 'grid',
      placeItems: 'center',
      height: '18px',
      flex: '0 0 auto'
    }
  }, leading), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '2px',
      flex: '1 1 auto',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--space-sm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--label-md-size)',
      lineHeight: '18px',
      letterSpacing: 'var(--label-md-ls)',
      fontWeight: 500,
      color: t.ink
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), timestamp && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--label-sm-size)',
      color: 'var(--text-faint)',
      fontFeatureSettings: 'var(--mono-features)'
    }
  }, timestamp)), detail && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body-sm-size)',
      lineHeight: 'var(--body-sm-lh)',
      color: 'var(--text-muted)',
      overflowWrap: 'anywhere'
    }
  }, detail), action && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)',
      marginTop: '6px'
    }
  }, action)), onDismiss && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Dismiss",
    onClick: onDismiss,
    style: {
      background: 'none',
      border: 'none',
      padding: 0,
      width: '16px',
      height: '18px',
      color: 'var(--text-faint)',
      cursor: 'pointer',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-md-size)',
      flex: '0 0 auto'
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/icon/Icon.jsx
try { (() => {
const ICON_BASE = 'https://unpkg.com/lucide-static@latest/icons/';
const cache = new Map();
function normalise(svg) {
  return svg.replace(/\s(width|height)="[^"]*"/g, '').replace('<svg', '<svg width="100%" height="100%" focusable="false"');
}

/** Lucide glyph, inlined so it inherits `currentColor` and stays crisp at any size. */
function Icon({
  name,
  size = 14,
  color = 'currentColor',
  title,
  style
}) {
  const url = ICON_BASE + name + '.svg';
  const [svg, setSvg] = React.useState(() => cache.has(name) ? cache.get(name) : null);
  React.useEffect(() => {
    if (cache.has(name)) {
      setSvg(cache.get(name));
      return undefined;
    }
    let live = true;
    fetch(url).then(r => r.ok ? r.text() : Promise.reject(new Error(String(r.status)))).then(t => {
      const s = normalise(t);
      cache.set(name, s);
      if (live) setSvg(s);
    }).catch(() => {
      cache.set(name, '');
      if (live) setSvg('');
    });
    return () => {
      live = false;
    };
  }, [name, url]);
  const box = {
    display: 'inline-grid',
    placeItems: 'center',
    flex: '0 0 auto',
    width: size + 'px',
    height: size + 'px',
    color,
    ...style
  };

  // fetch blocked or glyph missing -> fall back to a CSS mask of the same file
  if (svg === '') {
    return /*#__PURE__*/React.createElement("span", {
      role: title ? 'img' : undefined,
      "aria-label": title,
      "aria-hidden": title ? undefined : true,
      style: {
        ...box,
        background: 'currentColor',
        WebkitMaskImage: 'url(' + url + ')',
        maskImage: 'url(' + url + ')',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain'
      }
    });
  }
  return /*#__PURE__*/React.createElement("span", {
    role: title ? 'img' : undefined,
    "aria-label": title,
    "aria-hidden": title ? undefined : true,
    style: box,
    dangerouslySetInnerHTML: svg ? {
      __html: svg
    } : undefined
  });
}
Object.assign(__ds_scope, { ICON_BASE, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icon/Icon.jsx", error: String((e && e.message) || e) }); }

// components/inspector/TreeItem.jsx
try { (() => {
const {
  useState
} = React;
const DOT = {
  ok: 'var(--status-ok)',
  warn: 'var(--status-warn)',
  fault: 'var(--status-fault)',
  idle: 'var(--status-idle)'
};

/** Tree row with lineage lines, disclosure caret and connection status. */
function TreeItem({
  label,
  depth = 0,
  expanded,
  onToggle,
  leading,
  meta,
  status,
  selected = false,
  trailing,
  children,
  style
}) {
  const [hover, setHover] = useState(false);
  const hasKids = typeof expanded === 'boolean';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onToggle,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      height: 'var(--row-dense)',
      paddingRight: 'var(--gutter)',
      paddingLeft: 'calc(var(--gutter) + ' + depth * 14 + 'px)',
      background: selected ? 'var(--surface-selected-tint)' : hover ? 'var(--surface-hover)' : 'transparent',
      boxShadow: selected ? 'inset 1px 0 0 var(--accent-telemetry-ink)' : 'none',
      color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-sm-size)',
      fontFeatureSettings: 'var(--mono-features)',
      cursor: 'pointer',
      position: 'relative',
      transition: 'background var(--dur-fast) var(--ease-out)'
    }
  }, depth > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 'calc(var(--gutter) + ' + (depth * 14 - 7) + 'px)',
      top: 0,
      bottom: 0,
      width: '1px',
      background: 'var(--hairline)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '10px',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--text-faint)',
      flex: '0 0 auto',
      fontSize: '9px'
    }
  }, hasKids ? expanded ? '▾' : '▸' : ''), leading && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      color: selected ? 'var(--accent-telemetry-ink)' : 'var(--text-muted)',
      flex: '0 0 auto'
    }
  }, leading), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      minWidth: 0
    }
  }, label), status && /*#__PURE__*/React.createElement("span", {
    style: {
      width: '5px',
      height: '5px',
      borderRadius: 'var(--radius-full)',
      background: DOT[status] || DOT.idle,
      boxShadow: status === 'ok' ? '0 0 6px var(--status-ok)' : 'none',
      flex: '0 0 auto'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)',
      whiteSpace: 'nowrap',
      flex: '0 0 auto'
    }
  }, meta), trailing), expanded && children);
}
Object.assign(__ds_scope, { TreeItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inspector/TreeItem.jsx", error: String((e && e.message) || e) }); }

// components/telemetry/Badge.jsx
try { (() => {
const TONES = {
  route: {
    fg: 'var(--obs-primary)',
    bg: 'var(--obs-blue-20)',
    bd: 'var(--obs-blue-30)'
  },
  telemetry: {
    fg: 'var(--obs-secondary)',
    bg: 'var(--obs-cyan-20)',
    bd: 'var(--obs-cyan-20)'
  },
  meta: {
    fg: 'var(--obs-tertiary)',
    bg: 'var(--obs-magenta-20)',
    bd: 'var(--obs-magenta-20)'
  },
  ok: {
    fg: 'var(--status-ok)',
    bg: 'var(--status-ok-bg)',
    bd: 'var(--status-ok-bg)'
  },
  warn: {
    fg: 'var(--status-warn)',
    bg: 'var(--status-warn-bg)',
    bd: 'var(--status-warn-bg)'
  },
  fault: {
    fg: 'var(--status-fault)',
    bg: 'var(--status-fault-bg)',
    bd: 'var(--status-fault-bg)'
  },
  neutral: {
    fg: 'var(--text-muted)',
    bg: 'var(--surface-raised)',
    bd: 'var(--hairline)'
  },
  solid: {
    fg: 'var(--text-on-accent)',
    bg: 'var(--accent-route)',
    bd: 'var(--accent-route)'
  }
};

/** Micro-pill for provider, routing and telemetry metadata. */
function Badge({
  children,
  tone = 'neutral',
  shape = 'tag',
  dot = false,
  leading,
  style
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
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
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: '5px',
      height: '5px',
      borderRadius: 'var(--radius-full)',
      background: 'currentColor',
      flex: '0 0 auto'
    }
  }), leading, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/telemetry/Badge.jsx", error: String((e && e.message) || e) }); }

// components/telemetry/MetricPair.jsx
try { (() => {
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
function MetricPair({
  label,
  value,
  unit,
  tone = 'default',
  align = 'left',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '1px',
      textAlign: align,
      minWidth: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm-size)',
      lineHeight: 'var(--label-sm-lh)',
      letterSpacing: 'var(--label-sm-ls)',
      fontWeight: 600,
      textTransform: 'uppercase',
      color: 'var(--text-faint)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-md-size)',
      lineHeight: 'var(--body-md-lh)',
      fontFeatureSettings: 'var(--mono-features)',
      color: INK[tone] || INK.default,
      whiteSpace: 'nowrap'
    }
  }, value, unit && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)',
      marginLeft: '2px'
    }
  }, unit)));
}
Object.assign(__ds_scope, { MetricPair });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/telemetry/MetricPair.jsx", error: String((e && e.message) || e) }); }

// components/telemetry/StatusDot.jsx
try { (() => {
const TONES = {
  ok: 'var(--status-ok)',
  warn: 'var(--status-warn)',
  fault: 'var(--status-fault)',
  idle: 'var(--status-idle)',
  live: 'var(--accent-telemetry-ink)',
  route: 'var(--accent-route-ink)'
};

/** Connection / health indicator, optionally pinging. */
function StatusDot({
  tone = 'ok',
  size = 6,
  ping = false,
  label,
  style
}) {
  const color = TONES[tone] || TONES.ok;
  const dot = /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-grid',
      placeItems: 'center',
      flex: '0 0 auto',
      width: size + 'px',
      height: size + 'px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: size + 'px',
      height: size + 'px',
      borderRadius: 'var(--radius-full)',
      background: color,
      boxShadow: ping ? '0 0 8px ' + color : 'none'
    }
  }), ping && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      width: size * 2 + 'px',
      height: size * 2 + 'px',
      borderRadius: 'var(--radius-full)',
      border: '1px solid ' + color,
      opacity: 0.35
    }
  }));
  if (!label) return dot;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      ...style
    }
  }, dot, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-sm-size)',
      color: 'var(--text-muted)'
    }
  }, label));
}
Object.assign(__ds_scope, { StatusDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/telemetry/StatusDot.jsx", error: String((e && e.message) || e) }); }

// components/telemetry/TokenBudgetBar.jsx
try { (() => {
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(n);

/** Slim 3px context-budget track: blue consumed, magenta cached. */
function TokenBudgetBar({
  used = 0,
  cached = 0,
  total = 1,
  label,
  showValues = true,
  height,
  style
}) {
  const cap = Math.max(total, 1);
  const pctUsed = Math.min(100, used / cap * 100);
  const pctCached = Math.min(100 - pctUsed, cached / cap * 100);
  const over = used / cap >= 0.9;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '6px',
      minWidth: 0,
      ...style
    }
  }, (label || showValues) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm-size)',
      letterSpacing: 'var(--label-sm-ls)',
      fontWeight: 600,
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 0
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), showValues && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)',
      textTransform: 'none',
      flex: '0 0 auto',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: over ? 'var(--status-warn)' : 'var(--accent-route-ink)',
      whiteSpace: 'nowrap'
    }
  }, fmt(used)), cached > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent-meta-ink)',
      whiteSpace: 'nowrap'
    }
  }, "+", fmt(cached), " cached"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)',
      whiteSpace: 'nowrap'
    }
  }, "/ ", fmt(total)))), /*#__PURE__*/React.createElement("div", {
    role: "progressbar",
    "aria-valuenow": Math.round(pctUsed),
    style: {
      display: 'flex',
      height: (height || 3) + 'px',
      borderRadius: 'var(--radius-full)',
      background: 'var(--obs-white-08)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: pctUsed + '%',
      background: over ? 'var(--status-warn)' : 'var(--accent-route)',
      transition: 'width var(--dur-slow) var(--ease-out)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: pctCached + '%',
      background: 'var(--accent-meta)',
      transition: 'width var(--dur-slow) var(--ease-out)'
    }
  })));
}
Object.assign(__ds_scope, { TokenBudgetBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/telemetry/TokenBudgetBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/obsidian-ide/Chrome.jsx
try { (() => {
const {
  IconButton,
  Icon,
  Badge,
  StatusDot,
  MetricPair,
  Kbd
} = window.ObsidianCyberIDEDesignSystem_fe171d;
const RAIL = [{
  id: 'editor',
  icon: 'file-code',
  label: 'Explorer'
}, {
  id: 'mcp',
  icon: 'plug',
  label: 'MCP registry'
}, {
  id: 'providers',
  icon: 'gauge',
  label: 'Providers & routing'
}, {
  id: 'traces',
  icon: 'history',
  label: 'Traces'
}];
function ActivityRail({
  view,
  onView
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      width: '44px',
      flex: '0 0 44px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      padding: 'var(--space-sm) 0',
      background: 'var(--surface-app)',
      borderRight: '1px solid var(--hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: '28px',
      height: '28px',
      borderRadius: 'var(--radius)',
      background: 'var(--accent-route)',
      color: '#fff',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-md-size)',
      fontWeight: 600,
      marginBottom: 'var(--space-sm)'
    }
  }, "ob"), RAIL.map(r => {
    const active = r.id === view;
    return /*#__PURE__*/React.createElement("button", {
      key: r.id,
      type: "button",
      title: r.label,
      "aria-label": r.label,
      onClick: () => onView(r.id),
      style: {
        position: 'relative',
        width: '32px',
        height: '32px',
        display: 'grid',
        placeItems: 'center',
        background: active ? 'var(--surface-hover)' : 'transparent',
        border: 'none',
        borderRadius: 'var(--radius)',
        color: active ? 'var(--accent-telemetry-ink)' : 'var(--text-faint)',
        cursor: 'pointer',
        transition: 'color var(--dur) var(--ease-out), background var(--dur) var(--ease-out)'
      }
    }, active && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: '-6px',
        top: '6px',
        bottom: '6px',
        width: '2px',
        borderRadius: '1px',
        background: 'var(--accent-route)'
      }
    }), /*#__PURE__*/React.createElement(Icon, {
      name: r.icon,
      size: 16
    }));
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), /*#__PURE__*/React.createElement(IconButton, {
    label: "Settings"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "settings-2",
    size: 16
  })));
}
function TitleBar({
  tabs,
  activeTab,
  onTab,
  onPalette
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'stretch',
      height: 'var(--bar-toolbar)',
      flex: '0 0 auto',
      background: 'var(--surface-app)',
      borderBottom: '1px solid var(--hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'stretch',
      minWidth: 0,
      overflow: 'hidden'
    }
  }, tabs.map(t => {
    const active = t.id === activeTab;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      type: "button",
      onClick: () => onTab(t.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        padding: '0 var(--space-md)',
        background: active ? 'var(--surface-canvas)' : 'transparent',
        border: 'none',
        borderRight: '1px solid var(--hairline)',
        boxShadow: active ? 'inset 0 1px 0 var(--rim-electric)' : 'none',
        color: active ? 'var(--text-primary)' : 'var(--text-faint)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--body-sm-size)',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: t.icon || 'file-code',
      size: 12
    }), t.name, t.dirty && /*#__PURE__*/React.createElement("span", {
      style: {
        width: '5px',
        height: '5px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--accent-telemetry-ink)'
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 0,
      padding: '0 var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onPalette,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      height: '24px',
      width: '100%',
      maxWidth: '320px',
      padding: '0 var(--space-sm)',
      background: 'var(--surface-input)',
      border: '1px solid var(--hairline)',
      borderRadius: 'var(--radius)',
      color: 'var(--text-faint)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-sm-size)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 12
  }), /*#__PURE__*/React.createElement("span", null, "route or open\u2026"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), /*#__PURE__*/React.createElement(Kbd, null, "ctrl+p"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      padding: '0 var(--gutter)',
      flex: '0 0 auto'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "route"
  }, "@fast"), /*#__PURE__*/React.createElement(IconButton, {
    label: "Split editor"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "columns-2",
    size: 14
  })), /*#__PURE__*/React.createElement(IconButton, {
    label: "Terminal",
    active: true
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "terminal",
    size: 14
  }))));
}
function StatusBar({
  model
}) {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-lg)',
      height: 'var(--bar-status)',
      flex: '0 0 auto',
      padding: '0 var(--gutter)',
      background: 'var(--surface-app)',
      borderTop: '1px solid var(--hairline)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm-size)',
      letterSpacing: 'var(--label-sm-ls)',
      color: 'var(--text-muted)',
      fontFeatureSettings: 'var(--mono-features)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "git-branch",
    size: 11
  }), "feat/router-fallback"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      color: 'var(--accent-route-ink)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "zap",
    size: 11
  }), model), /*#__PURE__*/React.createElement(StatusDot, {
    tone: "live",
    size: 5,
    ping: true,
    label: "82 tok/s"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent-meta-ink)'
    }
  }, "cache 41.2%"), /*#__PURE__*/React.createElement("span", null, "ctx 412k / 1.1M"), /*#__PURE__*/React.createElement("span", null, "ln 184, col 22"), /*#__PURE__*/React.createElement("span", null, "utf-8 \xB7 lf \xB7 ts"));
}
Object.assign(window, {
  ActivityRail,
  TitleBar,
  StatusBar,
  RAIL
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/obsidian-ide/Chrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/obsidian-ide/EditorWorkspace.jsx
try { (() => {
const {
  Panel,
  IconButton,
  Icon,
  Badge,
  StatusDot,
  TokenBudgetBar,
  MetricPair,
  TreeItem,
  Button
} = window.ObsidianCyberIDEDesignSystem_fe171d;
const FILES = [{
  label: 'src',
  depth: 0,
  dir: true,
  kids: [{
    label: 'router',
    depth: 1,
    dir: true,
    kids: [{
      label: 'pick.ts',
      depth: 2,
      active: true,
      meta: '184'
    }, {
      label: 'fallback.ts',
      depth: 2,
      meta: '96'
    }, {
      label: 'pricing.ts',
      depth: 2,
      meta: '52'
    }]
  }, {
    label: 'mcp',
    depth: 1,
    dir: true,
    kids: [{
      label: 'registry.ts',
      depth: 2,
      meta: '210'
    }, {
      label: 'transport.ts',
      depth: 2,
      meta: '88'
    }]
  }, {
    label: 'index.ts',
    depth: 1,
    meta: '31'
  }]
}, {
  label: 'obsidian.config.jsonc',
  depth: 0,
  meta: '44'
}];
const CODE = [[184, [['kw', 'export async function '], ['fn', 'pick'], ['p', '(req: '], ['ty', 'RouteRequest'], ['p', ') {']]], [185, [['p', '  '], ['kw', 'const '], ['p', 'candidates = registry.'], ['fn', 'eligible'], ['p', '(req.capabilities);']]], [186, [['p', '  '], ['cm', '// ceiling is $/M output tokens, not per request']]], [187, [['p', '  '], ['kw', 'const '], ['p', 'ceiling = req.budget?.ceiling ?? '], ['nu', '0.55'], ['p', ';']]], [188, [['p', '']]], [189, [['p', '  '], ['kw', 'for '], ['p', '('], ['kw', 'const '], ['p', 'c '], ['kw', 'of '], ['p', 'candidates) {']]], [190, [['p', '    '], ['kw', 'if '], ['p', '(c.price.out > ceiling) '], ['kw', 'continue'], ['p', ';']]], [191, [['p', '    '], ['kw', 'if '], ['p', '(c.health.p50 > '], ['nu', '2_500'], ['p', ') { telemetry.'], ['fn', 'flag'], ['p', '(c.id, '], ['st', '"degraded"'], ['p', '); '], ['kw', 'continue'], ['p', '; }']]], [192, [['p', '    '], ['kw', 'return '], ['p', '{ model: c.id, alias: '], ['st', '"@fast"'], ['p', ', cached: cache.'], ['fn', 'peek'], ['p', '(req) };']]], [193, [['p', '  }']]], [194, [['p', '']]], [195, [['p', '  '], ['kw', 'throw new '], ['ty', 'NoRouteError'], ['p', '('], ['st', '"no provider under ceiling"'], ['p', ');']]], [196, [['p', '}']]]];
const INK = {
  kw: 'var(--syntax-keyword)',
  fn: 'var(--syntax-fn)',
  st: 'var(--syntax-string)',
  nu: 'var(--syntax-number)',
  cm: 'var(--syntax-comment)',
  ty: 'var(--syntax-type)',
  p: 'var(--syntax-plain)'
};
function FileTree({
  nodes,
  open,
  toggle,
  selected,
  onSelect
}) {
  return nodes.map(n => /*#__PURE__*/React.createElement(TreeItem, {
    key: n.label + n.depth,
    label: n.label,
    depth: n.depth,
    expanded: n.dir ? !!open[n.label] : undefined,
    onToggle: () => n.dir ? toggle(n.label) : onSelect(n.label),
    selected: selected === n.label,
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: n.dir ? open[n.label] ? 'folder-open' : 'folder' : 'file-code',
      size: 12
    }),
    meta: n.meta
  }, n.kids && /*#__PURE__*/React.createElement(FileTree, {
    nodes: n.kids,
    open: open,
    toggle: toggle,
    selected: selected,
    onSelect: onSelect
  })));
}
function EditorWorkspace({
  onPalette
}) {
  const [open, setOpen] = React.useState({
    src: true,
    router: true,
    mcp: false
  });
  const [sel, setSel] = React.useState('pick.ts');
  const toggle = k => setOpen(o => ({
    ...o,
    [k]: !o[k]
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 auto',
      display: 'flex',
      minHeight: 0,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 'var(--sidebar-width)',
      flex: '0 0 var(--sidebar-width)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      background: 'var(--surface-docked)',
      borderRight: '1px solid var(--hairline)'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "explorer",
    meta: "router",
    padded: false,
    tone: "docked",
    style: {
      flex: '1 1 auto',
      minHeight: 0,
      border: 'none',
      borderRadius: 0
    },
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
      label: "New file",
      size: "sm"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "file-plus",
      size: 12
    })), /*#__PURE__*/React.createElement(IconButton, {
      label: "Collapse",
      size: "sm"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "chevrons-down-up",
      size: 12
    })))
  }, /*#__PURE__*/React.createElement(FileTree, {
    nodes: FILES,
    open: open,
    toggle: toggle,
    selected: sel,
    onSelect: setSel
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 auto',
      borderTop: '1px solid var(--hairline)',
      padding: 'var(--gutter)',
      display: 'grid',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement(TokenBudgetBar, {
    label: "context",
    used: 412000,
    cached: 96000,
    total: 1100000
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement(MetricPair, {
    label: "p50",
    value: "412",
    unit: "ms"
  }), /*#__PURE__*/React.createElement(MetricPair, {
    label: "cache",
    value: "41.2%",
    tone: "meta"
  })))), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: '1 1 auto',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-canvas)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      height: '26px',
      flex: '0 0 auto',
      padding: '0 var(--gutter)',
      borderBottom: '1px solid var(--hairline)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm-size)',
      letterSpacing: 'var(--label-sm-ls)',
      color: 'var(--text-faint)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "src"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 10
  }), /*#__PURE__*/React.createElement("span", null, "router"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 10
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, "pick.ts"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: "telemetry",
    dot: true
  }, "inline route")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 auto',
      overflow: 'auto',
      padding: 'var(--space-sm) 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--code-dense-size)',
      lineHeight: 'var(--code-dense-lh)',
      letterSpacing: 'var(--code-dense-ls)',
      fontFeatureSettings: 'var(--mono-features)'
    }
  }, CODE.map(([ln, parts], i) => /*#__PURE__*/React.createElement("div", {
    key: ln,
    style: {
      display: 'flex',
      gap: 'var(--space-md)',
      padding: '0 var(--gutter)',
      background: i === 8 ? 'var(--obs-blue-12)' : 'transparent',
      boxShadow: i === 8 ? 'inset 2px 0 0 var(--accent-route)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '30px',
      textAlign: 'right',
      color: 'var(--syntax-gutter)',
      flex: '0 0 auto',
      userSelect: 'none'
    }
  }, ln), /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: 'pre',
      minWidth: 0
    }
  }, parts.map((p, j) => /*#__PURE__*/React.createElement("span", {
    key: j,
    style: {
      color: INK[p[0]]
    }
  }, p[1]))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-md)',
      padding: '4px var(--gutter) 0',
      color: 'var(--text-faint)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '30px'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      padding: '2px 6px',
      border: '1px dashed var(--border-strong)',
      borderRadius: 'var(--radius-sm)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 11,
    color: "var(--accent-telemetry-ink)"
  }), "inline completion \xB7 3 candidates", /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onPalette,
    style: {
      background: 'none',
      border: 'none',
      padding: 0,
      color: 'var(--accent-route-ink)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'inherit',
      cursor: 'pointer'
    }
  }, "reroute")))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 auto',
      height: '112px',
      borderTop: '1px solid var(--hairline)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-app)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-lg)',
      height: '26px',
      padding: '0 var(--gutter)',
      borderBottom: '1px solid var(--hairline)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm-size)',
      letterSpacing: 'var(--label-sm-ls)',
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-primary)',
      boxShadow: 'inset 0 -1px 0 var(--accent-telemetry-ink)'
    }
  }, "terminal"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)'
    }
  }, "router log"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)'
    }
  }, "problems 2"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), /*#__PURE__*/React.createElement(IconButton, {
    label: "Clear",
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash-2",
    size: 12
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 auto',
      overflow: 'auto',
      padding: '4px 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-sm-size)',
      lineHeight: '18px',
      fontFeatureSettings: 'var(--mono-features)'
    }
  }, [['12:04:48', 'route', 'anthropic/claude-sonnet-4.6', '412ms', 'ok'], ['12:04:51', 'cache', 'prefix hit 96,412 tok', '—', 'hit'], ['12:04:52', 'route', 'openai/gpt-5.2-turbo', '3,812ms', 'degraded'], ['12:04:52', 'fallback', 'groq/llama-4-70b @cheap', '188ms', 'ok']].map(r => /*#__PURE__*/React.createElement("div", {
    key: r[0] + r[1],
    style: {
      display: 'flex',
      gap: 'var(--space-md)',
      padding: '0 var(--gutter)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)'
    }
  }, r[0]), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '64px',
      color: 'var(--accent-route-ink)'
    }
  }, r[1]), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto',
      minWidth: 0,
      color: 'var(--text-secondary)'
    }
  }, r[2]), /*#__PURE__*/React.createElement("span", null, r[3]), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '64px',
      textAlign: 'right',
      color: r[4] === 'ok' ? 'var(--status-ok)' : r[4] === 'hit' ? 'var(--accent-meta-ink)' : 'var(--status-warn)'
    }
  }, r[4])))))), /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 'var(--inspector-width)',
      flex: '0 0 var(--inspector-width)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      background: 'var(--surface-docked)',
      borderLeft: '1px solid var(--hairline)',
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "active route",
    tone: "docked",
    style: {
      flex: '0 0 auto',
      border: 'none',
      borderRadius: 0,
      borderBottom: '1px solid var(--hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-md-size)',
      color: 'var(--text-primary)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "zap",
    size: 12,
    color: "var(--accent-route-ink)"
  }), "claude-sonnet-4.6", /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: "route"
  }, "@fast")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement(MetricPair, {
    label: "in / out",
    value: "$0.11 / $0.55",
    unit: "/M",
    tone: "telemetry"
  }), /*#__PURE__*/React.createElement(MetricPair, {
    label: "ctx",
    value: "1.1M"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "ok",
    dot: true
  }, "99.98%"), /*#__PURE__*/React.createElement(Badge, {
    tone: "meta"
  }, "cache 41%"), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, "us-east")), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    fullWidth: true,
    onClick: onPalette,
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "refresh-cw",
      size: 11
    })
  }, "change route"))), /*#__PURE__*/React.createElement(Panel, {
    title: "context",
    meta: "4 sources",
    tone: "docked",
    padded: false,
    style: {
      flex: '0 0 auto',
      border: 'none',
      borderRadius: 0,
      borderBottom: '1px solid var(--hairline)'
    }
  }, /*#__PURE__*/React.createElement(TreeItem, {
    label: "src/router/pick.ts",
    status: "ok",
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "file-code",
      size: 12
    }),
    meta: "6.1k"
  }), /*#__PURE__*/React.createElement(TreeItem, {
    label: "obsidian.config.jsonc",
    status: "ok",
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "file-code",
      size: 12
    }),
    meta: "1.4k"
  }), /*#__PURE__*/React.createElement(TreeItem, {
    label: "registry snapshot",
    status: "ok",
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "database",
      size: 12
    }),
    meta: "88k"
  }), /*#__PURE__*/React.createElement(TreeItem, {
    label: "conversation",
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "history",
      size: 12
    }),
    meta: "316k"
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "mcp",
    meta: "3 connected",
    tone: "docked",
    padded: false,
    style: {
      flex: '0 0 auto',
      border: 'none',
      borderRadius: 0
    }
  }, /*#__PURE__*/React.createElement(TreeItem, {
    label: "filesystem",
    status: "ok",
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "plug",
      size: 12
    }),
    meta: "14 tools"
  }), /*#__PURE__*/React.createElement(TreeItem, {
    label: "postgres",
    status: "ok",
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "database",
      size: 12
    }),
    meta: "6 tools"
  }), /*#__PURE__*/React.createElement(TreeItem, {
    label: "github",
    status: "warn",
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "git-branch",
      size: 12
    }),
    meta: "auth 2d"
  }), /*#__PURE__*/React.createElement(TreeItem, {
    label: "stripe",
    status: "fault",
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "circle-stop",
      size: 12
    }),
    meta: "offline"
  }))));
}
Object.assign(window, {
  EditorWorkspace
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/obsidian-ide/EditorWorkspace.jsx", error: String((e && e.message) || e) }); }

// ui_kits/obsidian-ide/McpRegistry.jsx
try { (() => {
const {
  Panel,
  Button,
  IconButton,
  Input,
  Switch,
  Icon,
  Badge,
  StatusDot,
  MetricPair,
  TreeItem,
  Kbd
} = window.ObsidianCyberIDEDesignSystem_fe171d;
const SERVERS = [{
  id: 'filesystem',
  status: 'ok',
  tools: ['read_file', 'write_file', 'list_directory', 'search_files'],
  transport: 'stdio',
  calls: '2,184',
  p50: '8ms'
}, {
  id: 'postgres',
  status: 'ok',
  tools: ['query', 'schema', 'explain'],
  transport: 'stdio',
  calls: '612',
  p50: '41ms'
}, {
  id: 'github',
  status: 'warn',
  tools: ['get_tree', 'read_files', 'compare'],
  transport: 'http',
  calls: '96',
  p50: '318ms'
}, {
  id: 'stripe',
  status: 'fault',
  tools: [],
  transport: 'http',
  calls: '0',
  p50: '—'
}];
function McpRegistry() {
  const [open, setOpen] = React.useState({
    filesystem: true
  });
  const [sel, setSel] = React.useState('read_file');
  const [q, setQ] = React.useState('');
  const [autoConnect, setAutoConnect] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 auto',
      display: 'flex',
      minHeight: 0,
      minWidth: 0,
      background: 'var(--surface-app)'
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      width: '320px',
      flex: '0 0 320px',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      borderRight: '1px solid var(--hairline)',
      background: 'var(--surface-docked)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--gutter)',
      borderBottom: '1px solid var(--hairline)',
      display: 'grid',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    size: "sm",
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "filter servers\u2026",
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 12
    })
  }), /*#__PURE__*/React.createElement(Switch, {
    checked: autoConnect,
    onChange: setAutoConnect,
    label: "auto-connect on open"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 auto',
      overflow: 'auto'
    }
  }, SERVERS.filter(s => s.id.includes(q)).map(s => /*#__PURE__*/React.createElement(TreeItem, {
    key: s.id,
    label: s.id,
    expanded: s.tools.length ? !!open[s.id] : undefined,
    onToggle: () => setOpen(o => ({
      ...o,
      [s.id]: !o[s.id]
    })),
    status: s.status,
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: s.transport === 'stdio' ? 'terminal' : 'plug',
      size: 12
    }),
    meta: s.tools.length ? s.tools.length + ' tools' : 'offline'
  }, s.tools.map(t => /*#__PURE__*/React.createElement(TreeItem, {
    key: t,
    depth: 1,
    label: t,
    selected: sel === t,
    onToggle: () => setSel(t),
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "box",
      size: 11
    })
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--gutter)',
      borderTop: '1px solid var(--hairline)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    fullWidth: true,
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 11
    })
  }, "add server"))), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: '1 1 auto',
      minWidth: 0,
      display: 'grid',
      gap: 'var(--gutter)',
      gridTemplateRows: 'auto auto 1fr',
      padding: 'var(--gutter)',
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "filesystem",
    meta: "stdio \xB7 npx @mcp/filesystem",
    tone: "pane",
    rim: true,
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "telemetry",
      leading: /*#__PURE__*/React.createElement(Icon, {
        name: "refresh-cw",
        size: 11
      })
    }, "reconnect"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "danger"
    }, "disable"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-xl)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(MetricPair, {
    label: "status",
    value: /*#__PURE__*/React.createElement(StatusDot, {
      tone: "ok",
      ping: true,
      label: "connected 4h 12m"
    })
  }), /*#__PURE__*/React.createElement(MetricPair, {
    label: "calls",
    value: "2,184"
  }), /*#__PURE__*/React.createElement(MetricPair, {
    label: "p50",
    value: "8",
    unit: "ms"
  }), /*#__PURE__*/React.createElement(MetricPair, {
    label: "tokens returned",
    value: "188.4k",
    tone: "meta"
  }), /*#__PURE__*/React.createElement(MetricPair, {
    label: "errors",
    value: "0.00%",
    tone: "ok"
  }))), /*#__PURE__*/React.createElement(Panel, {
    title: 'tool · ' + sel,
    meta: "schema",
    tone: "pane"
  }, /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--code-dense-size)',
      lineHeight: 'var(--code-dense-lh)',
      color: 'var(--text-secondary)'
    }
  }, '{\n  "path":   string    // absolute or workspace-relative\n  "offset": number?   // 0-indexed line start\n  "limit":  number?   // max 2000 lines\n}'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)',
      marginTop: 'var(--space-md)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "telemetry",
    dot: true
  }, "1,204 calls"), /*#__PURE__*/React.createElement(Badge, {
    tone: "meta"
  }, "avg 1.2k tok"), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, "read-only"))), /*#__PURE__*/React.createElement(Panel, {
    title: "call log",
    meta: "last 6",
    tone: "pane",
    padded: false
  }, [['12:04:51', 'read_file', 'src/router/pick.ts', '6ms', 'ok'], ['12:04:50', 'search_files', 'ceiling', '18ms', 'ok'], ['12:04:44', 'query', 'select * from routes limit 20', '41ms', 'ok'], ['12:04:31', 'get_tree', 'obsidian/router@main', '318ms', 'slow'], ['12:03:58', 'read_file', 'obsidian.config.jsonc', '4ms', 'ok'], ['12:03:12', 'charge', 'stripe', '—', 'fault']].map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      height: 'var(--row-dense)',
      padding: '0 var(--gutter)',
      borderBottom: '1px solid var(--border-subtle)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-sm-size)',
      fontFeatureSettings: 'var(--mono-features)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)'
    }
  }, r[0]), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '104px',
      color: 'var(--accent-route-ink)'
    }
  }, r[1]), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto',
      minWidth: 0,
      color: 'var(--text-secondary)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, r[2]), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, r[3]), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '54px',
      textAlign: 'right',
      color: r[4] === 'ok' ? 'var(--status-ok)' : r[4] === 'slow' ? 'var(--status-warn)' : 'var(--status-fault)'
    }
  }, r[4]))))));
}
Object.assign(window, {
  McpRegistry
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/obsidian-ide/McpRegistry.jsx", error: String((e && e.message) || e) }); }

// ui_kits/obsidian-ide/ProviderSettings.jsx
try { (() => {
const {
  Panel,
  Button,
  Input,
  Switch,
  Icon,
  Badge,
  StatusDot,
  MetricPair,
  TokenBudgetBar,
  Kbd
} = window.ObsidianCyberIDEDesignSystem_fe171d;
const PROVIDERS = [{
  id: 'anthropic',
  models: 12,
  alias: '@fast',
  price: '$0.11 / $0.55',
  p50: '412ms',
  up: '99.98%',
  tone: 'ok',
  on: true
}, {
  id: 'openai',
  models: 9,
  alias: '@deep',
  price: '$0.38 / $1.20',
  p50: '3,812ms',
  up: '97.14%',
  tone: 'warn',
  on: true
}, {
  id: 'groq',
  models: 5,
  alias: '@cheap',
  price: '$0.04 / $0.08',
  p50: '188ms',
  up: '99.41%',
  tone: 'ok',
  on: true
}, {
  id: 'ollama · local',
  models: 6,
  alias: '@local',
  price: 'free',
  p50: '1,204ms',
  up: 'cold',
  tone: 'idle',
  on: false
}];
function ProviderRow({
  p,
  on,
  onToggle
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      height: 'var(--row-item)',
      padding: '0 var(--gutter)',
      borderBottom: '1px solid var(--border-subtle)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-md-size)',
      fontFeatureSettings: 'var(--mono-features)'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: on,
    onChange: onToggle
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '130px',
      color: on ? 'var(--text-primary)' : 'var(--text-faint)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, p.id), /*#__PURE__*/React.createElement(Badge, {
    tone: "route"
  }, p.alias), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '80px',
      color: 'var(--text-faint)',
      fontSize: 'var(--body-sm-size)',
      whiteSpace: 'nowrap'
    }
  }, p.models, " models"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontSize: 'var(--body-sm-size)',
      whiteSpace: 'nowrap'
    }
  }, p.price, " /M"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '72px',
      textAlign: 'right',
      color: 'var(--text-muted)',
      fontSize: 'var(--body-sm-size)',
      whiteSpace: 'nowrap'
    }
  }, p.p50), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '86px',
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(StatusDot, {
    tone: p.tone,
    size: 5,
    label: p.up
  })));
}
function ProviderSettings() {
  const [state, setState] = React.useState(() => Object.fromEntries(PROVIDERS.map(p => [p.id, p.on])));
  const [ceiling, setCeiling] = React.useState('0.55');
  const [fallback, setFallback] = React.useState(true);
  const [cachePrefix, setCachePrefix] = React.useState(true);
  const [strict, setStrict] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 auto',
      minWidth: 0,
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) 320px',
      gap: 'var(--gutter)',
      padding: 'var(--gutter)',
      overflow: 'auto',
      background: 'var(--surface-app)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--gutter)',
      alignContent: 'start',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "providers",
    meta: "4 registered \xB7 3 enabled",
    tone: "pane",
    padded: false,
    actions: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      leading: /*#__PURE__*/React.createElement(Icon, {
        name: "plus",
        size: 11
      })
    }, "add key")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      height: '22px',
      padding: '0 var(--gutter)',
      borderBottom: '1px solid var(--hairline)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm-size)',
      letterSpacing: 'var(--label-sm-ls)',
      fontWeight: 600,
      textTransform: 'uppercase',
      color: 'var(--text-faint)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '26px'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '130px'
    }
  }, "provider"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '80px'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), /*#__PURE__*/React.createElement("span", null, "in / out"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '72px',
      textAlign: 'right'
    }
  }, "p50"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '86px',
      textAlign: 'right'
    }
  }, "uptime")), PROVIDERS.map(p => /*#__PURE__*/React.createElement(ProviderRow, {
    key: p.id,
    p: p,
    on: state[p.id],
    onToggle: v => setState(s => ({
      ...s,
      [p.id]: v
    }))
  }))), /*#__PURE__*/React.createElement(Panel, {
    title: "routing policy",
    tone: "pane"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-lg)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'grid',
      gap: '4px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm-size)',
      letterSpacing: 'var(--label-sm-ls)',
      fontWeight: 600,
      textTransform: 'uppercase',
      color: 'var(--text-faint)'
    }
  }, "cost ceiling \xB7 $/M out"), /*#__PURE__*/React.createElement(Input, {
    size: "sm",
    style: {
      width: '120px'
    },
    value: ceiling,
    onChange: e => setCeiling(e.target.value)
  })), /*#__PURE__*/React.createElement(Switch, {
    checked: fallback,
    onChange: setFallback,
    label: "auto-fallback",
    hint: "retry 429 / p50 > 2.5s on next alias"
  }), /*#__PURE__*/React.createElement(Switch, {
    checked: cachePrefix,
    onChange: setCachePrefix,
    label: "prompt prefix cache",
    hint: "reuse system + tool preamble"
  }), /*#__PURE__*/React.createElement(Switch, {
    checked: strict,
    onChange: setStrict,
    label: "strict ceiling",
    hint: "fail instead of overspending"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "route"
  }, "@fast \u2192 anthropic"), /*#__PURE__*/React.createElement(Badge, {
    tone: "route"
  }, "@deep \u2192 openai"), /*#__PURE__*/React.createElement(Badge, {
    tone: "route"
  }, "@cheap \u2192 groq"), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, "@local \u2192 ollama"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--gutter)',
      alignContent: 'start'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "spend \xB7 24h",
    tone: "pane"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-xl)'
    }
  }, /*#__PURE__*/React.createElement(MetricPair, {
    label: "spend",
    value: "$41.80",
    tone: "route"
  }), /*#__PURE__*/React.createElement(MetricPair, {
    label: "saved by cache",
    value: "$18.22",
    tone: "meta"
  })), /*#__PURE__*/React.createElement(TokenBudgetBar, {
    label: "monthly budget",
    used: 418,
    cached: 0,
    total: 600,
    showValues: false
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-xl)'
    }
  }, /*#__PURE__*/React.createElement(MetricPair, {
    label: "requests",
    value: "12,884"
  }), /*#__PURE__*/React.createElement(MetricPair, {
    label: "tok/s avg",
    value: "82",
    tone: "telemetry"
  })))), /*#__PURE__*/React.createElement(Panel, {
    title: "keys",
    meta: "3 stored",
    tone: "pane",
    padded: false
  }, [['anthropic', 'sk-ant-••••4f21', 'ok'], ['openai', 'sk-••••9ab0', 'ok'], ['github', 'ghp_••••11c4', 'warn']].map(k => /*#__PURE__*/React.createElement("div", {
    key: k[0],
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      height: 'var(--row-dense)',
      padding: '0 var(--gutter)',
      borderBottom: '1px solid var(--border-subtle)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-sm-size)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '80px',
      color: 'var(--text-secondary)'
    }
  }, k[0]), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto',
      color: 'var(--text-faint)'
    }
  }, k[1]), /*#__PURE__*/React.createElement(StatusDot, {
    tone: k[2],
    size: 5
  })))), /*#__PURE__*/React.createElement(Panel, {
    title: "hotkeys",
    tone: "pane"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-sm)'
    }
  }, [['route picker', 'ctrl+p'], ['reroute last', 'ctrl+alt+r'], ['evict cache', 'ctrl+shift+k'], ['toggle telemetry', 'ctrl+t']].map(h => /*#__PURE__*/React.createElement("div", {
    key: h[0],
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-sm-size)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, h[0]), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), /*#__PURE__*/React.createElement(Kbd, null, h[1])))))));
}
Object.assign(window, {
  ProviderSettings
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/obsidian-ide/ProviderSettings.jsx", error: String((e && e.message) || e) }); }

// ui_kits/obsidian-ide/RoutePalette.jsx
try { (() => {
const {
  CommandPalette,
  Badge,
  Icon,
  Kbd
} = window.ObsidianCyberIDEDesignSystem_fe171d;
const MODELS = [{
  id: 'a',
  name: 'claude-sonnet-4.6',
  provider: 'anthropic',
  icon: 'zap',
  cost: '$0.11 in / $0.55 out /M',
  context: 'ctx 1.1M',
  health: {
    tone: 'ok',
    label: '99.9%'
  },
  alias: '@fast',
  group: 'frontier'
}, {
  id: 'b',
  name: 'claude-opus-4.2',
  provider: 'anthropic',
  icon: 'zap',
  cost: '$0.90 in / $4.50 out /M',
  context: 'ctx 500k',
  health: {
    tone: 'ok',
    label: '99.8%'
  },
  alias: '@max',
  group: 'frontier'
}, {
  id: 'c',
  name: 'gpt-5.2-turbo',
  provider: 'openai',
  icon: 'box',
  cost: '$0.38 in / $1.20 out /M',
  context: 'ctx 400k',
  health: {
    tone: 'warn',
    label: '97.1%'
  },
  alias: '@deep',
  group: 'frontier'
}, {
  id: 'd',
  name: 'llama-4-70b',
  provider: 'groq',
  icon: 'gauge',
  cost: '$0.04 in / $0.08 out /M',
  context: 'ctx 128k',
  health: {
    tone: 'ok',
    label: '99.4%'
  },
  alias: '@cheap',
  group: 'fast'
}, {
  id: 'e',
  name: 'mixtral-8x22b',
  provider: 'groq',
  icon: 'gauge',
  cost: '$0.06 in / $0.14 out /M',
  context: 'ctx 64k',
  health: {
    tone: 'ok',
    label: '99.2%'
  },
  alias: '',
  group: 'fast'
}, {
  id: 'f',
  name: 'qwen3-coder:32b',
  provider: 'ollama · local',
  icon: 'terminal',
  cost: 'free',
  context: 'ctx 64k',
  health: {
    tone: 'idle',
    label: 'cold'
  },
  alias: '@local',
  group: 'local'
}];
function RoutePalette({
  onClose,
  onRoute,
  selected
}) {
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(selected || 'a');
  const match = MODELS.filter(m => (m.name + m.provider + m.alias).toLowerCase().includes(q.toLowerCase()));
  const groups = ['frontier', 'fast', 'local'].map(g => ({
    label: g,
    meta: String(match.filter(m => m.group === g).length),
    items: match.filter(m => m.group === g).map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      leading: /*#__PURE__*/React.createElement(Icon, {
        name: m.icon,
        size: 12
      }),
      cost: m.cost,
      context: m.context,
      health: m.health,
      alias: m.alias,
      badges: m.group === 'local' ? /*#__PURE__*/React.createElement(Badge, {
        tone: "meta",
        style: {
          marginLeft: '2px'
        }
      }, "gguf") : null
    }))
  })).filter(g => g.items.length);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 2,
      background: 'rgba(0,0,0,.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: 'calc(var(--margin) * 4) var(--margin) var(--margin)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: 'var(--palette-max)'
    }
  }, /*#__PURE__*/React.createElement(CommandPalette, {
    query: q,
    onQueryChange: setQ,
    placeholder: "route to model\u2026",
    groups: groups,
    selectedId: sel,
    onSelect: id => {
      setSel(id);
      const m = MODELS.find(x => x.id === id);
      onRoute(m);
    },
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "\u2191\u2193 navigate"), /*#__PURE__*/React.createElement("span", null, "\u23CE route"), /*#__PURE__*/React.createElement("span", null, "\u2325\u23CE pin alias"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: '1 1 auto'
      }
    }), /*#__PURE__*/React.createElement("span", null, match.length, " of 38 models"))
  })));
}
Object.assign(window, {
  RoutePalette
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/obsidian-ide/RoutePalette.jsx", error: String((e && e.message) || e) }); }

// ui_kits/obsidian-ide/TraceLog.jsx
try { (() => {
const {
  Panel,
  Button,
  IconButton,
  Input,
  Icon,
  Badge,
  StatusDot,
  MetricPair,
  TokenBudgetBar,
  CommandRow
} = window.ObsidianCyberIDEDesignSystem_fe171d;
const TRACES = [{
  id: 't1',
  t: '12:04:52',
  model: 'groq/llama-4-70b',
  alias: '@cheap',
  dur: '188ms',
  tok: '1,204',
  cost: '$0.0004',
  tone: 'ok',
  note: 'fallback from openai'
}, {
  id: 't2',
  t: '12:04:52',
  model: 'openai/gpt-5.2-turbo',
  alias: '@deep',
  dur: '3,812ms',
  tok: '0',
  cost: '$0.0000',
  tone: 'warn',
  note: 'p50 breach · abandoned'
}, {
  id: 't3',
  t: '12:04:51',
  model: 'anthropic/claude-sonnet-4.6',
  alias: '@fast',
  dur: '412ms',
  tok: '6,188',
  cost: '$0.0034',
  tone: 'ok',
  note: 'cache hit 96k'
}, {
  id: 't4',
  t: '12:03:12',
  model: 'anthropic/claude-sonnet-4.6',
  alias: '@fast',
  dur: '—',
  tok: '0',
  cost: '$0.0000',
  tone: 'fault',
  note: '429 rate limit · 3 retries'
}, {
  id: 't5',
  t: '12:02:44',
  model: 'ollama/qwen3-coder:32b',
  alias: '@local',
  dur: '1,204ms',
  tok: '812',
  cost: 'free',
  tone: 'ok',
  note: 'offline completion'
}];
function TraceLog() {
  const [sel, setSel] = React.useState('t3');
  const [q, setQ] = React.useState('');
  const active = TRACES.find(t => t.id === sel) || TRACES[0];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 auto',
      minWidth: 0,
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) 340px',
      gap: 'var(--gutter)',
      padding: 'var(--gutter)',
      overflow: 'hidden',
      background: 'var(--surface-app)'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "traces",
    meta: "last 5 of 12,884",
    tone: "pane",
    padded: false,
    style: {
      minHeight: 0
    },
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Input, {
      size: "sm",
      bare: true,
      style: {
        width: '180px'
      },
      value: q,
      onChange: e => setQ(e.target.value),
      placeholder: "filter by model or alias\u2026",
      leading: /*#__PURE__*/React.createElement(Icon, {
        name: "search",
        size: 12
      })
    }), /*#__PURE__*/React.createElement(IconButton, {
      label: "Export",
      size: "sm"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "download",
      size: 12
    })))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      height: '22px',
      padding: '0 var(--gutter)',
      borderBottom: '1px solid var(--hairline)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm-size)',
      letterSpacing: 'var(--label-sm-ls)',
      fontWeight: 600,
      textTransform: 'uppercase',
      color: 'var(--text-faint)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '58px'
    }
  }, "time"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }, "model"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '74px',
      textAlign: 'right'
    }
  }, "dur"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '62px',
      textAlign: 'right'
    }
  }, "tokens"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '66px',
      textAlign: 'right'
    }
  }, "cost"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '56px',
      textAlign: 'right'
    }
  }, "alias")), TRACES.filter(t => (t.model + t.alias).includes(q)).map(t => /*#__PURE__*/React.createElement(CommandRow, {
    key: t.id,
    dense: true,
    selected: t.id === sel,
    onClick: () => setSel(t.id),
    leading: /*#__PURE__*/React.createElement("span", {
      style: {
        width: '58px',
        fontSize: 'var(--body-sm-size)',
        color: t.id === sel ? 'inherit' : 'var(--text-faint)'
      }
    }, t.t),
    name: t.model,
    provider: t.note,
    cost: /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-block',
        width: '74px',
        textAlign: 'right'
      }
    }, t.dur),
    context: /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-block',
        width: '62px',
        textAlign: 'right'
      }
    }, t.tok),
    health: {
      tone: t.tone,
      label: t.cost
    },
    alias: t.alias
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--gutter)',
      alignContent: 'start',
      minHeight: 0,
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "trace detail",
    meta: active.id,
    tone: "pane",
    rim: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-md-size)',
      color: 'var(--text-primary)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "zap",
    size: 12,
    color: "var(--accent-route-ink)"
  }), active.model, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: active.tone === 'ok' ? 'ok' : active.tone === 'warn' ? 'warn' : 'fault',
    dot: true
  }, active.tone)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-xl)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(MetricPair, {
    label: "duration",
    value: active.dur
  }), /*#__PURE__*/React.createElement(MetricPair, {
    label: "tokens",
    value: active.tok,
    tone: "telemetry"
  }), /*#__PURE__*/React.createElement(MetricPair, {
    label: "cost",
    value: active.cost
  })), /*#__PURE__*/React.createElement(TokenBudgetBar, {
    label: "context at call",
    used: 316000,
    cached: 96000,
    total: 1100000
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "route"
  }, active.alias), /*#__PURE__*/React.createElement(Badge, {
    tone: "meta"
  }, "cache read 96k"), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, "stream")))), /*#__PURE__*/React.createElement(Panel, {
    title: "stage timings",
    tone: "pane",
    padded: false
  }, [['queue', 12, 'route'], ['prefix cache', 41, 'meta'], ['first token', 188, 'telemetry'], ['stream', 412, 'route']].map(s => /*#__PURE__*/React.createElement("div", {
    key: s[0],
    style: {
      display: 'grid',
      gap: '4px',
      padding: 'var(--space-sm) var(--gutter)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--body-sm-size)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, s[0]), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFeatureSettings: 'var(--mono-features)'
    }
  }, s[1], "ms")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 'var(--track-progress)',
      borderRadius: 'var(--radius-full)',
      background: 'var(--obs-white-08)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      height: '100%',
      width: s[1] / 412 * 100 + '%',
      background: s[2] === 'meta' ? 'var(--accent-meta)' : s[2] === 'telemetry' ? 'var(--accent-telemetry)' : 'var(--accent-route)'
    }
  }))))), /*#__PURE__*/React.createElement(Panel, {
    title: "request",
    tone: "pane"
  }, /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--code-dense-size)',
      lineHeight: 'var(--code-dense-lh)',
      color: 'var(--text-secondary)',
      whiteSpace: 'pre-wrap'
    }
  }, '{ "alias": "@fast", "ceiling": 0.55,\n  "tools": ["read_file","query"],\n  "cache": "prefix", "stream": true }'))));
}
Object.assign(window, {
  TraceLog
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/obsidian-ide/TraceLog.jsx", error: String((e && e.message) || e) }); }

__ds_ns.CommandPalette = __ds_scope.CommandPalette;

__ds_ns.CommandRow = __ds_scope.CommandRow;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Kbd = __ds_scope.Kbd;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.ICON_BASE = __ds_scope.ICON_BASE;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.TreeItem = __ds_scope.TreeItem;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.MetricPair = __ds_scope.MetricPair;

__ds_ns.StatusDot = __ds_scope.StatusDot;

__ds_ns.TokenBudgetBar = __ds_scope.TokenBudgetBar;

})();

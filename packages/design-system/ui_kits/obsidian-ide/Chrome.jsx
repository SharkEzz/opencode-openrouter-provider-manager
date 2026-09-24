const { IconButton, Icon, Badge, StatusDot, MetricPair, Kbd } = window.ObsidianCyberIDEDesignSystem_fe171d;

const RAIL = [
  { id: 'editor', icon: 'file-code', label: 'Explorer' },
  { id: 'mcp', icon: 'plug', label: 'MCP registry' },
  { id: 'providers', icon: 'gauge', label: 'Providers & routing' },
  { id: 'traces', icon: 'history', label: 'Traces' }
];

function ActivityRail({ view, onView }) {
  return (
    <nav style={{ width: '44px', flex: '0 0 44px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-sm) 0', background: 'var(--surface-app)', borderRight: '1px solid var(--hairline)' }}>
      <span style={{ display: 'grid', placeItems: 'center', width: '28px', height: '28px', borderRadius: 'var(--radius)', background: 'var(--accent-route)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 'var(--body-md-size)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>ob</span>
      {RAIL.map((r) => {
        const active = r.id === view;
        return (
          <button
            key={r.id}
            type="button"
            title={r.label}
            aria-label={r.label}
            onClick={() => onView(r.id)}
            style={{
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
            }}
          >
            {active && <span style={{ position: 'absolute', left: '-6px', top: '6px', bottom: '6px', width: '2px', borderRadius: '1px', background: 'var(--accent-route)' }} />}
            <Icon name={r.icon} size={16} />
          </button>
        );
      })}
      <span style={{ flex: '1 1 auto' }} />
      <IconButton label="Settings"><Icon name="settings-2" size={16} /></IconButton>
    </nav>
  );
}

function TitleBar({ tabs, activeTab, onTab, onPalette, theme, onToggleTheme }) {
  return (
    <header style={{ display: 'flex', alignItems: 'stretch', height: 'var(--bar-toolbar)', flex: '0 0 auto', background: 'var(--surface-app)', borderBottom: '1px solid var(--hairline)' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 0, overflow: 'hidden' }}>
        {tabs.map((t) => {
          const active = t.id === activeTab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTab(t.id)}
              style={{
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
              }}
            >
              <Icon name={t.icon || 'file-code'} size={12} />
              {t.name}
              {t.dirty && <span style={{ width: '5px', height: '5px', borderRadius: 'var(--radius-full)', background: 'var(--accent-telemetry-ink)' }} />}
            </button>
          );
        })}
      </div>
      <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, padding: '0 var(--space-lg)' }}>
        <button
          type="button"
          onClick={onPalette}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', height: '24px', width: '100%', maxWidth: '320px', padding: '0 var(--space-sm)', background: 'var(--surface-input)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius)', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: 'var(--body-sm-size)', cursor: 'pointer' }}
        >
          <Icon name="search" size={12} />
          <span>route or open…</span>
          <span style={{ flex: '1 1 auto' }} />
          <Kbd>ctrl+p</Kbd>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '0 var(--gutter)', flex: '0 0 auto' }}>
        <Badge tone="route">@fast</Badge>
        <IconButton label={theme === 'light' ? 'Switch to dark' : 'Switch to light'} onClick={onToggleTheme}><Icon name={theme === 'light' ? 'moon' : 'sun'} size={14} /></IconButton>
        <IconButton label="Split editor"><Icon name="columns-2" size={14} /></IconButton>
        <IconButton label="Terminal" active><Icon name="terminal" size={14} /></IconButton>
      </div>
    </header>
  );
}

function StatusBar({ model }) {
  return (
    <footer style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', height: 'var(--bar-status)', flex: '0 0 auto', padding: '0 var(--gutter)', background: 'var(--surface-app)', borderTop: '1px solid var(--hairline)', fontFamily: 'var(--font-mono)', fontSize: 'var(--label-sm-size)', letterSpacing: 'var(--label-sm-ls)', color: 'var(--text-muted)', fontFeatureSettings: 'var(--mono-features)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Icon name="git-branch" size={11} />feat/router-fallback</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--accent-route-ink)' }}><Icon name="zap" size={11} />{model}</span>
      <StatusDot tone="live" size={5} ping label="82 tok/s" />
      <span style={{ flex: '1 1 auto' }} />
      <span style={{ color: 'var(--accent-meta-ink)' }}>cache 41.2%</span>
      <span>ctx 412k / 1.1M</span>
      <span>ln 184, col 22</span>
      <span>utf-8 · lf · ts</span>
    </footer>
  );
}

Object.assign(window, { ActivityRail, TitleBar, StatusBar, RAIL });

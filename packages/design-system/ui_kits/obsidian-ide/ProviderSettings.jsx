const { Panel, Button, Input, Switch, Icon, Badge, StatusDot, MetricPair, TokenBudgetBar, Kbd } = window.ObsidianCyberIDEDesignSystem_fe171d;

const PROVIDERS = [
  { id: 'anthropic', models: 12, alias: '@fast', price: '$0.11 / $0.55', p50: '412ms', up: '99.98%', tone: 'ok', on: true },
  { id: 'openai', models: 9, alias: '@deep', price: '$0.38 / $1.20', p50: '3,812ms', up: '97.14%', tone: 'warn', on: true },
  { id: 'groq', models: 5, alias: '@cheap', price: '$0.04 / $0.08', p50: '188ms', up: '99.41%', tone: 'ok', on: true },
  { id: 'ollama · local', models: 6, alias: '@local', price: 'free', p50: '1,204ms', up: 'cold', tone: 'idle', on: false }
];

function ProviderRow({ p, on, onToggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', height: 'var(--row-item)', padding: '0 var(--gutter)', borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 'var(--body-md-size)', fontFeatureSettings: 'var(--mono-features)' }}>
      <Switch checked={on} onChange={onToggle} />
      <span style={{ width: '130px', color: on ? 'var(--text-primary)' : 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.id}</span>
      <Badge tone="route">{p.alias}</Badge>
      <span style={{ width: '80px', color: 'var(--text-faint)', fontSize: 'var(--body-sm-size)', whiteSpace: 'nowrap' }}>{p.models} models</span>
      <span style={{ flex: '1 1 auto' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--body-sm-size)', whiteSpace: 'nowrap' }}>{p.price} /M</span>
      <span style={{ width: '72px', textAlign: 'right', color: 'var(--text-muted)', fontSize: 'var(--body-sm-size)', whiteSpace: 'nowrap' }}>{p.p50}</span>
      <span style={{ width: '86px', display: 'flex', justifyContent: 'flex-end' }}><StatusDot tone={p.tone} size={5} label={p.up} /></span>
    </div>
  );
}

function ProviderSettings() {
  const [state, setState] = React.useState(() => Object.fromEntries(PROVIDERS.map((p) => [p.id, p.on])));
  const [ceiling, setCeiling] = React.useState('0.55');
  const [fallback, setFallback] = React.useState(true);
  const [cachePrefix, setCachePrefix] = React.useState(true);
  const [strict, setStrict] = React.useState(false);

  return (
    <div style={{ flex: '1 1 auto', minWidth: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 'var(--gutter)', padding: 'var(--gutter)', overflow: 'auto', background: 'var(--surface-app)' }}>
      <div style={{ display: 'grid', gap: 'var(--gutter)', alignContent: 'start', minWidth: 0 }}>
        <Panel title="providers" meta="4 registered · 3 enabled" tone="pane" padded={false}
          actions={<Button size="sm" variant="secondary" leading={<Icon name="plus" size={11} />}>add key</Button>}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', height: '22px', padding: '0 var(--gutter)', borderBottom: '1px solid var(--hairline)', fontFamily: 'var(--font-mono)', fontSize: 'var(--label-sm-size)', letterSpacing: 'var(--label-sm-ls)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-faint)' }}>
            <span style={{ width: '26px' }} /><span style={{ width: '130px' }}>provider</span><span style={{ width: '80px' }} /><span style={{ flex: '1 1 auto' }} /><span>in / out</span><span style={{ width: '72px', textAlign: 'right' }}>p50</span><span style={{ width: '86px', textAlign: 'right' }}>uptime</span>
          </div>
          {PROVIDERS.map((p) => (
            <ProviderRow key={p.id} p={p} on={state[p.id]} onToggle={(v) => setState((s) => ({ ...s, [p.id]: v }))} />
          ))}
        </Panel>

        <Panel title="routing policy" tone="pane">
          <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
              <label style={{ display: 'grid', gap: '4px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--label-sm-size)', letterSpacing: 'var(--label-sm-ls)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-faint)' }}>cost ceiling · $/M out</span>
                <Input size="sm" style={{ width: '120px' }} value={ceiling} onChange={(e) => setCeiling(e.target.value)} />
              </label>
              <Switch checked={fallback} onChange={setFallback} label="auto-fallback" hint="retry 429 / p50 > 2.5s on next alias" />
              <Switch checked={cachePrefix} onChange={setCachePrefix} label="prompt prefix cache" hint="reuse system + tool preamble" />
              <Switch checked={strict} onChange={setStrict} label="strict ceiling" hint="fail instead of overspending" />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <Badge tone="route">@fast → anthropic</Badge>
              <Badge tone="route">@deep → openai</Badge>
              <Badge tone="route">@cheap → groq</Badge>
              <Badge tone="neutral">@local → ollama</Badge>
            </div>
          </div>
        </Panel>
      </div>

      <div style={{ display: 'grid', gap: 'var(--gutter)', alignContent: 'start' }}>
        <Panel title="spend · 24h" tone="pane">
          <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-xl)' }}>
              <MetricPair label="spend" value="$41.80" tone="route" />
              <MetricPair label="saved by cache" value="$18.22" tone="meta" />
            </div>
            <TokenBudgetBar label="monthly budget" used={418} cached={0} total={600} showValues={false} />
            <div style={{ display: 'flex', gap: 'var(--space-xl)' }}>
              <MetricPair label="requests" value="12,884" />
              <MetricPair label="tok/s avg" value="82" tone="telemetry" />
            </div>
          </div>
        </Panel>
        <Panel title="keys" meta="3 stored" tone="pane" padded={false}>
          {[['anthropic', 'sk-ant-••••4f21', 'ok'], ['openai', 'sk-••••9ab0', 'ok'], ['github', 'ghp_••••11c4', 'warn']].map((k) => (
            <div key={k[0]} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', height: 'var(--row-dense)', padding: '0 var(--gutter)', borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 'var(--body-sm-size)' }}>
              <span style={{ width: '80px', color: 'var(--text-secondary)' }}>{k[0]}</span>
              <span style={{ flex: '1 1 auto', color: 'var(--text-faint)' }}>{k[1]}</span>
              <StatusDot tone={k[2]} size={5} />
            </div>
          ))}
        </Panel>
        <Panel title="hotkeys" tone="pane">
          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
            {[['route picker', 'ctrl+p'], ['reroute last', 'ctrl+alt+r'], ['evict cache', 'ctrl+shift+k'], ['toggle telemetry', 'ctrl+t']].map((h) => (
              <div key={h[0]} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', fontFamily: 'var(--font-mono)', fontSize: 'var(--body-sm-size)', color: 'var(--text-muted)' }}>
                <span>{h[0]}</span><span style={{ flex: '1 1 auto' }} /><Kbd>{h[1]}</Kbd>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

Object.assign(window, { ProviderSettings });

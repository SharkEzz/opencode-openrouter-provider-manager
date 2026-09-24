const { Panel, Button, IconButton, Input, Icon, Badge, StatusDot, MetricPair, TokenBudgetBar, CommandRow } = window.ObsidianCyberIDEDesignSystem_fe171d;

const TRACES = [
  { id: 't1', t: '12:04:52', model: 'groq/llama-4-70b', alias: '@cheap', dur: '188ms', tok: '1,204', cost: '$0.0004', tone: 'ok', note: 'fallback from openai' },
  { id: 't2', t: '12:04:52', model: 'openai/gpt-5.2-turbo', alias: '@deep', dur: '3,812ms', tok: '0', cost: '$0.0000', tone: 'warn', note: 'p50 breach · abandoned' },
  { id: 't3', t: '12:04:51', model: 'anthropic/claude-sonnet-4.6', alias: '@fast', dur: '412ms', tok: '6,188', cost: '$0.0034', tone: 'ok', note: 'cache hit 96k' },
  { id: 't4', t: '12:03:12', model: 'anthropic/claude-sonnet-4.6', alias: '@fast', dur: '—', tok: '0', cost: '$0.0000', tone: 'fault', note: '429 rate limit · 3 retries' },
  { id: 't5', t: '12:02:44', model: 'ollama/qwen3-coder:32b', alias: '@local', dur: '1,204ms', tok: '812', cost: 'free', tone: 'ok', note: 'offline completion' }
];

function TraceLog() {
  const [sel, setSel] = React.useState('t3');
  const [q, setQ] = React.useState('');
  const active = TRACES.find((t) => t.id === sel) || TRACES[0];

  return (
    <div style={{ flex: '1 1 auto', minWidth: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 'var(--gutter)', padding: 'var(--gutter)', overflow: 'hidden', background: 'var(--surface-app)' }}>
      <Panel title="traces" meta="last 5 of 12,884" tone="pane" padded={false} style={{ minHeight: 0 }}
        actions={<><Input size="sm" bare style={{ width: '180px' }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="filter by model or alias…" leading={<Icon name="search" size={12} />} /><IconButton label="Export" size="sm"><Icon name="download" size={12} /></IconButton></>}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', height: '22px', padding: '0 var(--gutter)', borderBottom: '1px solid var(--hairline)', fontFamily: 'var(--font-mono)', fontSize: 'var(--label-sm-size)', letterSpacing: 'var(--label-sm-ls)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-faint)' }}>
          <span style={{ width: '58px' }}>time</span><span style={{ flex: '1 1 auto' }}>model</span><span style={{ width: '74px', textAlign: 'right' }}>dur</span><span style={{ width: '62px', textAlign: 'right' }}>tokens</span><span style={{ width: '66px', textAlign: 'right' }}>cost</span><span style={{ width: '56px', textAlign: 'right' }}>alias</span>
        </div>
        {TRACES.filter((t) => (t.model + t.alias).includes(q)).map((t) => (
          <CommandRow
            key={t.id}
            dense
            selected={t.id === sel}
            onClick={() => setSel(t.id)}
            leading={<span style={{ width: '58px', fontSize: 'var(--body-sm-size)', color: t.id === sel ? 'inherit' : 'var(--text-faint)' }}>{t.t}</span>}
            name={t.model}
            provider={t.note}
            cost={<span style={{ display: 'inline-block', width: '74px', textAlign: 'right' }}>{t.dur}</span>}
            context={<span style={{ display: 'inline-block', width: '62px', textAlign: 'right' }}>{t.tok}</span>}
            health={{ tone: t.tone, label: t.cost }}
            alias={t.alias}
          />
        ))}
      </Panel>

      <div style={{ display: 'grid', gap: 'var(--gutter)', alignContent: 'start', minHeight: 0, overflow: 'auto' }}>
        <Panel title="trace detail" meta={active.id} tone="pane" rim>
          <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: 'var(--body-md-size)', color: 'var(--text-primary)' }}>
              <Icon name="zap" size={12} color="var(--accent-route-ink)" />{active.model}
              <span style={{ flex: '1 1 auto' }} />
              <Badge tone={active.tone === 'ok' ? 'ok' : active.tone === 'warn' ? 'warn' : 'fault'} dot>{active.tone}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
              <MetricPair label="duration" value={active.dur} />
              <MetricPair label="tokens" value={active.tok} tone="telemetry" />
              <MetricPair label="cost" value={active.cost} />
            </div>
            <TokenBudgetBar label="context at call" used={316000} cached={96000} total={1100000} />
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <Badge tone="route">{active.alias}</Badge>
              <Badge tone="meta">cache read 96k</Badge>
              <Badge tone="neutral">stream</Badge>
            </div>
          </div>
        </Panel>
        <Panel title="stage timings" tone="pane" padded={false}>
          {[['queue', 12, 'route'], ['prefix cache', 41, 'meta'], ['first token', 188, 'telemetry'], ['stream', 412, 'route']].map((s) => (
            <div key={s[0]} style={{ display: 'grid', gap: '4px', padding: 'var(--space-sm) var(--gutter)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', fontFamily: 'var(--font-mono)', fontSize: 'var(--body-sm-size)', color: 'var(--text-muted)' }}>
                <span>{s[0]}</span><span style={{ flex: '1 1 auto' }} /><span style={{ fontFeatureSettings: 'var(--mono-features)' }}>{s[1]}ms</span>
              </div>
              <div style={{ height: 'var(--track-progress)', borderRadius: 'var(--radius-full)', background: 'var(--obs-white-08)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: (s[1] / 412) * 100 + '%', background: s[2] === 'meta' ? 'var(--accent-meta)' : s[2] === 'telemetry' ? 'var(--accent-telemetry)' : 'var(--accent-route)' }} />
              </div>
            </div>
          ))}
        </Panel>
        <Panel title="request" tone="pane">
          <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 'var(--code-dense-size)', lineHeight: 'var(--code-dense-lh)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{'{ "alias": "@fast", "ceiling": 0.55,\n  "tools": ["read_file","query"],\n  "cache": "prefix", "stream": true }'}</pre>
        </Panel>
      </div>
    </div>
  );
}

Object.assign(window, { TraceLog });

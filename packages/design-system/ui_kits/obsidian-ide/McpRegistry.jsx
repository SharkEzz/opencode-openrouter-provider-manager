const { Panel, Button, IconButton, Input, Switch, Icon, Badge, StatusDot, MetricPair, TreeItem, Kbd } = window.ObsidianCyberIDEDesignSystem_fe171d;

const SERVERS = [
  { id: 'filesystem', status: 'ok', tools: ['read_file', 'write_file', 'list_directory', 'search_files'], transport: 'stdio', calls: '2,184', p50: '8ms' },
  { id: 'postgres', status: 'ok', tools: ['query', 'schema', 'explain'], transport: 'stdio', calls: '612', p50: '41ms' },
  { id: 'github', status: 'warn', tools: ['get_tree', 'read_files', 'compare'], transport: 'http', calls: '96', p50: '318ms' },
  { id: 'stripe', status: 'fault', tools: [], transport: 'http', calls: '0', p50: '—' }
];

function McpRegistry() {
  const [open, setOpen] = React.useState({ filesystem: true });
  const [sel, setSel] = React.useState('read_file');
  const [q, setQ] = React.useState('');
  const [autoConnect, setAutoConnect] = React.useState(true);

  return (
    <div style={{ flex: '1 1 auto', display: 'flex', minHeight: 0, minWidth: 0, background: 'var(--surface-app)' }}>
      <aside style={{ width: '320px', flex: '0 0 320px', display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: '1px solid var(--hairline)', background: 'var(--surface-docked)' }}>
        <div style={{ padding: 'var(--gutter)', borderBottom: '1px solid var(--hairline)', display: 'grid', gap: 'var(--space-md)' }}>
          <Input size="sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="filter servers…" leading={<Icon name="search" size={12} />} />
          <Switch checked={autoConnect} onChange={setAutoConnect} label="auto-connect on open" />
        </div>
        <div style={{ flex: '1 1 auto', overflow: 'auto' }}>
          {SERVERS.filter((s) => s.id.includes(q)).map((s) => (
            <TreeItem
              key={s.id}
              label={s.id}
              expanded={s.tools.length ? !!open[s.id] : undefined}
              onToggle={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))}
              status={s.status}
              leading={<Icon name={s.transport === 'stdio' ? 'terminal' : 'plug'} size={12} />}
              meta={s.tools.length ? s.tools.length + ' tools' : 'offline'}
            >
              {s.tools.map((t) => (
                <TreeItem key={t} depth={1} label={t} selected={sel === t} onToggle={() => setSel(t)} leading={<Icon name="box" size={11} />} />
              ))}
            </TreeItem>
          ))}
        </div>
        <div style={{ padding: 'var(--gutter)', borderTop: '1px solid var(--hairline)' }}>
          <Button variant="secondary" size="sm" fullWidth leading={<Icon name="plus" size={11} />}>add server</Button>
        </div>
      </aside>

      <main style={{ flex: '1 1 auto', minWidth: 0, display: 'grid', gap: 'var(--gutter)', gridTemplateRows: 'auto auto 1fr', padding: 'var(--gutter)', overflow: 'auto' }}>
        <Panel title="filesystem" meta="stdio · npx @mcp/filesystem" tone="pane" rim
          actions={<><Button size="sm" variant="telemetry" leading={<Icon name="refresh-cw" size={11} />}>reconnect</Button><Button size="sm" variant="danger">disable</Button></>}>
          <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
            <MetricPair label="status" value={<StatusDot tone="ok" ping label="connected 4h 12m" />} />
            <MetricPair label="calls" value="2,184" />
            <MetricPair label="p50" value="8" unit="ms" />
            <MetricPair label="tokens returned" value="188.4k" tone="meta" />
            <MetricPair label="errors" value="0.00%" tone="ok" />
          </div>
        </Panel>

        <Panel title={'tool · ' + sel} meta="schema" tone="pane">
          <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 'var(--code-dense-size)', lineHeight: 'var(--code-dense-lh)', color: 'var(--text-secondary)' }}>{'{\n  "path":   string    // absolute or workspace-relative\n  "offset": number?   // 0-indexed line start\n  "limit":  number?   // max 2000 lines\n}'}</pre>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
            <Badge tone="telemetry" dot>1,204 calls</Badge>
            <Badge tone="meta">avg 1.2k tok</Badge>
            <Badge tone="neutral">read-only</Badge>
          </div>
        </Panel>

        <Panel title="call log" meta="last 6" tone="pane" padded={false}>
          {[['12:04:51', 'read_file', 'src/router/pick.ts', '6ms', 'ok'],
            ['12:04:50', 'search_files', 'ceiling', '18ms', 'ok'],
            ['12:04:44', 'query', 'select * from routes limit 20', '41ms', 'ok'],
            ['12:04:31', 'get_tree', 'obsidian/router@main', '318ms', 'slow'],
            ['12:03:58', 'read_file', 'obsidian.config.jsonc', '4ms', 'ok'],
            ['12:03:12', 'charge', 'stripe', '—', 'fault']].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', height: 'var(--row-dense)', padding: '0 var(--gutter)', borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 'var(--body-sm-size)', fontFeatureSettings: 'var(--mono-features)' }}>
              <span style={{ color: 'var(--text-faint)' }}>{r[0]}</span>
              <span style={{ width: '104px', color: 'var(--accent-route-ink)' }}>{r[1]}</span>
              <span style={{ flex: '1 1 auto', minWidth: 0, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r[2]}</span>
              <span style={{ color: 'var(--text-muted)' }}>{r[3]}</span>
              <span style={{ width: '54px', textAlign: 'right', color: r[4] === 'ok' ? 'var(--status-ok)' : r[4] === 'slow' ? 'var(--status-warn)' : 'var(--status-fault)' }}>{r[4]}</span>
            </div>
          ))}
        </Panel>
      </main>
    </div>
  );
}

Object.assign(window, { McpRegistry });

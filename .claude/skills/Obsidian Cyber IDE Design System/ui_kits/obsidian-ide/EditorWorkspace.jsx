const { Panel, IconButton, Icon, Badge, StatusDot, TokenBudgetBar, MetricPair, TreeItem, Button } = window.ObsidianCyberIDEDesignSystem_fe171d;

const FILES = [
  { label: 'src', depth: 0, dir: true, kids: [
    { label: 'router', depth: 1, dir: true, kids: [
      { label: 'pick.ts', depth: 2, active: true, meta: '184' },
      { label: 'fallback.ts', depth: 2, meta: '96' },
      { label: 'pricing.ts', depth: 2, meta: '52' }
    ] },
    { label: 'mcp', depth: 1, dir: true, kids: [
      { label: 'registry.ts', depth: 2, meta: '210' },
      { label: 'transport.ts', depth: 2, meta: '88' }
    ] },
    { label: 'index.ts', depth: 1, meta: '31' }
  ] },
  { label: 'obsidian.config.jsonc', depth: 0, meta: '44' }
];

const CODE = [
  [184, [['kw', 'export async function '], ['fn', 'pick'], ['p', '(req: '], ['ty', 'RouteRequest'], ['p', ') {']]],
  [185, [['p', '  '], ['kw', 'const '], ['p', 'candidates = registry.'], ['fn', 'eligible'], ['p', '(req.capabilities);']]],
  [186, [['p', '  '], ['cm', '// ceiling is $/M output tokens, not per request']]],
  [187, [['p', '  '], ['kw', 'const '], ['p', 'ceiling = req.budget?.ceiling ?? '], ['nu', '0.55'], ['p', ';']]],
  [188, [['p', '']]],
  [189, [['p', '  '], ['kw', 'for '], ['p', '('], ['kw', 'const '], ['p', 'c '], ['kw', 'of '], ['p', 'candidates) {']]],
  [190, [['p', '    '], ['kw', 'if '], ['p', '(c.price.out > ceiling) '], ['kw', 'continue'], ['p', ';']]],
  [191, [['p', '    '], ['kw', 'if '], ['p', '(c.health.p50 > '], ['nu', '2_500'], ['p', ') { telemetry.'], ['fn', 'flag'], ['p', '(c.id, '], ['st', '"degraded"'], ['p', '); '], ['kw', 'continue'], ['p', '; }']]],
  [192, [['p', '    '], ['kw', 'return '], ['p', '{ model: c.id, alias: '], ['st', '"@fast"'], ['p', ', cached: cache.'], ['fn', 'peek'], ['p', '(req) };']]],
  [193, [['p', '  }']]],
  [194, [['p', '']]],
  [195, [['p', '  '], ['kw', 'throw new '], ['ty', 'NoRouteError'], ['p', '('], ['st', '"no provider under ceiling"'], ['p', ');']]],
  [196, [['p', '}']]]
];

const INK = { kw: 'var(--syntax-keyword)', fn: 'var(--syntax-fn)', st: 'var(--syntax-string)', nu: 'var(--syntax-number)', cm: 'var(--syntax-comment)', ty: 'var(--syntax-type)', p: 'var(--syntax-plain)' };

function FileTree({ nodes, open, toggle, selected, onSelect }) {
  return nodes.map((n) => (
    <TreeItem
      key={n.label + n.depth}
      label={n.label}
      depth={n.depth}
      expanded={n.dir ? !!open[n.label] : undefined}
      onToggle={() => (n.dir ? toggle(n.label) : onSelect(n.label))}
      selected={selected === n.label}
      leading={<Icon name={n.dir ? (open[n.label] ? 'folder-open' : 'folder') : 'file-code'} size={12} />}
      meta={n.meta}
    >
      {n.kids && <FileTree nodes={n.kids} open={open} toggle={toggle} selected={selected} onSelect={onSelect} />}
    </TreeItem>
  ));
}

function EditorWorkspace({ onPalette }) {
  const [open, setOpen] = React.useState({ src: true, router: true, mcp: false });
  const [sel, setSel] = React.useState('pick.ts');
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div style={{ flex: '1 1 auto', display: 'flex', minHeight: 0, minWidth: 0 }}>
      <aside style={{ width: 'var(--sidebar-width)', flex: '0 0 var(--sidebar-width)', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--surface-docked)', borderRight: '1px solid var(--hairline)' }}>
        <Panel title="explorer" meta="router" padded={false} tone="docked" style={{ flex: '1 1 auto', minHeight: 0, border: 'none', borderRadius: 0 }}
          actions={<><IconButton label="New file" size="sm"><Icon name="file-plus" size={12} /></IconButton><IconButton label="Collapse" size="sm"><Icon name="chevrons-down-up" size={12} /></IconButton></>}>
          <FileTree nodes={FILES} open={open} toggle={toggle} selected={sel} onSelect={setSel} />
        </Panel>
        <div style={{ flex: '0 0 auto', borderTop: '1px solid var(--hairline)', padding: 'var(--gutter)', display: 'grid', gap: 'var(--space-md)' }}>
          <TokenBudgetBar label="context" used={412000} cached={96000} total={1100000} />
          <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
            <MetricPair label="p50" value="412" unit="ms" />
            <MetricPair label="cache" value="41.2%" tone="meta" />
          </div>
        </div>
      </aside>

      <main style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--surface-canvas)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', height: '26px', flex: '0 0 auto', padding: '0 var(--gutter)', borderBottom: '1px solid var(--hairline)', fontFamily: 'var(--font-mono)', fontSize: 'var(--label-sm-size)', letterSpacing: 'var(--label-sm-ls)', color: 'var(--text-faint)' }}>
          <span>src</span><Icon name="chevron-right" size={10} /><span>router</span><Icon name="chevron-right" size={10} /><span style={{ color: 'var(--text-secondary)' }}>pick.ts</span>
          <span style={{ flex: '1 1 auto' }} />
          <Badge tone="telemetry" dot>inline route</Badge>
        </div>
        <div style={{ flex: '1 1 auto', overflow: 'auto', padding: 'var(--space-sm) 0', fontFamily: 'var(--font-mono)', fontSize: 'var(--code-dense-size)', lineHeight: 'var(--code-dense-lh)', letterSpacing: 'var(--code-dense-ls)', fontFeatureSettings: 'var(--mono-features)' }}>
          {CODE.map(([ln, parts], i) => (
            <div key={ln} style={{ display: 'flex', gap: 'var(--space-md)', padding: '0 var(--gutter)', background: i === 8 ? 'var(--obs-blue-12)' : 'transparent', boxShadow: i === 8 ? 'inset 2px 0 0 var(--accent-route)' : 'none' }}>
              <span style={{ width: '30px', textAlign: 'right', color: 'var(--syntax-gutter)', flex: '0 0 auto', userSelect: 'none' }}>{ln}</span>
              <span style={{ whiteSpace: 'pre', minWidth: 0 }}>
                {parts.map((p, j) => <span key={j} style={{ color: INK[p[0]] }}>{p[1]}</span>)}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 'var(--space-md)', padding: '4px var(--gutter) 0', color: 'var(--text-faint)' }}>
            <span style={{ width: '30px' }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '2px 6px', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)' }}>
              <Icon name="sparkles" size={11} color="var(--accent-telemetry-ink)" />
              inline completion · 3 candidates
              <button type="button" onClick={onPalette} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-route-ink)', fontFamily: 'var(--font-mono)', fontSize: 'inherit', cursor: 'pointer' }}>reroute</button>
            </span>
          </div>
        </div>
        <div style={{ flex: '0 0 auto', height: '112px', borderTop: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', background: 'var(--surface-app)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', height: '26px', padding: '0 var(--gutter)', borderBottom: '1px solid var(--hairline)', fontFamily: 'var(--font-mono)', fontSize: 'var(--label-sm-size)', letterSpacing: 'var(--label-sm-ls)', textTransform: 'uppercase' }}>
            <span style={{ color: 'var(--text-primary)', boxShadow: 'inset 0 -1px 0 var(--accent-telemetry-ink)' }}>terminal</span>
            <span style={{ color: 'var(--text-faint)' }}>router log</span>
            <span style={{ color: 'var(--text-faint)' }}>problems 2</span>
            <span style={{ flex: '1 1 auto' }} />
            <IconButton label="Clear" size="sm"><Icon name="trash-2" size={12} /></IconButton>
          </div>
          <div style={{ flex: '1 1 auto', overflow: 'auto', padding: '4px 0', fontFamily: 'var(--font-mono)', fontSize: 'var(--body-sm-size)', lineHeight: '18px', fontFeatureSettings: 'var(--mono-features)' }}>
            {[['12:04:48', 'route', 'anthropic/claude-sonnet-4.6', '412ms', 'ok'],
              ['12:04:51', 'cache', 'prefix hit 96,412 tok', '—', 'hit'],
              ['12:04:52', 'route', 'openai/gpt-5.2-turbo', '3,812ms', 'degraded'],
              ['12:04:52', 'fallback', 'groq/llama-4-70b @cheap', '188ms', 'ok']].map((r) => (
              <div key={r[0] + r[1]} style={{ display: 'flex', gap: 'var(--space-md)', padding: '0 var(--gutter)', color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--text-faint)' }}>{r[0]}</span>
                <span style={{ width: '64px', color: 'var(--accent-route-ink)' }}>{r[1]}</span>
                <span style={{ flex: '1 1 auto', minWidth: 0, color: 'var(--text-secondary)' }}>{r[2]}</span>
                <span>{r[3]}</span>
                <span style={{ width: '64px', textAlign: 'right', color: r[4] === 'ok' ? 'var(--status-ok)' : r[4] === 'hit' ? 'var(--accent-meta-ink)' : 'var(--status-warn)' }}>{r[4]}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <aside style={{ width: 'var(--inspector-width)', flex: '0 0 var(--inspector-width)', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--surface-docked)', borderLeft: '1px solid var(--hairline)', overflow: 'auto' }}>
        <Panel title="active route" tone="docked" style={{ flex: '0 0 auto', border: 'none', borderRadius: 0, borderBottom: '1px solid var(--hairline)' }}>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: 'var(--body-md-size)', color: 'var(--text-primary)' }}>
              <Icon name="zap" size={12} color="var(--accent-route-ink)" />claude-sonnet-4.6
              <span style={{ flex: '1 1 auto' }} />
              <Badge tone="route">@fast</Badge>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
              <MetricPair label="in / out" value="$0.11 / $0.55" unit="/M" tone="telemetry" />
              <MetricPair label="ctx" value="1.1M" />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <Badge tone="ok" dot>99.98%</Badge>
              <Badge tone="meta">cache 41%</Badge>
              <Badge tone="neutral">us-east</Badge>
            </div>
            <Button variant="secondary" size="sm" fullWidth onClick={onPalette} leading={<Icon name="refresh-cw" size={11} />}>change route</Button>
          </div>
        </Panel>
        <Panel title="context" meta="4 sources" tone="docked" padded={false} style={{ flex: '0 0 auto', border: 'none', borderRadius: 0, borderBottom: '1px solid var(--hairline)' }}>
          <TreeItem label="src/router/pick.ts" status="ok" leading={<Icon name="file-code" size={12} />} meta="6.1k" />
          <TreeItem label="obsidian.config.jsonc" status="ok" leading={<Icon name="file-code" size={12} />} meta="1.4k" />
          <TreeItem label="registry snapshot" status="ok" leading={<Icon name="database" size={12} />} meta="88k" />
          <TreeItem label="conversation" leading={<Icon name="history" size={12} />} meta="316k" />
        </Panel>
        <Panel title="mcp" meta="3 connected" tone="docked" padded={false} style={{ flex: '0 0 auto', border: 'none', borderRadius: 0 }}>
          <TreeItem label="filesystem" status="ok" leading={<Icon name="plug" size={12} />} meta="14 tools" />
          <TreeItem label="postgres" status="ok" leading={<Icon name="database" size={12} />} meta="6 tools" />
          <TreeItem label="github" status="warn" leading={<Icon name="git-branch" size={12} />} meta="auth 2d" />
          <TreeItem label="stripe" status="fault" leading={<Icon name="circle-stop" size={12} />} meta="offline" />
        </Panel>
      </aside>
    </div>
  );
}

Object.assign(window, { EditorWorkspace });

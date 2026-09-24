const { CommandPalette, Badge, Icon, Kbd } = window.ObsidianCyberIDEDesignSystem_fe171d;

const MODELS = [
  { id: 'a', name: 'claude-sonnet-4.6', provider: 'anthropic', icon: 'zap', cost: '$0.11 in / $0.55 out /M', context: 'ctx 1.1M', health: { tone: 'ok', label: '99.9%' }, alias: '@fast', group: 'frontier' },
  { id: 'b', name: 'claude-opus-4.2', provider: 'anthropic', icon: 'zap', cost: '$0.90 in / $4.50 out /M', context: 'ctx 500k', health: { tone: 'ok', label: '99.8%' }, alias: '@max', group: 'frontier' },
  { id: 'c', name: 'gpt-5.2-turbo', provider: 'openai', icon: 'box', cost: '$0.38 in / $1.20 out /M', context: 'ctx 400k', health: { tone: 'warn', label: '97.1%' }, alias: '@deep', group: 'frontier' },
  { id: 'd', name: 'llama-4-70b', provider: 'groq', icon: 'gauge', cost: '$0.04 in / $0.08 out /M', context: 'ctx 128k', health: { tone: 'ok', label: '99.4%' }, alias: '@cheap', group: 'fast' },
  { id: 'e', name: 'mixtral-8x22b', provider: 'groq', icon: 'gauge', cost: '$0.06 in / $0.14 out /M', context: 'ctx 64k', health: { tone: 'ok', label: '99.2%' }, alias: '', group: 'fast' },
  { id: 'f', name: 'qwen3-coder:32b', provider: 'ollama · local', icon: 'terminal', cost: 'free', context: 'ctx 64k', health: { tone: 'idle', label: 'cold' }, alias: '@local', group: 'local' }
];

function RoutePalette({ onClose, onRoute, selected }) {
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(selected || 'a');
  const match = MODELS.filter((m) => (m.name + m.provider + m.alias).toLowerCase().includes(q.toLowerCase()));
  const groups = ['frontier', 'fast', 'local'].map((g) => ({
    label: g,
    meta: String(match.filter((m) => m.group === g).length),
    items: match.filter((m) => m.group === g).map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      leading: <Icon name={m.icon} size={12} />,
      cost: m.cost,
      context: m.context,
      health: m.health,
      alias: m.alias,
      badges: m.group === 'local' ? <Badge tone="meta" style={{ marginLeft: '2px' }}>gguf</Badge> : null
    }))
  })).filter((g) => g.items.length);

  return (
    <div
      onClick={onClose}
      style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(0,0,0,.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 'calc(var(--margin) * 4) var(--margin) var(--margin)' }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 'var(--palette-max)' }}>
        <CommandPalette
          query={q}
          onQueryChange={setQ}
          placeholder="route to model…"
          groups={groups}
          selectedId={sel}
          onSelect={(id) => { setSel(id); const m = MODELS.find((x) => x.id === id); onRoute(m); }}
          footer={<><span>↑↓ navigate</span><span>⏎ route</span><span>⌥⏎ pin alias</span><span style={{ flex: '1 1 auto' }} /><span>{match.length} of 38 models</span></>}
        />
      </div>
    </div>
  );
}

Object.assign(window, { RoutePalette });

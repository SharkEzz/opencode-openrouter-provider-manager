import { useEffect, useRef, useState } from 'react';
import { cn } from 'cn';
import { Badge } from '@/components/ds';
import { useReducedMotion } from '@/lib/motion';

// Formatting copied from packages/plugin/src/format.ts, so the rows read like the real picker.
const price = (value: number) =>
  `$${value < 1 ? value.toFixed(3).replace(/0$/, '') : value.toFixed(2)}`;
const tokens = (value: number) =>
  value >= 1_000_000 ? `${+(value / 1_000_000).toFixed(1)}M` : `${Math.round(value / 1000)}k`;

type Row = {
  provider: string;
  tag: string;
  input: number;
  output: number;
  context: number;
  quantization?: string;
  uptime: number;
  fast?: boolean;
};

// Illustrative endpoints, not live data.
const ROWS: Row[] = [
  {
    provider: 'DeepInfra',
    tag: 'deepinfra/fp8',
    input: 0.075,
    output: 0.28,
    context: 202_752,
    quantization: 'fp8',
    uptime: 99.6,
  },
  {
    provider: 'Together',
    tag: 'together/fp8',
    input: 0.09,
    output: 0.32,
    context: 202_752,
    quantization: 'fp8',
    uptime: 99.9,
  },
  {
    provider: 'Groq',
    tag: 'groq',
    input: 0.12,
    output: 0.45,
    context: 131_072,
    uptime: 98.7,
    fast: true,
  },
  {
    provider: 'Chutes',
    tag: 'chutes/fp8',
    input: 0.05,
    output: 0.2,
    context: 202_752,
    quantization: 'fp8',
    uptime: 93.1,
  },
  { provider: 'Z.AI', tag: 'z-ai', input: 0.1, output: 0.4, context: 202_752, uptime: 99.2 },
];
const degraded = (row: Row) => row.uptime < 95;
/** Rows the selection visits: Auto (-1) and the healthy endpoints. */
const STOPS = [0, 1, 2, 4, -1];

const TRANSCRIPT = [
  '> refactor the pinning helpers into src/pin.ts',
  '  read src/model.ts · 42 lines',
  '  read tests/pin.test.ts · 118 lines',
  '  edit src/pin.ts +36 −12',
  '$ pnpm test',
  '  ✓ 28 passed',
  '> /provider',
];

/** Decorative HTML replica of the /provider picker in an OpenCode window (hidden from AT). */
export function HeroPicker() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [stop, setStop] = useState(0);

  // Walk the selection while the window is on screen and the tab visible.
  useEffect(() => {
    const node = ref.current;
    if (reduced || !node) return undefined;
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
    });
    observer.observe(node);
    const timer = setInterval(() => {
      if (visible && !document.hidden) setStop((s) => (s + 1) % STOPS.length);
    }, 2500);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [reduced]);

  const selected = STOPS[stop] ?? 0;
  const pinned = ROWS[selected];

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative overflow-hidden rounded-lg border border-hairline bg-surface-docked text-left shadow-[var(--shadow-float)]">
      <div className="label-sm flex h-9 items-center gap-3 border-b border-hairline px-3 text-text-faint normal-case">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-fault/70" />
          <span className="size-2.5 rounded-full bg-warn/70" />
          <span className="size-2.5 rounded-full bg-ok/70" />
        </span>
        <span className="truncate">~/code/app — opencode</span>
        <span className="flex-1" />
        <span className="hidden sm:inline">z-ai/glm-5.3-flash</span>
        <span className="hidden text-meta-ink sm:inline">cache 94%</span>
      </div>

      <div className="relative grid h-[380px] grid-cols-1 lg:grid-cols-[1fr_220px]">
        <div className="code-dense grid content-start gap-1 p-4 text-text-faint opacity-60 blur-[1.5px]">
          {TRANSCRIPT.map((line) => (
            <span key={line} className="truncate whitespace-pre">
              {line}
            </span>
          ))}
        </div>
        <div className="code-dense hidden content-start gap-2 border-l border-hairline p-4 text-text-faint opacity-60 blur-[1.5px] lg:grid">
          <span className="label-sm text-text-muted">session</span>
          <span>tokens 153.7k</span>
          <span>cost $0.10</span>
          <span>endpoint · auto</span>
        </div>

        <div className="hero-palette absolute inset-x-3 top-6 mx-auto max-w-[640px] overflow-hidden rounded-lg sm:inset-x-6">
          <div className="flex h-10 items-center gap-2 px-3">
            <span className="label-sm text-route-ink normal-case">OpenRouter: choose endpoint</span>
            <span className="body-sm hidden truncate text-text-faint sm:inline">
              · z-ai/glm-5.3-flash
            </span>
            <span className="flex-1" />
            <span className="label-sm rounded-sm border border-hairline px-1.5 text-text-faint normal-case">
              esc
            </span>
          </div>
          <div className="body-sm mx-3 flex h-9 items-center rounded-md border border-border-strong bg-surface-input px-3 text-text-faint">
            Filter providers…
            <span className="flex-1" />
            <span className="hidden sm:inline">6 routes</span>
          </div>
          <ul className="body-sm grid grid-cols-[minmax(0,1fr)] gap-px p-2">
            <PaletteRow selected={selected === -1}>
              <span className="font-semibold">Auto</span>
              <span className="min-w-0 flex-1 truncate opacity-70">
                Default OpenRouter routing (price, availability, fallbacks)
              </span>
            </PaletteRow>
            {ROWS.map((row, index) => (
              <PaletteRow key={row.tag} selected={selected === index}>
                <span className="w-20 shrink-0 font-semibold">{row.provider}</span>
                <span className="min-w-0 flex-1 truncate">
                  {price(row.input)} in / {price(row.output)} out /M
                  <span className="hidden opacity-70 sm:inline">
                    {' '}
                    · ctx {tokens(row.context)}
                    {row.quantization && ` · ${row.quantization}`} · uptime {row.uptime.toFixed(1)}%
                  </span>
                </span>
                {degraded(row) && <Badge tone="warn">degraded</Badge>}
                <span
                  className={cn(
                    'hidden shrink-0 sm:inline',
                    selected !== index && (row.fast ? 'text-telemetry-ink' : 'text-text-faint'),
                  )}>
                  {row.tag}
                </span>
              </PaletteRow>
            ))}
          </ul>
          <div className="label-sm flex h-8 items-center gap-2 border-t border-hairline px-3 text-text-faint normal-case">
            <span className="truncate">
              {pinned
                ? `pin ${pinned.tag} · ${price(pinned.input)}/${price(pinned.output)}`
                : 'auto · openrouter routing'}
            </span>
            <span className="flex-1" />
            <span className="hidden sm:inline">↑↓ select · ⏎ pin</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaletteRow({ selected, children }: { selected: boolean; children: React.ReactNode }) {
  return (
    <li
      className={cn(
        'flex h-8 min-w-0 items-center gap-2 rounded-md px-2 whitespace-nowrap transition-[background-color,color,box-shadow] duration-[140ms] ease-out',
        selected
          ? 'bg-route font-semibold text-text-on-accent shadow-[inset_0_0_0_1px_var(--accent-telemetry-ink),var(--glow-cyan)]'
          : 'text-text-secondary',
      )}>
      {children}
      <span
        className={cn(
          'size-1.5 shrink-0 rounded-full transition-colors duration-[140ms] ease-out',
          selected ? 'bg-telemetry-ink' : 'bg-transparent',
        )}
      />
    </li>
  );
}

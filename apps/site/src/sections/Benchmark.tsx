import { Activity, lazy, Suspense, useDeferredValue, useState } from 'react';
import { Badge, MetricPair, Panel } from '@/components/ds';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { blendedPerM, type Profile, STRATEGIES, type StrategyId, useData } from '@/lib/data';
import { change, ms, pct, shortModel, tokens, tps, usd } from '@/lib/format';
import { EndpointMatrix } from './EndpointMatrix';

// Recharts is the heaviest dependency: load the chart after the rest of the page.
const TradeoffChart = lazy(() =>
  import('./TradeoffChart').then((m) => ({ default: m.TradeoffChart })),
);

const EFFORTS = ['low', 'medium', 'high'] as const;
/** Log slider: 0..1000 maps to 100k..100M tokens per day (SPEC §11.2). */
const volumeOf = (position: number) => 1e5 * 10 ** ((3 * position) / 1000);

export type Selection = { model: string; strategy: StrategyId; effort: string };

export function Benchmark() {
  const { summary, models, configsOf, tagOf } = useData();
  const [model, setModel] = useState(models[0] ?? '');
  const [strategy, setStrategy] = useState<StrategyId>('cheapest');
  const [effort, setEffort] = useState('medium');
  const [position, setPosition] = useState(500);
  const [profileId, setProfileId] = useState(summary.profiles[0]?.id ?? '');

  const available = configsOf(model);
  const active: StrategyId = available.includes(strategy)
    ? strategy
    : (STRATEGIES.find((s) => available.includes(s.id))?.id ?? 'cheapest');
  const profile = summary.profiles.find((p) => p.id === profileId) ?? summary.profiles[0];
  // The slider stays responsive; the calculator catches up with the deferred value.
  const volume = volumeOf(useDeferredValue(position));
  const selection: Selection = { model, strategy: active, effort };

  return (
    <section id="benchmark" className="mx-auto grid max-w-6xl gap-4 px-4 py-16">
      <span className="label-sm text-telemetry-ink">benchmark · auto vs pinned</span>
      <h2 className="headline-md">Pick your trade-off</h2>
      <p className="body-md text-text-secondary">
        cheaper or faster — same model, one pinned endpoint. every figure is measured against
        openrouter's automatic routing.
      </p>
      <p className="body-sm text-text-faint">
        {models.map(shortModel).join(' · ')} ·{' '}
        {summary.run.synthetic
          ? 'synthetic data'
          : `run ${summary.run.date.slice(0, 10)} · commit ${summary.run.commit.slice(0, 7)}`}{' '}
        · n={summary.cells.reduce((sum, c) => sum + c.n, 0)} ·{' '}
        <a href="#methodology">methodology</a>
      </p>

      <Panel title="controls">
        <div className="grid gap-4">
          <Tabs
            className="min-w-0"
            value={active}
            onValueChange={(value) => {
              const next = STRATEGIES.find((s) => s.id === value);
              if (next) setStrategy(next.id);
            }}>
            <TabsList className="relative h-9 max-w-full justify-start overflow-x-auto rounded-md [scrollbar-width:none] bg-surface-pane">
              <TabsIndicator className="rounded-md bg-route shadow-[var(--glow-blue)]" />
              {STRATEGIES.map((s) => {
                const tag = tagOf(model, s.id);
                return (
                  <TabsTrigger
                    key={s.id}
                    value={s.id}
                    disabled={!available.includes(s.id)}
                    title={
                      available.includes(s.id) ? undefined : `no ${s.label} endpoint for this model`
                    }
                    className="body-sm z-10 rounded-md transition-colors duration-[140ms] ease-out data-active:bg-transparent data-active:font-semibold data-active:text-text-on-accent data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent dark:data-active:text-text-on-accent">
                    {s.label}
                    {tag && <span className="opacity-70">{tag}</span>}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-end gap-4">
            <Picker
              label="model"
              value={model}
              onChange={setModel}
              options={models.map((m) => [m, shortModel(m)])}
            />
            <Picker
              label="effort"
              value={effort}
              onChange={setEffort}
              options={EFFORTS.map((e) => [e, e])}
            />
            <Picker
              label="usage profile"
              value={profile?.id ?? ''}
              onChange={setProfileId}
              options={summary.profiles.map((p) => [p.id, p.label.toLowerCase()])}
            />
            <label className="grid min-w-64 flex-1 gap-2">
              <span className="label-sm text-text-faint">
                volume · {tokens(volumeOf(position))} tokens/day
              </span>
              <Slider
                value={position}
                min={0}
                max={1000}
                onValueChange={(value) =>
                  setPosition(Array.isArray(value) ? (value[0] ?? 0) : value)
                }
              />
            </label>
          </div>
        </div>
      </Panel>

      {profile && <Calculator selection={selection} profile={profile} volume={volume} />}
      <Comparison selection={selection} profile={profile} />
      <Suspense
        fallback={<div className="h-80 rounded-md border border-hairline bg-surface-docked" />}>
        <TradeoffChart selection={selection} profile={profile} />
      </Suspense>
      <EndpointMatrix model={model} />
      <Details />
    </section>
  );
}

function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [value: string, label: string][];
}) {
  return (
    <div className="grid gap-2">
      <span className="label-sm text-text-faint">{label}</span>
      <Select
        value={value}
        onValueChange={(next) => next !== null && onChange(next)}
        items={Object.fromEntries(options)}>
        <SelectTrigger className="body-sm h-9 min-w-40 rounded-md">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue} className="body-sm">
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Calculator({
  selection,
  profile,
  volume,
}: {
  selection: Selection;
  profile: Profile;
  volume: number;
}) {
  const { costModelOf, tagOf } = useData();
  const auto = costModelOf(selection.model, 'auto');
  const pinned = costModelOf(selection.model, selection.strategy);
  if (!auto || !pinned) return null;
  const perDay = (perM: number) => (volume / 1e6) * perM;
  const autoDay = perDay(blendedPerM(auto, profile));
  const pinDay = perDay(blendedPerM(pinned, profile));
  const delta = pinDay - autoDay;
  const tag = tagOf(selection.model, selection.strategy);
  return (
    <Panel
      title="estimated spend"
      meta={`${profile.label.toLowerCase()} profile · ${profile.source}`}>
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricPair label="auto" value={`${usd(autoDay)}/day`} unit={`· ${usd(autoDay * 30)}/mo`} />
        <MetricPair
          label={`pinned · ${tag}`}
          value={`${usd(pinDay)}/day`}
          unit={`· ${usd(pinDay * 30)}/mo`}
          tone="route"
        />
        <MetricPair
          label="difference"
          value={`${delta <= 0 ? '−' : '+'}${usd(Math.abs(delta) * 30)}/mo`}
          unit={`(${change(pinDay / autoDay)})`}
          tone={delta <= 0 ? 'ok' : 'fault'}
        />
      </div>
      <p className="body-sm mt-3 text-text-faint">
        estimate: volume × profile token mix × effective price per million.
        {pinned.cachedPerM === null &&
          ' this endpoint publishes no cache price, so cached tokens are billed at the input price.'}
      </p>
    </Panel>
  );
}

/** A ratio badge: coloured by direction, amber when the interval contains 1 (SPEC §11.4). */
function RatioBadge({
  ratio,
  ci,
  lowerIsBetter,
}: {
  ratio: number | null | undefined;
  ci: [number, number] | null | undefined;
  lowerIsBetter: boolean;
}) {
  if (ratio == null || !ci) return <Badge>no data</Badge>;
  if (ci[0] <= 1 && ci[1] >= 1) return <Badge tone="warn">no significant difference</Badge>;
  const better = lowerIsBetter ? ratio < 1 : ratio > 1;
  return <Badge tone={better ? 'ok' : 'fault'}>{change(ratio)}</Badge>;
}

function Bars({
  rows,
  tone,
}: {
  rows: { label: string; value: number | null; text: string }[];
  tone: 'route' | 'telemetry' | 'meta' | 'ok';
}) {
  // Rows come in Auto/pin pairs that may use different units: scale each pair on its own.
  const maxOf = (index: number) => {
    const pair = rows.slice(index - (index % 2), index - (index % 2) + 2);
    return Math.max(...pair.map((r) => r.value ?? 0), Number.EPSILON);
  };
  const fill = {
    route: 'bg-route-ink',
    telemetry: 'bg-telemetry-ink',
    meta: 'bg-meta-ink',
    ok: 'bg-ok',
  }[tone];
  return (
    <div className="grid gap-2">
      {rows.map((row, index) => (
        <div key={row.label} className="grid grid-cols-[9rem_1fr_auto] items-center gap-3">
          <span className="body-sm truncate text-text-muted">{row.label}</span>
          <span className="h-[3px] rounded-full bg-surface-raised">
            <span
              className={`block h-full rounded-full transition-[width] duration-[220ms] ease-out ${index % 2 === 0 ? 'bg-text-muted' : fill}`}
              style={{ width: `${((row.value ?? 0) / maxOf(index)) * 100}%` }}
            />
          </span>
          <span className="body-sm text-right text-text-primary">{row.text}</span>
        </div>
      ))}
    </div>
  );
}

function Comparison({
  selection,
  profile,
}: {
  selection: Selection;
  profile: Profile | undefined;
}) {
  const { cellAt, costModelOf, reliabilityOf, tagOf } = useData();
  const { model, strategy, effort } = selection;
  const tag = tagOf(model, strategy) ?? strategy;
  const at = (workload: string, config: string) => cellAt(model, workload, effort, config);
  const agentic = at('agentic', strategy);
  const short = at('short', strategy);
  const big = at('big-context', strategy);
  const autoShort = at('short', 'auto');
  const autoAgentic = at('agentic', 'auto');
  const autoBig = at('big-context', 'auto');
  const auto = costModelOf(model, 'auto');
  const pinned = costModelOf(model, strategy);
  const pinReliability = reliabilityOf(model, strategy);
  const autoReliability = reliabilityOf(model, 'auto');
  const n = (cell: typeof short) => (cell ? `n=${cell.ok}/${cell.n}` : 'n=0');

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel
        title="cost"
        meta={n(agentic)}
        actions={
          <RatioBadge ratio={agentic?.vsAuto?.cost} ci={agentic?.vsAuto?.ci.cost} lowerIsBetter />
        }>
        <Bars
          tone="route"
          rows={[
            ...(auto && pinned && profile
              ? [
                  {
                    label: 'auto /M',
                    value: blendedPerM(auto, profile),
                    text: `$${blendedPerM(auto, profile).toFixed(4)}`,
                  },
                  {
                    label: `${tag} /M`,
                    value: blendedPerM(pinned, profile),
                    text: `$${blendedPerM(pinned, profile).toFixed(4)}`,
                  },
                ]
              : []),
            {
              label: 'auto task',
              value: autoAgentic?.costUsd?.p50 ?? null,
              text: autoAgentic?.costUsd ? usd(autoAgentic.costUsd.p50) : '—',
            },
            {
              label: `${tag} task`,
              value: agentic?.costUsd?.p50 ?? null,
              text: agentic?.costUsd ? usd(agentic.costUsd.p50) : '—',
            },
          ]}
        />
        <p className="body-sm mt-3 text-text-faint">
          blended price for the selected profile, and median cost of a full agentic task.
        </p>
      </Panel>

      <Panel
        title="speed"
        meta={n(short)}
        actions={
          <RatioBadge ratio={short?.vsAuto?.ttft} ci={short?.vsAuto?.ci.ttft} lowerIsBetter />
        }>
        <Bars
          tone="telemetry"
          rows={[
            {
              label: 'auto ttft',
              value: autoShort?.ttftMs?.p50 ?? null,
              text: autoShort?.ttftMs ? ms(autoShort.ttftMs.p50) : '—',
            },
            {
              label: `${tag} ttft`,
              value: short?.ttftMs?.p50 ?? null,
              text: short?.ttftMs ? ms(short.ttftMs.p50) : '—',
            },
            {
              label: 'auto tok/s',
              value: autoShort?.outputTps?.p50 ?? null,
              text: autoShort?.outputTps ? tps(autoShort.outputTps.p50) : '—',
            },
            {
              label: `${tag} tok/s`,
              value: short?.outputTps?.p50 ?? null,
              text: short?.outputTps ? tps(short.outputTps.p50) : '—',
            },
          ]}
        />
        <p className="body-sm mt-3 text-text-faint">
          median time to first token and output speed on short prompts
          {short?.ttftMs && ` · p95 ${ms(short.ttftMs.p95)}`}.
        </p>
      </Panel>

      <Panel
        title="cache"
        meta={n(big)}
        actions={
          <RatioBadge
            ratio={big?.vsAuto?.cacheHit}
            ci={big?.vsAuto?.ci.cacheHit}
            lowerIsBetter={false}
          />
        }>
        <Bars
          tone="meta"
          rows={[
            {
              label: 'auto',
              value: autoBig?.cacheRatio ?? null,
              text: autoBig?.cacheRatio != null ? pct(autoBig.cacheRatio) : '—',
            },
            {
              label: tag,
              value: big?.cacheRatio ?? null,
              text: big?.cacheRatio != null ? pct(big.cacheRatio) : '—',
            },
          ]}
        />
        <p className="body-sm mt-3 text-text-faint">
          share of a 30k-token prefix read from cache on repeated calls
          {big?.coldVsCached &&
            ` · cold ${usd(big.coldVsCached.coldUsd)} vs cached ${usd(big.coldVsCached.cachedUsd)}`}
          .
        </p>
      </Panel>

      <Panel title="reliability" meta={`n=${pinReliability.ok}/${pinReliability.n}`}>
        <Bars
          tone="ok"
          rows={[
            {
              label: 'auto',
              value: autoReliability.rate,
              text: autoReliability.rate != null ? pct(autoReliability.rate) : '—',
            },
            {
              label: tag,
              value: pinReliability.rate,
              text: pinReliability.rate != null ? pct(pinReliability.rate) : '—',
            },
          ]}
        />
        <p className="body-sm mt-3 text-text-faint">
          a pin never falls back: when its endpoint fails, the request fails.
          {Object.keys(pinReliability.errors).length > 0 &&
            ` errors: ${Object.entries(pinReliability.errors)
              .map(([kind, count]) => `${kind} ×${count}`)
              .join(', ')}.`}
        </p>
        {autoAgentic?.providers && (
          <p className="body-sm mt-2 text-text-faint">
            auto routed to{' '}
            {Object.entries(autoAgentic.providers)
              .map(([host, share]) => `${host} ${pct(share, 0)}`)
              .join(' · ')}
            {autoAgentic.providerSwitchRate !== undefined &&
              ` · switched host mid-task in ${pct(autoAgentic.providerSwitchRate, 0)} of tasks`}
            .
          </p>
        )}
      </Panel>
    </div>
  );
}

/** Collapsible; <Activity> pre-renders the hidden content at low priority and keeps its state. */
function Details() {
  const [open, setOpen] = useState(false);
  return (
    <div id="methodology" className="rounded-md border border-hairline bg-surface-docked">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="label-sm flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-text-secondary hover:bg-surface-hover">
        <span aria-hidden>{open ? '▾' : '▸'}</span> details & methodology
      </button>
      <Activity mode={open ? 'visible' : 'hidden'}>
        <div className="body-sm grid gap-2 px-3 pb-3 text-text-muted">
          <p>
            each configuration sends the same prompts to the same model: auto leaves the request
            untouched, a pin adds <code>provider.only</code> with{' '}
            <code>allow_fallbacks: false</code>. requests are interleaved in a seeded random order,
            streamed, and timed locally.
          </p>
          <p>
            medians come with bootstrap 95% intervals; a ratio is only highlighted when its interval
            excludes 1. prices are the published ones at run time, cache prices included.
          </p>
          <p className="text-text-faint">
            per-request distributions and the full p50/p90/p95 table arrive with the first measured
            run.
          </p>
        </div>
      </Activity>
    </div>
  );
}

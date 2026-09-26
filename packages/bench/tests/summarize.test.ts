import { describe, expect, it } from 'vitest';
import { report } from '../report.ts';
import type { ResultLine, RunMeta } from '../results.ts';
import { summarize } from '../summarize.ts';

const endpoint = (tag: string, provider: string, input: number, output: number) => ({
  model: 'a/model',
  tag,
  provider,
  tier: 'default' as const,
  input,
  output,
  cached: input / 10,
  context: 100_000,
  quantization: null,
  status: 0,
  uptime: 99,
  reasoning: true,
});

const meta: RunMeta = {
  runId: 'run-1',
  date: '2026-09-26T00:00:00.000Z',
  commit: 'abc',
  seed: 1,
  args: {
    maxUsd: 5,
    workloads: ['short', 'agentic', 'big-context'],
    efforts: ['medium'],
    n: 8,
    concurrency: 1,
  },
  models: [
    {
      model: 'a/model',
      class: 'open-weight',
      configs: [
        { ids: ['auto'], tag: null, fromObserved: [] },
        { ids: ['cheapest', 'alt-host'], tag: 'host-a', fromObserved: [] },
        { ids: ['fastest'], tag: 'host-b', fromObserved: [] },
      ],
      omitted: [{ id: 'best-cache', reason: 'no observed export' }],
      costBasis: 'input',
    },
  ],
  endpoints: [endpoint('host-a', 'Host A', 1, 2), endpoint('host-b', 'Host B', 3, 6)],
  observed: null,
};

const AUTO = { configs: ['auto' as const], tag: null };
const PIN_A = { configs: ['cheapest' as const, 'alt-host' as const], tag: 'host-a' };
const PIN_B = { configs: ['fastest' as const], tag: 'host-b' };

function line(overrides: Partial<ResultLine>): ResultLine {
  return {
    runId: 'run-1',
    key: 'k',
    model: 'a/model',
    configs: ['auto'],
    tag: null,
    workload: 'short',
    effort: 'medium',
    iteration: 0,
    warmup: false,
    startedAt: '2026-09-26T00:00:10.000Z',
    status: 'ok',
    error: null,
    finishReason: 'stop',
    ttftMs: 1000,
    ttfvtMs: 1100,
    totalMs: 2000,
    outputTps: 50,
    promptTokens: 1000,
    completionTokens: 100,
    reasoningTokens: 20,
    cachedTokens: 0,
    costUsd: 0.001,
    toolCalls: 0,
    providerUsed: 'Host A',
    serverLatencyMs: null,
    generationTimeMs: null,
    ...overrides,
  };
}

const short = (
  config: typeof AUTO | typeof PIN_A | typeof PIN_B,
  overrides: (i: number) => Partial<ResultLine>,
) =>
  Array.from({ length: 8 }, (_, i) =>
    line({ ...config, key: `short|${config.tag}|${i}`, iteration: i, ...overrides(i) }),
  );

const lines: ResultLine[] = [
  // Auto: 1000–1700 ms, served by two hosts.
  ...short(AUTO, (i) => ({ ttftMs: 1000 + 100 * i, providerUsed: i % 4 ? 'Host A' : 'Host B' })),
  // Host A: clearly faster; its slow warm-up must not count.
  ...short(PIN_A, (i) => ({ ttftMs: 400 + 10 * i })),
  line({ ...PIN_A, key: 'short|host-a|warmup', iteration: -1, warmup: true, ttftMs: 99_999 }),
  // Host B: every attempt rate-limited.
  ...short(PIN_B, () => ({ status: 'http_429', ttftMs: null, costUsd: null, providerUsed: null })),
  // Agentic auto: one task of two turns on two hosts.
  line({ ...AUTO, workload: 'agentic', key: 'task', turn: 0, costUsd: 0.002, toolCalls: 1 }),
  line({
    ...AUTO,
    workload: 'agentic',
    key: 'task',
    turn: 1,
    costUsd: 0.003,
    providerUsed: 'Host B',
  }),
  // Big-context: host A caches after the cold call.
  ...[0, 1, 2].map((position) =>
    line({
      ...PIN_A,
      workload: 'big-context',
      key: 'series',
      position,
      promptTokens: 30_000,
      cachedTokens: position === 0 ? 0 : 29_000,
      costUsd: position === 0 ? 0.03 : 0.005,
    }),
  ),
];

const cell = (summary: ReturnType<typeof summarize>, workload: string, config: string) =>
  summary.cells.find((c) => c.workload === workload && c.config === config);

describe('summarize', () => {
  const summary = summarize(meta, lines);

  it('builds a measured summary', () => {
    expect(summary.run).toMatchObject({ id: 'run-1', synthetic: false, maxUsd: 5 });
    expect(summary.run.spentUsd).toBeCloseTo(8 * 0.001 * 2 + 0.001 + 0.005 + 0.03 + 0.01);
  });

  it('duplicates a merged configuration into one cell per strategy', () => {
    const [cheapest, altHost] = [
      cell(summary, 'short', 'cheapest'),
      cell(summary, 'short', 'alt-host'),
    ];
    expect(cheapest).toBeDefined();
    expect({ ...cheapest, config: 'x' }).toEqual({ ...altHost, config: 'x' });
  });

  it('excludes warm-ups', () => {
    const cheapest = cell(summary, 'short', 'cheapest')!;
    expect(cheapest.n).toBe(8);
    expect(cheapest.ttftMs!.p95).toBeLessThan(1000);
  });

  it('keeps stats null for a cell without success', () => {
    expect(cell(summary, 'short', 'fastest')).toMatchObject({
      n: 8,
      ok: 0,
      ttftMs: null,
      costUsd: null,
      vsAuto: null,
      errors: { http_429: 8 },
    });
  });

  it('headlines only the ratios whose interval excludes 1', () => {
    const ttft = summary.headlines.find((h) => h.metric === 'ttft' && h.config === 'cheapest');
    expect(ttft).toMatchObject({ workload: 'short', n: 8, baseline: 1350 });
    expect(ttft!.ci[1]).toBeLessThan(1);
    // Same cost as auto: no cost headline.
    expect(summary.headlines.some((h) => h.metric === 'cost')).toBe(false);
    for (const h of summary.headlines) expect(h.ci[0] > 1 || h.ci[1] < 1).toBe(true);
  });

  it('reports auto providers, switches, the cache ratio and cold vs cached', () => {
    expect(cell(summary, 'short', 'auto')!.providers).toEqual({ 'Host A': 0.75, 'Host B': 0.25 });
    expect(cell(summary, 'agentic', 'auto')).toMatchObject({ n: 1, providerSwitchRate: 1 });
    expect(cell(summary, 'agentic', 'auto')!.costUsd!.p50).toBeCloseTo(0.005);
    expect(cell(summary, 'big-context', 'cheapest')).toMatchObject({
      n: 3,
      cacheRatio: round4(58_000 / 90_000),
      coldVsCached: { coldUsd: 0.03, cachedUsd: 0.005 },
    });
  });

  it('prices auto by the providers it used', () => {
    const auto = summary.costModel.find((c) => c.config === 'auto')!;
    // Auto lines: 6 short + 1 agentic on Host A, 2 short + 1 agentic on Host B.
    expect(auto.inputPerM).toBeCloseTo(0.7 * 1 + 0.3 * 3);
    expect(summary.costModel.find((c) => c.config === 'alt-host')).toMatchObject({
      inputPerM: 1,
      outputPerM: 2,
      cachedPerM: 0.1,
    });
  });

  it('derives the chat profile from the short workload', () => {
    expect(summary.profiles.map((p) => p.id)).toEqual(['chat']);
    expect(summary.samples.some((s) => s.config === 'alt-host')).toBe(true);
    expect(summary.samples[0]!.t).toBe(10);
  });
});

const round4 = (value: number) => Math.round(value * 1e4) / 1e4;

describe('report', () => {
  it('renders the tables and the listed-price check', () => {
    const markdown = report(meta, lines);
    expect(markdown).toContain('# Benchmark run run-1');
    expect(markdown).toContain('~~best-cache~~: no observed export');
    // Host A: 8 short, the warm-up (billed too) and 3 big-context requests.
    expect(markdown).toMatch(/\| a\/model \| host-a \| 12 \|/);
    expect(markdown).toContain('## Headlines');
  });
});

import { normalize } from 'opencode-openrouter-provider-manager/openrouter';
import type { Endpoint } from 'opencode-openrouter-provider-manager/rpc';
import { afterEach, describe, expect, it, vi } from 'vitest';
import solListing from '../../plugin/tests/fixtures/gpt-6-sol.endpoints.json' with { type: 'json' };
import type { RequestMetrics, ToolCall } from '../client.ts';
import { SERIES_LENGTH } from '../config.ts';
import { Budget, buildPlan, reserve, type Unit } from '../plan.ts';
import type { ResultLine } from '../results.ts';
import {
  cellsOf,
  doneKeys,
  dryRun,
  execute,
  formatDryRun,
  resolveModels,
  runUnit,
  spentBy,
  type RunDeps,
} from '../run.ts';

const sol = solListing.data.endpoints.map(normalize).filter((e): e is Endpoint => e !== undefined);
const MODEL = 'openai/gpt-6-sol';

const metrics = (overrides: Partial<RequestMetrics> = {}): RequestMetrics => ({
  status: 'ok',
  error: null,
  generationId: 'gen-1',
  finishReason: 'stop',
  ttftMs: 812.345,
  ttfvtMs: 900,
  totalMs: 1500,
  outputTps: 55.55,
  promptTokens: 100,
  completionTokens: 40,
  reasoningTokens: 10,
  cachedTokens: 0,
  costUsd: 0.001,
  toolCalls: [],
  ...overrides,
});

function deps(responses: RequestMetrics[] = []) {
  const bodies: Record<string, unknown>[] = [];
  const send = vi.fn<RunDeps['send']>(async (body) => {
    bodies.push(structuredClone(body));
    return responses.shift() ?? metrics();
  });
  const generation = vi.fn<RunDeps['generation']>(async () => ({
    providerUsed: 'OpenAI',
    latencyMs: 700,
    generationTimeMs: 1400,
  }));
  return { bodies, send, generation };
}

async function setup(workloads: ('short' | 'agentic' | 'big-context')[], n = 2) {
  const { models, endpoints } = await resolveModels(
    [{ id: MODEL, class: 'premium' }],
    async () => sol,
    null,
  );
  const plan = buildPlan(cellsOf(models, { workloads, efforts: ['low', 'medium'], n }), 1);
  return { models, endpoints, plan };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const unit = (plan: Unit[], workload: string, tag: string | null = 'openai/flex') =>
  plan.find(
    (u) => u.workload === workload && u.config.tag === tag && !u.warmup && u.effort !== 'medium',
  ) ?? plan.find((u) => u.workload === workload && u.config.tag === tag && !u.warmup)!;

describe('dry-run', () => {
  it('estimates every cell from the listing without sending a request', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    vi.stubGlobal('fetch', fetch);
    const { endpoints, plan } = await setup(['short', 'big-context']);
    const rows = dryRun(plan, endpoints);
    // Without an observed export: auto, cheapest, fastest, default, alt-host.
    expect(rows.map((r) => r.config)).toContain('alt-host');
    expect(rows.every((r) => Number.isFinite(r.estimateUsd) && r.reserveUsd > 0)).toBe(true);
    const short = rows.find((r) => r.workload === 'short' && r.effort === 'medium')!;
    expect(short).toMatchObject({ units: 3, requests: 3 });
    const series = rows.find((r) => r.workload === 'big-context')!;
    // n = 2: one series of two requests, not a full series.
    expect(series).toMatchObject({ units: 1, requests: 2 });
    const { overBudget, text } = formatDryRun(rows, 0.001);
    expect(overBudget).toBe(true);
    expect(text).toContain('total:');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('skips the efforts a model class does not measure', async () => {
    const { models } = await setup([]);
    const cells = cellsOf(models, {
      workloads: ['long'],
      efforts: ['low', 'medium', 'high'],
      n: 1,
    });
    expect(new Set(cells.map((c) => c.effort))).toEqual(new Set(['medium']));
    // The skip is keyed to the calibrated model, not to its class.
    const other = cellsOf([{ ...models[0]!, model: 'x/premium' }], {
      workloads: ['long'],
      efforts: ['low', 'high'],
      n: 1,
    });
    expect(new Set(other.map((c) => c.effort))).toEqual(new Set(['low', 'high']));
  });

  it('refuses a model without endpoints', async () => {
    await expect(
      resolveModels([{ id: 'a/typo', class: 'premium' }], async () => [], null),
    ).rejects.toThrow(/check the model slug/);
  });
});

describe('runUnit', () => {
  it('pins the body and records metrics, never content', async () => {
    const { plan } = await setup(['short']);
    const d = deps();
    const [line] = await runUnit(unit(plan, 'short'), 'run-1', d);
    expect(d.bodies[0]).toMatchObject({
      model: MODEL,
      max_tokens: 4_000,
      reasoning: { effort: 'medium' },
      provider: { only: ['openai/flex'], allow_fallbacks: false },
    });
    expect(line).toMatchObject({
      runId: 'run-1',
      configs: ['cheapest'],
      tag: 'openai/flex',
      ttftMs: 812.3,
      outputTps: 55.6,
      providerUsed: 'OpenAI',
      serverLatencyMs: 700,
    });
    expect(Object.keys(line!)).not.toContain('messages');
  });

  it('sends a big-context series on one prefix', async () => {
    const { plan } = await setup(['big-context'], SERIES_LENGTH + 2);
    const d = deps();
    const lines = await runUnit(unit(plan, 'big-context'), 'run-1', d);
    expect(lines.map((l) => l.position)).toEqual([0, 1, 2, 3, 4]);
    const systems = d.bodies.map((b) =>
      JSON.stringify(Array.isArray(b.messages) ? b.messages[0] : null),
    );
    expect(new Set(systems).size).toBe(1);
  });

  it('replays an agentic task until the model stops calling tools', async () => {
    const { plan } = await setup(['agentic']);
    const tool = (name: string, args: object): ToolCall[] => [
      { id: '', name, arguments: JSON.stringify(args) },
    ];
    const secret = 'export function total() { return 600; }';
    const d = deps([
      metrics({ toolCalls: tool('read_file', { path: 'src/cart.ts' }) }),
      metrics({ toolCalls: tool('write_file', { path: 'src/cart.ts', content: secret }) }),
      metrics({ toolCalls: tool('run_tests', {}) }),
      metrics(),
    ]);
    const lines = await runUnit(unit(plan, 'agentic'), 'run-1', d);
    expect(lines.map((l) => [l.turn, l.toolCalls])).toEqual([
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 0],
    ]);
    expect(JSON.stringify(d.bodies[3])).toContain('fail 0');
    expect(JSON.stringify(d.bodies[1])).toContain('"call_0_0"');
    expect(JSON.stringify(lines)).not.toContain(secret);
  });

  it('ends an agentic task on an error', async () => {
    const { plan } = await setup(['agentic']);
    const d = deps([metrics({ status: 'http_429', costUsd: null })]);
    const lines = await runUnit(unit(plan, 'agentic'), 'run-1', d);
    expect(lines).toHaveLength(1);
  });
});

describe('spentBy', () => {
  it('charges the reservation of a written unit whose cost is unknown', async () => {
    const { endpoints, plan } = await setup(['short']);
    const [known, unknown] = plan;
    const d = deps([metrics({ costUsd: 0.002 }), metrics({ costUsd: null })]);
    const lines = [
      ...(await runUnit(known!, 'run-1', d)),
      ...(await runUnit(unknown!, 'run-1', d)),
    ];
    const reserved = reserve(
      unknown!,
      endpoints.filter((e) => e.model === MODEL),
    )!;
    expect(spentBy(plan, lines, endpoints)).toBeCloseTo(0.002 + reserved);
  });

  it('charges nothing for a request without response or rejected over HTTP', async () => {
    const { endpoints, plan } = await setup(['short']);
    const d = deps([
      metrics({
        status: 'stream_error',
        error: { code: null, message: 'fetch failed' },
        costUsd: null,
      }),
      metrics({ status: 'http_429', error: { code: 429, message: 'rate limited' }, costUsd: null }),
    ]);
    const lines = [
      ...(await runUnit(plan[0]!, 'run-1', d)),
      ...(await runUnit(plan[1]!, 'run-1', d)),
    ];
    expect(spentBy(plan, lines, endpoints)).toBe(0);
  });
});

describe('doneKeys', () => {
  it('sends again on resume the units with a request that got no response', async () => {
    const { plan } = await setup(['short', 'agentic']);
    const agentic = unit(plan, 'agentic');
    const short = unit(plan, 'short');
    const d = deps([
      metrics({ toolCalls: [{ id: 'c', name: 'read', arguments: '{}' }] }),
      metrics({ status: 'stream_error', error: { code: null, message: 'fetch failed' } }),
      metrics({ status: 'stream_error', error: { code: null, message: 'terminated' } }),
    ]);
    const lines = [...(await runUnit(agentic, 'run-1', d)), ...(await runUnit(short, 'run-1', d))];
    // A stream cut after tokens came is a measured failure; only the silent unit is sent again.
    expect([...doneKeys(lines)]).toEqual([short.key]);
  });
});

describe('execute', () => {
  it('skips the keys already written and writes each unit once', async () => {
    const { endpoints, plan } = await setup(['short']);
    const done = new Set(plan.slice(0, 4).map((u) => u.key));
    const written: ResultLine[][] = [];
    const enriched: ResultLine[][] = [];
    // /generation only answers after every unit has been sent (a timer runs after microtasks).
    const d = deps();
    const late = new Promise<void>((resolve) => setTimeout(resolve, 0));
    d.generation.mockImplementation(async () => {
      await late;
      return { providerUsed: 'OpenAI', latencyMs: 700, generationTimeMs: 1400 };
    });
    const result = await execute(plan, {
      runId: 'run-1',
      snapshot: endpoints,
      budget: new Budget(100),
      concurrency: 2,
      done,
      deps: d,
      // Snapshot what is written: the lines are enriched in place afterwards.
      write: (lines) => written.push(structuredClone(lines)),
      enrich: (lines) => enriched.push(lines),
      log: () => undefined,
    });
    expect(result).toMatchObject({ completed: plan.length - 4, remaining: 0, refused: null });
    // Written before /generation answers, then enriched once it has.
    expect(written.flat().every((l) => l.providerUsed === null)).toBe(true);
    expect(enriched.flat().every((l) => l.providerUsed === 'OpenAI')).toBe(true);
    expect(enriched).toHaveLength(written.length);
    const keys = written.map((lines) => lines[0]!.key);
    expect(keys.some((key) => done.has(key))).toBe(false);
    expect(new Set(keys).size).toBe(plan.length - 4);
  });

  it('stops starting units once the budget refuses one', async () => {
    const { endpoints, plan } = await setup(['short']);
    const d = deps();
    const result = await execute(plan, {
      runId: 'run-1',
      snapshot: endpoints,
      // The first units fit (at most $0.08 reserved each), then spending closes the gap.
      budget: new Budget(0.09),
      concurrency: 1,
      deps: d,
      write: () => undefined,
      enrich: () => undefined,
      log: () => undefined,
    });
    expect(result.refused).not.toBeNull();
    expect(result.completed).toBeGreaterThan(0);
    expect(result.completed + result.remaining).toBe(plan.length);
    expect(d.send).toHaveBeenCalledTimes(result.completed);
  });

  it('stops once several units in a row get no response', async () => {
    const { endpoints, plan } = await setup(['short']);
    const d = deps();
    d.send.mockResolvedValue(
      metrics({
        status: 'stream_error',
        error: { code: null, message: 'fetch failed' },
        costUsd: null,
      }),
    );
    const budget = new Budget(100);
    const result = await execute(plan, {
      runId: 'run-1',
      snapshot: endpoints,
      budget,
      concurrency: 1,
      deps: d,
      write: () => undefined,
      enrich: () => undefined,
      log: () => undefined,
    });
    expect(result).toMatchObject({ completed: 3, refused: null });
    expect(result.offline?.key).toBe(plan[2]!.key);
    expect(budget.spent).toBe(0);
  });
});

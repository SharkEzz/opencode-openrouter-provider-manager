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

describe('dry-run', () => {
  it('estimates every cell from the listing without sending a request', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    vi.stubGlobal('fetch', fetch);
    const { endpoints, plan } = await setup(['short', 'big-context']);
    const rows = dryRun(plan, endpoints);
    // Without an observed export: auto, cheapest, fastest, default, alt-host.
    expect(rows.map((r) => r.config)).toContain('alt-host');
    expect(rows.every((r) => Number.isFinite(r.estimateUsd) && r.reserveUsd > 0)).toBe(true);
    const short = rows.find((r) => r.workload === 'short' && r.effort === 'low')!;
    expect(short).toMatchObject({ units: 3, requests: 3 });
    const series = rows.find((r) => r.workload === 'big-context')!;
    // n = 2: one series of two requests, not a full series.
    expect(series).toMatchObject({ units: 1, requests: 2 });
    const { overBudget, text } = formatDryRun(rows, 0.001);
    expect(overBudget).toBe(true);
    expect(text).toContain('total:');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses a model without endpoints', async () => {
    await expect(
      resolveModels([{ id: 'a/typo', class: 'premium' }], async () => [], null),
    ).rejects.toThrow(/check the model slug/);
  });
});

describe('runUnit', () => {
  const unit = (plan: Unit[], workload: string, tag: string | null = 'openai/flex') =>
    plan.find(
      (u) => u.workload === workload && u.config.tag === tag && !u.warmup && u.effort !== 'medium',
    ) ?? plan.find((u) => u.workload === workload && u.config.tag === tag && !u.warmup)!;

  it('pins the body and records metrics, never content', async () => {
    const { plan } = await setup(['short']);
    const d = deps();
    const [line] = await runUnit(unit(plan, 'short'), 'run-1', d);
    expect(d.bodies[0]).toMatchObject({
      model: MODEL,
      max_tokens: 2_000,
      reasoning: { effort: 'low' },
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
});

describe('execute', () => {
  it('skips the keys already written and writes each unit once', async () => {
    const { endpoints, plan } = await setup(['short']);
    const done = new Set(plan.slice(0, 4).map((u) => u.key));
    const written: ResultLine[][] = [];
    const result = await execute(plan, {
      runId: 'run-1',
      snapshot: endpoints,
      budget: new Budget(100),
      concurrency: 2,
      done,
      deps: deps(),
      write: (lines) => written.push(lines),
      log: () => undefined,
    });
    expect(result).toMatchObject({ completed: plan.length - 4, remaining: 0, refused: null });
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
      budget: new Budget(0.1),
      concurrency: 1,
      deps: d,
      write: () => undefined,
      log: () => undefined,
    });
    expect(result.refused).not.toBeNull();
    expect(result.completed).toBeGreaterThan(0);
    expect(result.completed + result.remaining).toBe(plan.length);
    expect(d.send).toHaveBeenCalledTimes(result.completed);
  });
});

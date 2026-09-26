import { normalize } from 'opencode-openrouter-provider-manager/openrouter';
import type { Endpoint } from 'opencode-openrouter-provider-manager/rpc';
import { describe, expect, it } from 'vitest';
import solListing from '../../plugin/tests/fixtures/gpt-6-sol.endpoints.json' with { type: 'json' };
import { MAX_AGENTIC_TURNS, MAX_TOKENS, SERIES_LENGTH } from '../config.ts';
import { Budget, buildPlan, type Cell, estimate, reserve } from '../plan.ts';
import type { Config } from '../strategies.ts';

const sol = solListing.data.endpoints.map(normalize).filter((e): e is Endpoint => e !== undefined);

const auto: Config = { ids: ['auto'], tag: null, fromObserved: [] };
const flex: Config = { ids: ['cheapest'], tag: 'openai/flex', fromObserved: [] };
const fast: Config = { ids: ['fastest'], tag: 'openai/fast', fromObserved: [] };

const cells: Cell[] = [auto, flex, fast].flatMap((config) => [
  { model: 'openai/gpt-6-sol', config, workload: 'short', effort: 'low', n: 4 },
  { model: 'openai/gpt-6-sol', config, workload: 'big-context', effort: 'medium', n: 10 },
]);

describe('buildPlan', () => {
  it('is reproducible for a seed and shuffled differently by another', () => {
    const keys = (seed: number) => buildPlan(cells, seed).map((u) => u.key);
    expect(keys(1)).toEqual(keys(1));
    expect(keys(1)).not.toEqual(keys(2));
  });

  it('warms up every cell but big-context, and gives each unit a unique key', () => {
    const plan = buildPlan(cells, 1);
    const warmups = plan.filter((u) => u.warmup);
    expect(warmups).toHaveLength(3);
    expect(warmups.every((u) => u.workload === 'short')).toBe(true);
    expect(new Set(plan.map((u) => u.key)).size).toBe(plan.length);
    // 3 configs × (1 warm-up + 4 short) + 3 configs × 2 series of 5
    expect(plan).toHaveLength(3 * 5 + 3 * 2);
  });

  it('ends with a partial series instead of oversampling big-context', () => {
    const plan = buildPlan([{ ...cells[1]!, n: 6 }], 1);
    expect(plan.map((u) => u.seriesLength)).toEqual([5, 1]);
    const [full, partial] = plan.map((u) => reserve(u, sol)!);
    expect(partial).toBeCloseTo(full! / 5);
  });

  it('interleaves the cells round by round, warm-ups first', () => {
    const plan = buildPlan(cells, 7);
    const firstRound = plan.slice(0, cells.length);
    expect(new Set(firstRound.map((u) => `${u.config.tag}|${u.workload}`)).size).toBe(cells.length);
    expect(firstRound.filter((u) => u.workload === 'short').every((u) => u.warmup)).toBe(true);
  });
});

describe('estimate and reserve', () => {
  const unit = { config: flex, workload: 'short', effort: 'low' } as const;

  it('reserves the worst case: max_tokens at the output price', () => {
    const reserved = reserve(unit, sol)!;
    // openai/flex: $5/M output.
    expect(reserved).toBeGreaterThan((MAX_TOKENS.short.low! * 5) / 1e6);
    expect(estimate(unit, sol)!).toBeLessThan(reserved);
  });

  it('reserves auto at the most expensive endpoint', () => {
    expect(reserve({ ...unit, config: auto }, sol)!).toBeCloseTo(
      reserve({ ...unit, config: fast }, sol)!,
    );
  });

  it('reserves a whole agentic task and a whole series', () => {
    const turn = (MAX_TOKENS.agentic.medium! * 5) / 1e6;
    const task = reserve({ config: flex, workload: 'agentic', effort: 'medium' }, sol)!;
    expect(task).toBeGreaterThan(MAX_AGENTIC_TURNS * turn);
    const series = reserve({ config: flex, workload: 'big-context', effort: 'medium' }, sol)!;
    // 5 requests of about 40k input tokens at $1/M.
    expect(series).toBeGreaterThan(SERIES_LENGTH * 0.03);
  });

  it('is null for a tag without a priced endpoint', () => {
    expect(reserve({ ...unit, config: { ...flex, tag: 'nowhere' } }, sol)).toBeNull();
  });
});

describe('Budget', () => {
  it('refuses a reservation over the cap, counting the ones in flight', () => {
    const budget = new Budget(1);
    const first = budget.tryReserve(0.6)!;
    expect(budget.tryReserve(0.5)).toBeNull();
    budget.settle(first, 0.1);
    expect(budget.spent).toBe(0.1);
    expect(budget.tryReserve(0.5)).not.toBeNull();
  });

  it('keeps the reservation when the real cost is unknown', () => {
    const budget = new Budget(1, 0.2);
    budget.settle(budget.tryReserve(0.3)!, null);
    expect(budget.spent).toBeCloseTo(0.5);
    expect(budget.reserved).toBe(0);
  });
});

import type { Endpoint } from 'opencode-openrouter-provider-manager/rpc';
import {
  type Effort,
  EXPECTED_REASONING,
  MAX_TOKENS,
  SERIES_LENGTH,
  type Workload,
} from './config.ts';
import { rng } from './stats.ts';
import type { Config } from './strategies.ts';
import { SPECS } from './workloads/index.ts';

/**
 * Scheduling and budget (SPEC §8): the units of a run in a seeded interleaved order, their
 * estimated and worst-case cost, and the reservation that keeps `--max-usd` a hard cap.
 */

/** One model × config × workload × effort. `n` counts requests, tasks for agentic. */
export type Cell = { model: string; config: Config; workload: Workload; effort: Effort; n: number };

/** What the runner executes at once: a request, an agentic task, or a big-context series. */
export type Unit = {
  /** Stable across runs of the same plan: `--resume` skips the keys already written. */
  key: string;
  model: string;
  config: Config;
  workload: Workload;
  effort: Effort;
  /** Index among the measured units of the cell; the warm-up is -1. */
  iteration: number;
  warmup: boolean;
};

export function cellKey(cell: Omit<Cell, 'n'>) {
  return [cell.model, cell.config.tag ?? 'auto', cell.workload, cell.effort].join('|');
}

/** Big-context runs whole series; the other workloads one unit per repetition. */
export function unitsOf(workload: Workload, n: number) {
  return workload === 'big-context' ? Math.ceil(n / SERIES_LENGTH) : n;
}

/**
 * Every unit of `cells`, round-robin: each round takes the next unit of every cell, in an order
 * shuffled by `seed`. A cell starts with its warm-up, except big-context (its first call is the
 * cold one it measures).
 */
export function buildPlan(cells: Cell[], seed: number): Unit[] {
  const queues = cells.map((cell) => {
    const units: Unit[] = [];
    const base = { model: cell.model, config: cell.config, workload: cell.workload };
    const key = cellKey(cell);
    if (cell.workload !== 'big-context')
      units.push({
        ...base,
        effort: cell.effort,
        key: `${key}|warmup`,
        iteration: -1,
        warmup: true,
      });
    for (let i = 0; i < unitsOf(cell.workload, cell.n); i++)
      units.push({ ...base, effort: cell.effort, key: `${key}|${i}`, iteration: i, warmup: false });
    return units;
  });
  const random = rng(seed);
  const plan: Unit[] = [];
  const rounds = Math.max(0, ...queues.map((q) => q.length));
  for (let round = 0; round < rounds; round++) {
    const batch = queues.flatMap((queue) => (round < queue.length ? [queue[round]!] : []));
    // Fisher–Yates
    for (let i = batch.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [batch[i], batch[j]] = [batch[j]!, batch[i]!];
    }
    plan.push(...batch);
  }
  return plan;
}

type Prices = { input: number; output: number; cached: number };

const perToken = (endpoint: Endpoint): Prices | null =>
  endpoint.input === null || endpoint.output === null
    ? null
    : {
        input: endpoint.input / 1e6,
        output: endpoint.output / 1e6,
        cached: (endpoint.cached ?? endpoint.input) / 1e6,
      };

/** The priced endpoints a unit may be served by: its pin, or any endpoint for auto. */
function candidates(unit: Pick<Unit, 'config'>, endpoints: Endpoint[]): Prices[] {
  return endpoints
    .filter((e) => e.tag !== 'router' && (unit.config.tag === null || e.tag === unit.config.tag))
    .map(perToken)
    .filter((p): p is Prices => p !== null);
}

const maxTokensOf = (unit: Pick<Unit, 'workload' | 'effort'>) => {
  const value = MAX_TOKENS[unit.workload][unit.effort];
  if (value === undefined) throw new Error(`${unit.workload} is not measured at ${unit.effort}`);
  return value;
};

/**
 * Expected USD of one unit, from the workload's expected tokens plus the reasoning expected at
 * its effort. Auto is priced at the mean of its endpoints.
 */
export function estimate(
  unit: Pick<Unit, 'config' | 'workload' | 'effort'>,
  endpoints: Endpoint[],
) {
  const pool = candidates(unit, endpoints);
  if (pool.length === 0) return null;
  const maxTokens = maxTokensOf(unit);
  const output = (visible: number) =>
    Math.min(maxTokens, visible + EXPECTED_REASONING[unit.effort]);
  const cost = (p: Prices) =>
    SPECS[unit.workload].expected.reduce(
      (sum, t) =>
        sum +
        (t.input - t.cachedInput) * p.input +
        t.cachedInput * p.cached +
        output(t.output) * p.output,
      0,
    );
  return pool.reduce((sum, p) => sum + cost(p), 0) / pool.length;
}

/**
 * Worst-case USD of one unit (SPEC §8): for each request, its input bound at the highest input
 * price plus `max_tokens` at the highest output price among the endpoints the config may use.
 */
export function reserve(unit: Pick<Unit, 'config' | 'workload' | 'effort'>, endpoints: Endpoint[]) {
  const pool = candidates(unit, endpoints);
  if (pool.length === 0) return null;
  const input = Math.max(...pool.map((p) => p.input));
  const output = Math.max(...pool.map((p) => p.output));
  const maxTokens = maxTokensOf(unit);
  return SPECS[unit.workload]
    .worstInput(maxTokens)
    .reduce((sum, tokens) => sum + tokens * input + maxTokens * output, 0);
}

export type Reservation = { readonly usd: number };

/** Reserve before sending, settle with the real cost after (SPEC §8). */
export class Budget {
  readonly maxUsd: number;
  spent: number;
  reserved = 0;

  constructor(maxUsd: number, spent = 0) {
    this.maxUsd = maxUsd;
    this.spent = spent;
  }

  /** null when the reservation would take spent + in-flight reservations over the cap. */
  tryReserve(usd: number): Reservation | null {
    if (this.spent + this.reserved + usd > this.maxUsd) return null;
    this.reserved += usd;
    return { usd };
  }

  /** Replaces the reservation by the real cost; an unknown cost keeps the reservation. */
  settle(reservation: Reservation, costUsd: number | null) {
    this.reserved -= reservation.usd;
    this.spent += costUsd ?? reservation.usd;
  }
}

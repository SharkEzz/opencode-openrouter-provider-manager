/**
 * Runs the benchmark (SPEC §8, §12): resolves the configurations of every model, plans the
 * units in a seeded interleaved order, and sends them under a hard budget, appending metrics to
 * `results/<runId>.jsonl`. `--dry-run` only lists endpoints (free) and prints the estimate.
 *
 *   node run.ts --dry-run
 *   OPENROUTER_API_KEY=… node run.ts [--max-usd 5] [--models a/b,c/d] [--workloads short,long]
 *                                     [--efforts low,medium] [--n 4] [--seed 1] [--concurrency 1]
 *   OPENROUTER_API_KEY=… node run.ts --resume <runId> [--max-usd 5]
 */
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { fetchEndpoints } from 'opencode-openrouter-provider-manager/openrouter';
import type { Endpoint } from 'opencode-openrouter-provider-manager/rpc';
import {
  type Generation,
  fetchGeneration,
  type RequestMetrics,
  send,
  type ToolCall,
} from './client.ts';
import {
  DEFAULT_MAX_USD,
  type Effort,
  effortsOf,
  EFFORTS,
  MAX_AGENTIC_TURNS,
  MAX_TOKENS,
  type ModelClass,
  MODELS,
  REPETITIONS,
  SERIES_LENGTH,
  timeoutFor,
  type Workload,
  WORKLOADS,
} from './config.ts';
import { latestObserved } from './observe.ts';
import { Budget, buildPlan, type Cell, cellKey, estimate, reserve, type Unit } from './plan.ts';
import { profileFromObserved } from './profiles.ts';
import {
  appendLines,
  appendProviders,
  readLines,
  readMeta,
  type ResolvedModel,
  type ResultLine,
  RESULTS_DIR,
  type RunMeta,
  unanswered,
  writeMeta,
} from './results.ts';
import type { EndpointSnapshot, Observed } from './schema.ts';
import { round } from './stats.ts';
import { buildBody, resolveConfigs } from './strategies.ts';
import { agentic, bigContext, type Message, requestBody, long, short } from './workloads/index.ts';

export type Options = {
  models: { id: string; class: ModelClass }[];
  workloads: Workload[];
  efforts: Effort[];
  /** Repetitions override; null keeps `REPETITIONS`. */
  n: number | null;
  seed: number;
  maxUsd: number;
  concurrency: number;
};

/** Resolves the configurations of every model from a fresh endpoint listing (free). */
export async function resolveModels(
  models: Options['models'],
  listEndpoints: (model: string) => Promise<Endpoint[]>,
  observed: Observed | null,
): Promise<{ models: ResolvedModel[]; endpoints: EndpointSnapshot[] }> {
  const profile = observed ? profileFromObserved(observed) : null;
  const resolved: ResolvedModel[] = [];
  const endpoints: EndpointSnapshot[] = [];
  for (const { id, class: modelClass } of models) {
    // oxlint-disable-next-line no-await-in-loop -- a few models, listed one after the other
    const listing = await listEndpoints(id);
    if (listing.length === 0) throw new Error(`No endpoints for ${id}: check the model slug`);
    endpoints.push(...listing.map((e) => ({ model: id, ...e })));
    resolved.push({
      model: id,
      class: modelClass,
      ...resolveConfigs(id, listing, observed, profile),
    });
  }
  return { models: resolved, endpoints };
}

/** Every measured cell: model × workload × effort × config. */
export function cellsOf(
  models: ResolvedModel[],
  { workloads, efforts, n }: Pick<Options, 'workloads' | 'efforts' | 'n'>,
): Cell[] {
  return models.flatMap((m) =>
    workloads.flatMap((workload) =>
      effortsOf(workload, m.model)
        .filter((effort) => efforts.includes(effort))
        .flatMap((effort) =>
          m.configs.map((config) => ({
            model: m.model,
            config,
            workload,
            effort,
            n: n ?? REPETITIONS[workload][m.class],
          })),
        ),
    ),
  );
}

const endpointsOf = (snapshot: EndpointSnapshot[], model: string): Endpoint[] =>
  snapshot.filter((e) => e.model === model);

export type DryRunRow = {
  model: string;
  workload: Workload;
  effort: Effort;
  config: string;
  tag: string | null;
  units: number;
  requests: number;
  estimateUsd: number;
  /** Worst case of one unit, as reserved before sending it. */
  reserveUsd: number;
};

/** The estimate of every cell of `plan`, warm-ups included. */
export function dryRun(plan: Unit[], snapshot: EndpointSnapshot[]): DryRunRow[] {
  const rows = new Map<string, DryRunRow>();
  for (const unit of plan) {
    const key = cellKey(unit);
    const endpoints = endpointsOf(snapshot, unit.model);
    let row = rows.get(key);
    if (!row) {
      row = {
        model: unit.model,
        workload: unit.workload,
        effort: unit.effort,
        config: unit.config.ids.join('+'),
        tag: unit.config.tag,
        units: 0,
        requests: 0,
        estimateUsd: 0,
        reserveUsd: reserve(unit, endpoints) ?? Infinity,
      };
      rows.set(key, row);
    }
    row.units++;
    row.requests += requestsOf(unit);
    row.estimateUsd += estimate(unit, endpoints) ?? Infinity;
  }
  // Plan order is shuffled; the table reads by model, workload, effort, then config.
  const rank = (r: DryRunRow) => [
    r.model,
    WORKLOADS.indexOf(r.workload),
    EFFORTS.indexOf(r.effort),
    r.tag === null ? '' : r.config,
  ];
  return [...rows.values()].toSorted((a, b) => {
    const [x, y] = [rank(a), rank(b)];
    const i = x.findIndex((value, index) => value !== y[index]);
    if (i === -1) return 0;
    return x[i]! < y[i]! ? -1 : 1;
  });
}

/** Requests of one unit: at most, for agentic. */
const requestsOf = (unit: Unit) =>
  unit.workload === 'big-context'
    ? (unit.seriesLength ?? SERIES_LENGTH)
    : unit.workload === 'agentic'
      ? MAX_AGENTIC_TURNS
      : 1;

export function formatDryRun(rows: DryRunRow[], maxUsd: number) {
  const usd = (value: number) => (Number.isFinite(value) ? `$${value.toFixed(4)}` : 'n/a');
  const table = [
    ['model', 'workload', 'effort', 'config', 'tag', 'units', 'requests', 'estimate', 'max/unit'],
    ...rows.map((r) => [
      r.model,
      r.workload,
      r.effort,
      r.config,
      r.tag ?? '(auto)',
      String(r.units),
      String(r.requests),
      usd(r.estimateUsd),
      usd(r.reserveUsd),
    ]),
  ];
  const widths = table[0]!.map((_, i) => Math.max(...table.map((row) => row[i]!.length)));
  const numeric = new Set([5, 6, 7, 8]);
  const lines = table.map((row) =>
    row
      .map((cell, i) => (numeric.has(i) ? cell.padStart(widths[i]!) : cell.padEnd(widths[i]!)))
      .join('  '),
  );
  const total = rows.reduce((sum, r) => sum + r.estimateUsd, 0);
  const requests = rows.reduce((sum, r) => sum + r.requests, 0);
  const tooBig = rows.filter((r) => r.reserveUsd > maxUsd);
  lines.push(
    '',
    `total: ${usd(total)} estimated for ${rows.reduce((s, r) => s + r.units, 0)} units, ` +
      `at most ${requests} requests (cap $${maxUsd})`,
  );
  const subtotals = Map.groupBy(rows, (r) => `${r.model} · ${r.workload}`);
  lines.push('', 'by model × workload:');
  for (const [name, group] of subtotals)
    lines.push(`  ${name}: ${usd(group.reduce((sum, r) => sum + r.estimateUsd, 0))}`);
  if (tooBig.length > 0)
    lines.push(`${tooBig.length} cell(s) reserve more than the cap per unit and would never run`);
  return { text: lines.join('\n'), totalUsd: total, overBudget: total > maxUsd };
}

export type RunDeps = {
  send: (body: Record<string, unknown>, timeoutMs: number) => Promise<RequestMetrics>;
  generation: (id: string) => Promise<Generation | null>;
  now?: () => Date;
};

const round1 = (value: number | null) => (value === null ? null : round(value, 1));

/**
 * Sends one unit (one request, an agentic task or a big-context series). Its lines come back as
 * soon as the requests are done; `lookups` settles once `/generation` has filled in the provider
 * of each one. The entry shows up about 9 s after a request, so waiting for it before the next
 * request would stretch the run for hours.
 */
export async function sendUnit(
  unit: Unit,
  runId: string,
  deps: RunDeps,
): Promise<{ lines: ResultLine[]; lookups: Promise<void> }> {
  const now = deps.now ?? (() => new Date());
  const maxTokens = MAX_TOKENS[unit.workload][unit.effort]!;
  const lines: ResultLine[] = [];
  const lookups: Promise<void>[] = [];
  const request = async (
    messages: Message[],
    extra: { turn?: number; position?: number },
    tools?: unknown[],
  ) => {
    const body = buildBody(
      requestBody(unit.model, unit.effort, maxTokens, messages, tools),
      unit.config,
    );
    const startedAt = now().toISOString();
    const metrics = await deps.send(body, timeoutFor(maxTokens));
    const line: ResultLine = {
      runId,
      key: unit.key,
      model: unit.model,
      configs: unit.config.ids,
      tag: unit.config.tag,
      workload: unit.workload,
      effort: unit.effort,
      iteration: unit.iteration,
      warmup: unit.warmup,
      ...extra,
      startedAt,
      status: metrics.status,
      error: metrics.error,
      finishReason: metrics.finishReason,
      ttftMs: round1(metrics.ttftMs),
      ttfvtMs: round1(metrics.ttfvtMs),
      totalMs: round(metrics.totalMs, 1),
      outputTps: round1(metrics.outputTps),
      promptTokens: metrics.promptTokens,
      completionTokens: metrics.completionTokens,
      reasoningTokens: metrics.reasoningTokens,
      cachedTokens: metrics.cachedTokens,
      costUsd: metrics.costUsd,
      toolCalls: metrics.toolCalls.length,
      providerUsed: null,
      serverLatencyMs: null,
      generationTimeMs: null,
    };
    lines.push(line);
    const { generationId } = metrics;
    if (generationId) {
      const lookup = async () => {
        const generation = await deps.generation(generationId);
        line.providerUsed = generation?.providerUsed ?? null;
        line.serverLatencyMs = generation?.latencyMs ?? null;
        line.generationTimeMs = generation?.generationTimeMs ?? null;
      };
      lookups.push(lookup());
    }
    return metrics;
  };

  /* oxlint-disable no-await-in-loop -- turns and series requests are sequential by design */
  switch (unit.workload) {
    case 'short':
      await request(short.messages(), {});
      break;
    case 'long':
      await request(long.messages(), {});
      break;
    case 'big-context': {
      const id = bigContext.nonce(runId, unit.model, unit.config.tag, unit.iteration);
      for (let position = 0; position < (unit.seriesLength ?? SERIES_LENGTH); position++)
        await request(bigContext.messages(id, position), { position });
      break;
    }
    case 'agentic': {
      const task = new agentic.Task();
      for (let turn = 0; turn < MAX_AGENTIC_TURNS; turn++) {
        const metrics = await request([...task.messages], { turn }, agentic.TOOLS);
        if (metrics.status !== 'ok' || metrics.toolCalls.length === 0) break;
        task.reply(metrics.toolCalls.map((call, i) => withId(call, turn, i)));
      }
      break;
    }
  }
  /* oxlint-enable no-await-in-loop */
  return { lines, lookups: Promise.all(lookups).then(() => undefined) };
}

/** Sends one unit and waits for its `/generation` lookups. */
export async function runUnit(unit: Unit, runId: string, deps: RunDeps): Promise<ResultLine[]> {
  const { lines, lookups } = await sendUnit(unit, runId, deps);
  await lookups;
  return lines;
}

/** A streamed tool call may come without an id; its result still needs one to refer to. */
const withId = (call: ToolCall, turn: number, index: number): ToolCall =>
  call.id ? call : { ...call, id: `call_${turn}_${index}` };

/**
 * What the units already written have consumed from the budget, for `--resume`: their real
 * cost, or their reservation when a cost is unknown, as `Budget.settle` charged it.
 */
export function spentBy(plan: Unit[], lines: ResultLine[], snapshot: EndpointSnapshot[]) {
  const units = new Map(plan.map((unit) => [unit.key, unit]));
  let spent = 0;
  for (const [key, unitLines] of Map.groupBy(lines, (line) => line.key)) {
    const unit = units.get(key);
    const reserved = unit ? reserve(unit, endpointsOf(snapshot, unit.model)) : null;
    const fallback = unitLines.reduce((sum, line) => sum + (line.costUsd ?? 0), 0);
    spent += unitCost(unitLines) ?? reserved ?? fallback;
  }
  return spent;
}

/**
 * Real cost of a line. Without usage it is free only when no provider generated anything: no
 * response at all, or an HTTP error before the stream (OpenRouter bills neither). Else unknown.
 */
const lineCost = (line: ResultLine) =>
  line.costUsd ?? (unanswered(line) || line.status.startsWith('http_') ? 0 : null);

/** Real cost of a unit, or null when one of its requests has none. */
function unitCost(lines: ResultLine[]) {
  let sum = 0;
  for (const line of lines) {
    const cost = lineCost(line);
    if (cost === null) return null;
    sum += cost;
  }
  return sum;
}

/**
 * The units `--resume` skips: every unit written, except those with a request that got no
 * response, which measured nothing and are sent again.
 */
export function doneKeys(lines: ResultLine[]) {
  const retried = new Set(lines.filter(unanswered).map((line) => line.key));
  return new Set(lines.map((line) => line.key).filter((key) => !retried.has(key)));
}

/** Consecutive units without a response after which the network is taken for down. */
const MAX_UNANSWERED = 3;

/**
 * Runs `plan` with `concurrency` workers under `budget`, skipping `done` keys. When a
 * reservation is refused, or `MAX_UNANSWERED` units in a row get no response (`offline`), no new
 * unit starts; the ones in flight finish. A unit is settled and
 * written as soon as its requests end; its `/generation` lookups finish in the background and
 * are recorded apart (a unit interrupted before them keeps null providers).
 */
export async function execute(
  plan: Unit[],
  {
    runId,
    snapshot,
    budget,
    concurrency,
    done = new Set<string>(),
    deps,
    write = (lines: ResultLine[]) => appendLines(runId, lines),
    enrich = (lines: ResultLine[]) => appendProviders(runId, lines),
    log = console.log,
  }: {
    runId: string;
    snapshot: EndpointSnapshot[];
    budget: Budget;
    concurrency: number;
    done?: Set<string>;
    deps: RunDeps;
    write?: (lines: ResultLine[]) => void;
    /** Records the providers of lines already written, once `/generation` has answered. */
    enrich?: (lines: ResultLine[]) => void;
    log?: (line: string) => void;
  },
) {
  const todo = plan.filter((unit) => !done.has(unit.key));
  let next = 0;
  let completed = 0;
  // Assigned inside the workers: annotate so the check after `await` is not narrowed to null.
  let refused = null as Unit | null;
  let offline = null as Unit | null;
  let silent = 0;
  const writes: Promise<void>[] = [];
  const worker = async () => {
    while (refused === null && offline === null && next < todo.length) {
      const unit = todo[next++]!;
      const usd = reserve(unit, endpointsOf(snapshot, unit.model));
      const reservation = usd === null ? null : budget.tryReserve(usd);
      if (!reservation) {
        refused ??= unit;
        return;
      }
      // oxlint-disable-next-line no-await-in-loop -- each worker runs one unit at a time
      const { lines, lookups } = await sendUnit(unit, runId, deps);
      budget.settle(reservation, unitCost(lines));
      completed++;
      silent = lines.some(unanswered) ? silent + 1 : 0;
      if (silent >= MAX_UNANSWERED) offline ??= unit;
      log(
        `[${done.size + completed}/${plan.length}] ${unit.key} · ${lines.map((l) => l.status).join(',')} · $${budget.spent.toFixed(4)}`,
      );
      // Written now, so an interruption never loses a paid unit; providers follow.
      write(lines);
      writes.push(lookups.then(() => enrich(lines)));
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  if (writes.length > 0) log('waiting for the last /generation lookups…');
  await Promise.all(writes);
  return { completed, remaining: todo.length - completed, refused, offline };
}

function list<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  flag: string,
): T[] {
  if (value === undefined) return [...allowed];
  const items = value.split(',').map((item) => item.trim());
  const known = items.filter((item): item is T => allowed.some((a) => a === item));
  if (known.length < items.length) {
    const unknown = items.filter((item) => !allowed.some((a) => a === item));
    throw new Error(`${flag}: unknown ${unknown.join(', ')} (expected ${allowed.join(', ')})`);
  }
  return known;
}

function positive(value: string | undefined, flag: string, integer = true) {
  if (value === undefined) return undefined;
  const number = Number(value);
  if (!(number > 0) || (integer && !Number.isInteger(number)))
    throw new Error(`${flag} must be a positive ${integer ? 'integer' : 'number'}`);
  return number;
}

function gitCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      'max-usd': { type: 'string' },
      models: { type: 'string' },
      workloads: { type: 'string' },
      efforts: { type: 'string' },
      n: { type: 'string' },
      seed: { type: 'string' },
      concurrency: { type: 'string' },
      resume: { type: 'string' },
    },
  });
  const maxUsd = positive(values['max-usd'], '--max-usd', false);
  let meta: RunMeta;
  let lines: ResultLine[] = [];

  if (values.resume) {
    if (values['dry-run']) throw new Error('--resume and --dry-run are exclusive');
    meta = readMeta(values.resume);
    // A raised cap is kept for later resumes and published by summarize.
    if (maxUsd !== undefined && maxUsd !== meta.args.maxUsd) {
      meta.args.maxUsd = maxUsd;
      writeMeta(meta);
    }
    lines = readLines(meta.runId);
  } else {
    const ids = values.models?.split(',').map((id) => id.trim());
    const models = ids
      ? ids.map((id) => MODELS.find((m) => m.id === id) ?? { id, class: 'premium' as const })
      : [...MODELS];
    const date = new Date();
    const observed = latestObserved();
    const resolved = await resolveModels(
      models,
      async (id) => fetchEndpoints(id, undefined),
      observed,
    );
    meta = {
      runId: date.toISOString().slice(0, 19).replaceAll(':', '-'),
      date: date.toISOString(),
      commit: gitCommit(),
      seed: values.seed === undefined ? Math.floor(Math.random() * 2 ** 31) : Number(values.seed),
      args: {
        maxUsd: maxUsd ?? DEFAULT_MAX_USD,
        workloads: list(values.workloads, WORKLOADS, '--workloads'),
        efforts: list(values.efforts, EFFORTS, '--efforts'),
        n: positive(values.n, '--n') ?? null,
        concurrency: positive(values.concurrency, '--concurrency') ?? 1,
      },
      models: resolved.models,
      endpoints: resolved.endpoints,
      observed,
    };
    if (!Number.isInteger(meta.seed)) throw new Error('--seed must be an integer');
  }

  for (const m of meta.models) {
    console.log(
      `${m.model}: ${m.configs.map((c) => `${c.ids.join('+')}=${c.tag ?? 'auto'}`).join(', ')}` +
        ` (cost basis: ${m.costBasis})`,
    );
    for (const o of m.omitted) console.log(`  omitted ${o.id}: ${o.reason}`);
  }
  const plan = buildPlan(cellsOf(meta.models, meta.args), meta.seed);

  if (values['dry-run']) {
    const { text, overBudget } = formatDryRun(dryRun(plan, meta.endpoints), meta.args.maxUsd);
    console.log(`\n${text}`);
    if (overBudget) process.exitCode = 1;
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is required (except for --dry-run)');
  if (!values.resume) writeMeta(meta);
  console.log(
    `\nrun ${meta.runId} · ${plan.length} units · cap $${meta.args.maxUsd} → ${RESULTS_DIR}`,
  );
  const budget = new Budget(meta.args.maxUsd, spentBy(plan, lines, meta.endpoints));
  const done = doneKeys(lines);
  const retried = new Set(lines.map((line) => line.key)).size - done.size;
  if (retried > 0) console.log(`sending again ${retried} units that got no response`);
  const result = await execute(plan, {
    runId: meta.runId,
    snapshot: meta.endpoints,
    budget,
    concurrency: meta.args.concurrency,
    done,
    deps: {
      send: async (body, timeoutMs) => send(body, { apiKey, timeoutMs }),
      // The entry appears ~9 s after the request: first retry at 2 s, last at ~62 s.
      generation: async (id) => fetchGeneration(id, { apiKey, attempts: 6, delayMs: 2_000 }),
    },
  });
  console.log(`\nspent $${budget.spent.toFixed(4)} · ${result.completed} units run`);
  if (result.refused)
    console.log(
      `budget reached before ${result.refused.key}: ${result.remaining} units left; ` +
        `raise --max-usd and pass --resume ${meta.runId}`,
    );
  if (result.offline) {
    process.exitCode = 1;
    console.log(
      `no response for ${MAX_UNANSWERED} units in a row, up to ${result.offline.key}: ` +
        `check the network and pass --resume ${meta.runId}`,
    );
  }
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

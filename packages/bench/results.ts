import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { EFFORTS, WORKLOADS } from './config.ts';
import { EndpointSnapshot, Observed } from './schema.ts';
import { STRATEGIES } from './strategies.ts';

/**
 * Raw run files (SPEC §7, §8): `results/<runId>.meta.json` describes the run, and
 * `results/<runId>.jsonl` holds one line per request. Metrics only: no response text, no key.
 */

export const RESULTS_DIR = path.join(import.meta.dirname, 'results');

const Strategy = z.enum(STRATEGIES);
const Nullable = z.number().nullable();

export const ResultLine = z.strictObject({
  runId: z.string(),
  /** The unit key; several lines share it for agentic tasks and big-context series. */
  key: z.string(),
  model: z.string(),
  /** Every strategy the configuration stands for (merged configs have several). */
  configs: z.array(Strategy).min(1),
  tag: z.string().nullable(),
  workload: z.enum(WORKLOADS),
  effort: z.enum(EFFORTS),
  /** Index of the unit in its cell; -1 for the warm-up. */
  iteration: z.number().int(),
  warmup: z.boolean(),
  /** Agentic: turn within the task. */
  turn: z.number().int().nonnegative().optional(),
  /** Big-context: request within the series; 0 is the cold call. */
  position: z.number().int().nonnegative().optional(),
  startedAt: z.iso.datetime(),
  status: z.enum([
    'ok',
    'truncated',
    'http_4xx',
    'http_429',
    'http_5xx',
    'timeout',
    'stream_error',
  ]),
  error: z.strictObject({ code: Nullable, message: z.string() }).nullable(),
  finishReason: z.string().nullable(),
  ttftMs: Nullable,
  ttfvtMs: Nullable,
  totalMs: z.number(),
  outputTps: Nullable,
  promptTokens: Nullable,
  completionTokens: Nullable,
  reasoningTokens: Nullable,
  cachedTokens: Nullable,
  costUsd: Nullable,
  /** Number of tool calls in the response; their arguments are not kept. */
  toolCalls: z.number().int().nonnegative(),
  /** From `/generation`: the provider that served the request, and its server-side timings. */
  providerUsed: z.string().nullable(),
  serverLatencyMs: Nullable,
  generationTimeMs: Nullable,
});
export type ResultLine = z.infer<typeof ResultLine>;

export const ResolvedModel = z.strictObject({
  model: z.string(),
  class: z.enum(['open-weight', 'premium']),
  configs: z.array(
    z.strictObject({
      ids: z.array(Strategy).min(1),
      tag: z.string().nullable(),
      fromObserved: z.array(Strategy),
    }),
  ),
  omitted: z.array(z.strictObject({ id: Strategy, reason: z.string() })),
  costBasis: z.enum(['profile', 'input']),
});
export type ResolvedModel = z.infer<typeof ResolvedModel>;

export const RunMeta = z.strictObject({
  runId: z.string(),
  date: z.iso.datetime(),
  commit: z.string(),
  seed: z.number().int(),
  args: z.strictObject({
    maxUsd: z.number().positive(),
    workloads: z.array(z.enum(WORKLOADS)),
    efforts: z.array(z.enum(EFFORTS)),
    /** Repetitions override; null keeps `REPETITIONS`. */
    n: z.number().int().positive().nullable(),
    concurrency: z.number().int().positive(),
  }),
  models: z.array(ResolvedModel),
  endpoints: z.array(EndpointSnapshot),
  observed: Observed.nullable(),
});
export type RunMeta = z.infer<typeof RunMeta>;

export const metaFile = (runId: string, dir = RESULTS_DIR) => path.join(dir, `${runId}.meta.json`);
export const linesFile = (runId: string, dir = RESULTS_DIR) => path.join(dir, `${runId}.jsonl`);
export const providersFile = (runId: string, dir = RESULTS_DIR) =>
  path.join(dir, `${runId}.providers.jsonl`);

/**
 * What `/generation` adds to a line, ~9 s after the request. Stored apart so a unit is written
 * as soon as its requests end; `readLines` merges it back.
 */
export const ProviderRecord = z.strictObject({
  key: z.string(),
  /** The line within its unit: agentic turn, big-context position, else 0. */
  index: z.number().int().nonnegative(),
  providerUsed: z.string().nullable(),
  serverLatencyMs: Nullable,
  generationTimeMs: Nullable,
});
export type ProviderRecord = z.infer<typeof ProviderRecord>;

const indexOf = (line: ResultLine) => line.turn ?? line.position ?? 0;
const recordId = (key: string, index: number) => `${key}\n${index}`;

export function providerRecord(line: ResultLine): ProviderRecord {
  return {
    key: line.key,
    index: indexOf(line),
    providerUsed: line.providerUsed,
    serverLatencyMs: line.serverLatencyMs,
    generationTimeMs: line.generationTimeMs,
  };
}

export function writeMeta(meta: RunMeta, dir = RESULTS_DIR) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(metaFile(meta.runId, dir), `${JSON.stringify(RunMeta.parse(meta), null, 2)}\n`);
}

export function readMeta(runId: string, dir = RESULTS_DIR): RunMeta {
  const file = metaFile(runId, dir);
  if (!existsSync(file)) throw new Error(`No run ${runId}: ${file} is missing`);
  return RunMeta.parse(JSON.parse(readFileSync(file, 'utf8')));
}

function readJsonl<T>(file: string, schema: z.ZodType<T>): T[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => schema.parse(JSON.parse(line)));
}

/**
 * A request that got no response at all (`fetch failed`, the network is down): nothing reached a
 * provider, so it costs nothing and measures nothing. `--resume` sends its unit again.
 */
export const unanswered = (line: ResultLine) =>
  line.status === 'stream_error' && line.error?.message === 'fetch failed';

/**
 * Keeps the last attempt of each unit. A unit is appended in one block whose indexes grow, so a
 * repeated key or a non-growing index starts a new attempt (a unit sent again on `--resume`).
 */
function lastAttempts(lines: ResultLine[]) {
  const attempts = new Map<string, ResultLine[]>();
  let previous: ResultLine | null = null;
  for (const line of lines) {
    const current = attempts.get(line.key);
    if (current && previous?.key === line.key && indexOf(line) > indexOf(previous))
      current.push(line);
    else attempts.set(line.key, [line]);
    previous = line;
  }
  return [...attempts.values()].flat();
}

/**
 * The lines of a run, last attempt of each unit only, with the providers found by `/generation`
 * merged in (the newest record wins).
 */
export function readLines(runId: string, dir = RESULTS_DIR): ResultLine[] {
  const records = new Map(
    readJsonl(providersFile(runId, dir), ProviderRecord).map((r) => [recordId(r.key, r.index), r]),
  );
  return lastAttempts(readJsonl(linesFile(runId, dir), ResultLine)).map((line) => {
    const record = records.get(recordId(line.key, indexOf(line)));
    if (!record) return line;
    const { providerUsed, serverLatencyMs, generationTimeMs } = record;
    return Object.assign(line, { providerUsed, serverLatencyMs, generationTimeMs });
  });
}

const appendJsonl = (file: string, items: unknown[]) => {
  if (items.length > 0) appendFileSync(file, items.map((i) => `${JSON.stringify(i)}\n`).join(''));
};

/** Appends the lines of one finished unit at once, so an interrupted unit leaves nothing. */
export function appendLines(runId: string, lines: ResultLine[], dir = RESULTS_DIR) {
  appendJsonl(linesFile(runId, dir), lines);
}

/** Appends the `/generation` results of a unit already written. */
export function appendProviders(runId: string, lines: ResultLine[], dir = RESULTS_DIR) {
  appendJsonl(providersFile(runId, dir), lines.map(providerRecord));
}

/** The newest run id with a meta file. */
export function latestRunId(ids: string[]): string | null {
  return (
    ids
      .filter((file) => file.endsWith('.meta.json'))
      .map((file) => file.slice(0, -'.meta.json'.length))
      .sort()
      .at(-1) ?? null
  );
}

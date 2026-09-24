/**
 * Exports real-world OpenRouter usage for one app (SPEC §11.9, §12): per model × provider
 * aggregates from `POST /analytics/query`, written to `observed/<to>.json`.
 *
 *   OPENROUTER_MANAGEMENT_KEY=… node observe.ts [--days 30] [--app OpenCode | --app-id 123]
 *
 * Analytics needs a management key (an inference key gets 403). Resolving the app id by name
 * also needs `OPENROUTER_API_KEY`, because only `/generation` maps a generation to its app.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { Observed, type ObservedRow } from './schema.ts';

const API = 'https://openrouter.ai/api/v1';
/** Percentile metrics refuse longer ranges. */
export const MAX_DAYS = 31;
const DAY_MS = 24 * 60 * 60 * 1000;

// `cache_capture_rate` and `possible_*` can't be combined with cost, latency or the app filter.
const METRICS = [
  'request_count',
  'total_usage',
  'tokens_prompt',
  'cached_tokens',
  'tokens_completion',
  'reasoning_tokens',
  'p50_total_time_to_first_token',
  'p95_total_time_to_first_token',
  'p50_throughput',
  'cache_hit_rate',
] as const;
const ROW_LIMIT = 500;

type Fetch = typeof fetch;
export type Period = { from: string; to: string };

/** The last `days` full UTC days; `to` is today at 00:00 UTC and is exclusive. */
export function period(days: number, now = new Date()): Period {
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS)
    throw new Error(`--days must be an integer between 1 and ${MAX_DAYS}`);
  const to = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return { from: isoDate(to - days * DAY_MS), to: isoDate(to) };
}

export function buildQuery(appId: number, { from, to }: Period) {
  return {
    metrics: [...METRICS],
    dimensions: ['model', 'provider'],
    // The app filter takes the numeric id; the display name returns a 500.
    filters: [{ field: 'app', operator: 'eq', value: appId }],
    time_range: { start: `${from}T00:00:00Z`, end: `${to}T00:00:00Z` },
    order_by: { field: 'request_count', direction: 'desc' },
    limit: ROW_LIMIT,
  };
}

// Counts come back as strings ("4139"), rates and latencies as numbers.
const Num = z.union([
  z.number(),
  z
    .string()
    .regex(/^-?\d+(\.\d+)?$/)
    .transform(Number),
]);
const OptionalNum = Num.nullish().transform((value) => value ?? null);

const AnalyticsRow = z.object({
  model: z.string(),
  provider: z.string().nullish(),
  request_count: Num,
  total_usage: Num,
  tokens_prompt: Num,
  cached_tokens: OptionalNum,
  tokens_completion: Num,
  reasoning_tokens: OptionalNum,
  p50_total_time_to_first_token: OptionalNum,
  p95_total_time_to_first_token: OptionalNum,
  p50_throughput: OptionalNum,
  cache_hit_rate: OptionalNum,
});

const AnalyticsResponse = z.object({
  data: z.object({
    data: z.array(z.unknown()),
    metadata: z.object({ truncated: z.boolean() }).loose(),
  }),
});

/** Strips the release date OpenRouter appends to permaslugs: `…-flash-20260910` → `…-flash`. */
export function baseSlug(permaslug: string) {
  return permaslug.replace(/-\d{8}$/, '');
}

/**
 * Maps analytics rows to the whitelisted `ObservedRow` fields. Rows without a provider are
 * dropped: they can't be pinned, so they say nothing about choosing an endpoint.
 */
export function toRows(json: unknown): ObservedRow[] {
  const { data } = AnalyticsResponse.parse(json);
  if (data.metadata.truncated)
    throw new Error(`Analytics returned more than ${ROW_LIMIT} rows; shorten --days`);
  return data.data.flatMap((raw) => {
    const row = AnalyticsRow.parse(raw);
    if (!row.provider) return [];
    return [
      {
        model: baseSlug(row.model),
        permaslug: row.model,
        provider: row.provider,
        requests: row.request_count,
        usageUsd: row.total_usage,
        promptTokens: row.tokens_prompt,
        cachedTokens: row.cached_tokens ?? 0,
        completionTokens: row.tokens_completion,
        reasoningTokens: row.reasoning_tokens ?? 0,
        ttftP50Ms: row.p50_total_time_to_first_token,
        ttftP95Ms: row.p95_total_time_to_first_token,
        tpsP50: row.p50_throughput,
        cacheHitRate: row.cache_hit_rate,
      },
    ];
  });
}

/**
 * Finds the numeric app id from its display name: analytics lists generation ids per app,
 * and `/generation` returns the `app_id` of one of them.
 */
export async function resolveAppId(
  name: string,
  keys: { management: string; api: string | undefined },
  fetchImpl: Fetch = fetch,
  now = new Date(),
): Promise<number> {
  if (!keys.api) throw new Error('Resolving --app needs OPENROUTER_API_KEY; or pass --app-id');
  const json = await post(
    '/analytics/query',
    {
      metrics: ['request_count'],
      dimensions: ['app', 'generation_id'],
      time_range: {
        start: new Date(now.getTime() - 7 * DAY_MS).toISOString(),
        end: now.toISOString(),
      },
      limit: 100,
    },
    keys.management,
    fetchImpl,
  );
  const rows = z
    .object({
      data: z.object({
        data: z.array(z.object({ app: z.string().nullish(), generation_id: z.string() })),
      }),
    })
    .parse(json).data.data;
  const generation = rows.find((row) => row.app === name)?.generation_id;
  if (!generation) throw new Error(`No recent generation from app "${name}"; pass --app-id`);

  const response = await fetchImpl(`${API}/generation?id=${encodeURIComponent(generation)}`, {
    headers: { authorization: `Bearer ${keys.api}` },
  });
  await assertOk(response, '/generation');
  const { data } = z
    .object({ data: z.object({ app_id: z.number().int() }) })
    .parse(await response.json());
  return data.app_id;
}

export async function exportObserved(
  appId: number,
  range: Period,
  managementKey: string,
  fetchImpl: Fetch = fetch,
  now = new Date(),
): Promise<Observed> {
  const json = await post('/analytics/query', buildQuery(appId, range), managementKey, fetchImpl);
  return Observed.parse({ period: range, exportedAt: now.toISOString(), rows: toRows(json) });
}

async function post(route: string, body: unknown, key: string, fetchImpl: Fetch) {
  const response = await fetchImpl(`${API}${route}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  await assertOk(response, route);
  return response.json();
}

async function assertOk(response: Response, route: string) {
  if (response.ok) return;
  const detail = await response.text().catch(() => '');
  throw new Error(
    `OpenRouter ${response.status} (${route})${detail ? `: ${detail.slice(0, 200)}` : ''}`,
  );
}

function isoDate(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

async function main() {
  const { values } = parseArgs({
    options: {
      days: { type: 'string', default: '30' },
      app: { type: 'string', default: 'OpenCode' },
      'app-id': { type: 'string' },
    },
  });
  const management = process.env.OPENROUTER_MANAGEMENT_KEY;
  if (!management)
    throw new Error('OPENROUTER_MANAGEMENT_KEY is required (analytics rejects inference keys)');

  const range = period(Number(values.days));
  const appId = values['app-id']
    ? Number(values['app-id'])
    : await resolveAppId(values.app, { management, api: process.env.OPENROUTER_API_KEY });
  if (!Number.isInteger(appId)) throw new Error('--app-id must be an integer');

  const observed = await exportObserved(appId, range, management);
  const dir = path.join(import.meta.dirname, 'observed');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${range.to}.json`);
  writeFileSync(file, `${JSON.stringify(observed, null, 2)}\n`);

  const requests = observed.rows.reduce((sum, row) => sum + row.requests, 0);
  console.log(
    `${observed.rows.length} rows · ${requests.toLocaleString('en-US')} requests · ${range.from} → ${range.to} → ${path.relative(process.cwd(), file)}`,
  );
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

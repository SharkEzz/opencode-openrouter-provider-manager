import type { Endpoint, Tier } from '../rpc.ts';
import { z } from 'zod';

const API = 'https://openrouter.ai/api/v1';
const TTL = 10 * 60 * 1000;

const RawEndpoint = z
  .object({
    provider_name: z.string().optional(),
    tag: z.string().optional(),
    context_length: z.number().nullable().optional(),
    quantization: z.string().nullable().optional(),
    status: z.number().optional(),
    uptime_last_30m: z.number().nullable().optional(),
    supported_parameters: z.array(z.string()).optional(),
    pricing: z
      .object({
        prompt: z.string().optional(),
        completion: z.string().optional(),
        input_cache_read: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const EndpointResponse = z
  .object({
    data: z
      .object({ endpoints: z.array(RawEndpoint).optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

const ModelsResponse = z
  .object({
    data: z
      .array(
        z
          .object({
            id: z.string(),
            alias_target: z.object({ slug: z.string().optional() }).optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

type RawEndpoint = z.infer<typeof RawEndpoint>;

const cache = new Map<string, { at: number; endpoints: Endpoint[] }>();

/** Test hook: forget every cached listing. */
export function clearEndpointCache() {
  cache.clear();
}

export function perMillion(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = Number(value);
  // OpenRouter uses -1 for "variable pricing" (e.g. the auto router).
  // Round away float noise from the per-token string (0.00000005 * 1e6 = 0.049999…).
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 1e12) / 1e6 : null;
}

export function tierOf(tag: string): Tier {
  const suffix = tag.split('/')[1];
  if (suffix === 'flex') return 'flex';
  if (suffix === 'fast' || suffix === 'priority') return 'priority';
  return 'default';
}

export function normalize(raw: RawEndpoint): Endpoint | undefined {
  if (!raw.tag) return undefined;
  return {
    tag: raw.tag,
    provider: raw.provider_name ?? raw.tag,
    tier: tierOf(raw.tag),
    input: perMillion(raw.pricing?.prompt),
    output: perMillion(raw.pricing?.completion),
    cached: perMillion(raw.pricing?.input_cache_read),
    context: raw.context_length ?? null,
    quantization: raw.quantization && raw.quantization !== 'unknown' ? raw.quantization : null,
    status: raw.status ?? 0,
    uptime: raw.uptime_last_30m ?? null,
    reasoning: raw.supported_parameters?.includes('reasoning') ?? false,
  };
}

async function get<T>(
  url: string,
  apiKey: string | undefined,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
    ...(signal ? { signal } : undefined),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `OpenRouter ${response.status} (${url.slice(API.length)})${detail ? `: ${detail.slice(0, 200)}` : ''}`,
    );
  }
  const json: unknown = await response.json();
  return schema.parse(json);
}

/** Aliases like `~deepseek/deepseek-flash-latest` have no endpoints of their own. */
async function aliasTarget(model: string, apiKey: string | undefined, signal?: AbortSignal) {
  const json = await get(`${API}/models`, apiKey, ModelsResponse, signal);
  return json.data?.find((m) => m.id === model)?.alias_target?.slug;
}

export async function fetchEndpoints(
  model: string,
  apiKey: string | undefined,
  signal?: AbortSignal,
) {
  const hit = cache.get(model);
  if (hit && Date.now() - hit.at < TTL) return hit.endpoints;

  let raw =
    (await get(`${API}/models/${model}/endpoints`, apiKey, EndpointResponse, signal)).data
      ?.endpoints ?? [];
  if (raw.length === 0) {
    const target = await aliasTarget(model, apiKey, signal);
    if (target)
      raw =
        (await get(`${API}/models/${target}/endpoints`, apiKey, EndpointResponse, signal)).data
          ?.endpoints ?? [];
  }
  const endpoints = raw
    .map(normalize)
    .filter((e): e is Endpoint => e !== undefined)
    .sort((a, b) => (a.input ?? Infinity) - (b.input ?? Infinity))
    // A tag can be listed twice; `provider.only` can't tell them apart, so keep the cheapest.
    .filter((endpoint, index, all) => all.findIndex((e) => e.tag === endpoint.tag) === index);

  cache.set(model, { at: Date.now(), endpoints });
  return endpoints;
}

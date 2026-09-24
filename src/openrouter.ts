import type { Endpoint, Tier } from "../rpc.ts"

const API = "https://openrouter.ai/api/v1"
const TTL = 10 * 60 * 1000

interface RawEndpoint {
  provider_name?: string
  tag?: string
  context_length?: number | null
  quantization?: string | null
  status?: number
  uptime_last_30m?: number | null
  supported_parameters?: string[]
  pricing?: { prompt?: string; completion?: string }
}

const cache = new Map<string, { at: number; endpoints: Endpoint[] }>()

/** Test hook: forget every cached listing. */
export function clearEndpointCache() {
  cache.clear()
}

export function perMillion(value: string | undefined): number | null {
  if (value === undefined) return null
  const n = Number(value)
  // OpenRouter uses -1 for "variable pricing" (e.g. the auto router).
  // Round away float noise from the per-token string (0.00000005 * 1e6 = 0.049999…).
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 1e12) / 1e6 : null
}

export function tierOf(tag: string): Tier {
  const suffix = tag.split("/")[1]
  if (suffix === "flex") return "flex"
  if (suffix === "fast" || suffix === "priority") return "priority"
  return "default"
}

export function normalize(raw: RawEndpoint): Endpoint | undefined {
  if (!raw.tag) return undefined
  return {
    tag: raw.tag,
    provider: raw.provider_name ?? raw.tag,
    tier: tierOf(raw.tag),
    input: perMillion(raw.pricing?.prompt),
    output: perMillion(raw.pricing?.completion),
    context: raw.context_length ?? null,
    quantization: raw.quantization && raw.quantization !== "unknown" ? raw.quantization : null,
    status: raw.status ?? 0,
    uptime: raw.uptime_last_30m ?? null,
    reasoning: raw.supported_parameters?.includes("reasoning") ?? false,
  }
}

async function get<T>(url: string, apiKey: string | undefined, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {}, ...(signal ? { signal } : undefined) })
  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`OpenRouter ${response.status} (${url.slice(API.length)})${detail ? `: ${detail.slice(0, 200)}` : ""}`)
  }
  return (await response.json()) as T
}

/** Aliases like `~deepseek/deepseek-flash-latest` have no endpoints of their own. */
async function aliasTarget(model: string, apiKey: string | undefined, signal?: AbortSignal) {
  const json = await get<{ data?: { id: string; alias_target?: { slug?: string } }[] }>(`${API}/models`, apiKey, signal)
  return json.data?.find((m) => m.id === model)?.alias_target?.slug
}

export async function fetchEndpoints(model: string, apiKey: string | undefined, signal?: AbortSignal) {
  const hit = cache.get(model)
  if (hit && Date.now() - hit.at < TTL) return hit.endpoints

  type Response = { data?: { endpoints?: RawEndpoint[] } }
  let raw = (await get<Response>(`${API}/models/${model}/endpoints`, apiKey, signal)).data?.endpoints ?? []
  if (raw.length === 0) {
    const target = await aliasTarget(model, apiKey, signal)
    if (target) raw = (await get<Response>(`${API}/models/${target}/endpoints`, apiKey, signal)).data?.endpoints ?? []
  }
  const endpoints = raw
    .map(normalize)
    .filter((e): e is Endpoint => e !== undefined)
    .sort((a, b) => (a.input ?? Infinity) - (b.input ?? Infinity))
    // A tag can be listed twice; `provider.only` can't tell them apart, so keep the cheapest.
    .filter((endpoint, index, all) => all.findIndex((e) => e.tag === endpoint.tag) === index)

  cache.set(model, { at: Date.now(), endpoints })
  return endpoints
}

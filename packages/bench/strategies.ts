import type { Endpoint } from 'opencode-openrouter-provider-manager/rpc';
import { tierOf } from 'opencode-openrouter-provider-manager/openrouter';
import { pinProvider } from 'opencode-openrouter-provider-manager/pin';
import { MIN_OBSERVED_REQUESTS } from './config.ts';
import type { Observed, ObservedRow, Profile } from './schema.ts';

/**
 * Resolves the compared configurations of one model (SPEC §4) from its endpoint listing, the
 * latest observed export and the `coding-agent` profile.
 */

export const STRATEGIES = [
  'auto',
  'cheapest',
  'fastest',
  'best-cache',
  'default',
  'alt-host',
] as const;
export type StrategyId = (typeof STRATEGIES)[number];

export type Config = {
  /** Strategies resolving to this tag, in `STRATEGIES` order; two or more when merged. */
  ids: StrategyId[];
  /** null for auto: the request body stays untouched. */
  tag: string | null;
  /** The ids picked from observed usage rather than from the catalog. */
  fromObserved: StrategyId[];
};

export type Resolution = {
  configs: Config[];
  omitted: { id: StrategyId; reason: string }[];
  /** How `cheapest` and `alt-host` rank: weighted by the profile, or by input price alone. */
  costBasis: 'profile' | 'input';
};

/** Provider that authored the model: `openai/gpt-6-sol` → `openai`. */
export function origin(model: string): string {
  return model.replace(/^~/, '').split('/')[0] ?? model;
}

const hostOf = (tag: string) => tag.split('/')[0] ?? tag;

/**
 * USD per million tokens of the profile's mix. Cached input falls back to the input price when
 * the endpoint publishes no cache price; reasoning is billed as output. null if a price is unknown.
 */
export function weightedCost(endpoint: Endpoint | undefined, profile: Profile): number | null {
  if (!endpoint) return null;
  const { input, output } = endpoint;
  if (input === null || output === null) return null;
  const { shares } = profile;
  return (
    shares.input * input +
    shares.cachedInput * (endpoint.cached ?? input) +
    (shares.output + shares.reasoning) * output
  );
}

function cheapestOf(endpoints: Endpoint[], cost: (e: Endpoint) => number | null) {
  let best: Endpoint | undefined;
  let bestCost = Infinity;
  for (const endpoint of endpoints) {
    const value = cost(endpoint);
    if (value !== null && value < bestCost) {
      best = endpoint;
      bestCost = value;
    }
  }
  return best;
}

/** Per provider, the observed row with the most requests, if it clears the threshold. */
function observedRows(model: string, observed: Observed | null) {
  const byProvider = new Map<string, ObservedRow>();
  for (const row of observed?.rows ?? []) {
    if (row.model !== model || row.requests < MIN_OBSERVED_REQUESTS) continue;
    const seen = byProvider.get(row.provider);
    if (!seen || row.requests > seen.requests) byProvider.set(row.provider, row);
  }
  return [...byProvider.values()];
}

export function resolveConfigs(
  model: string,
  listing: Endpoint[],
  observed: Observed | null,
  profile: Profile | null,
): Resolution {
  // Same filters as the plugin: no router, one entry per tag (the cheapest by input price).
  const endpoints = listing
    .filter((e) => e.tag !== 'router')
    .toSorted((a, b) => (a.input ?? Infinity) - (b.input ?? Infinity))
    .filter((e, index, all) => all.findIndex((other) => other.tag === e.tag) === index);
  const cost = profile ? (e: Endpoint) => weightedCost(e, profile) : (e: Endpoint) => e.input;
  const author = origin(model);

  const picks: { id: StrategyId; tag: string | null; observed: boolean }[] = [];
  const omitted: Resolution['omitted'] = [];
  const pick = (id: StrategyId, endpoint: Endpoint | undefined, reason: string, obs = false) => {
    if (endpoint) picks.push({ id, tag: endpoint.tag, observed: obs });
    else omitted.push({ id, reason });
  };

  /** The endpoint of an observed provider name: its unsuffixed tag, else its cheapest one. */
  const endpointOf = (provider: string) => {
    const name = provider.toLowerCase();
    const matches = endpoints.filter((e) => e.provider.toLowerCase() === name);
    return matches.find((e) => !e.tag.includes('/')) ?? cheapestOf(matches, cost);
  };
  const rows = observedRows(model, observed);
  const fromObserved = (id: StrategyId, best: ObservedRow | undefined, what: string) => {
    if (!observed) omitted.push({ id, reason: 'no observed export' });
    else if (!best) omitted.push({ id, reason: `no provider with ${what}` });
    else pick(id, endpointOf(best.provider), `observed ${best.provider} has no endpoint`, true);
  };

  picks.push({ id: 'auto', tag: null, observed: false });

  pick('cheapest', cheapestOf(endpoints, cost), 'no endpoint with known prices');

  const priority = endpoints.filter((e) => tierOf(e.tag) === 'priority');
  if (priority.length > 0) pick('fastest', cheapestOf(priority, cost), 'no priced priority tier');
  else
    fromObserved(
      'fastest',
      rows
        .filter((r) => r.ttftP50Ms !== null)
        .toSorted((a, b) => (a.ttftP50Ms ?? 0) - (b.ttftP50Ms ?? 0))[0],
      `a ttft p50 over ${MIN_OBSERVED_REQUESTS} requests`,
    );

  fromObserved(
    'best-cache',
    rows
      .filter((r) => r.cacheHitRate !== null)
      .toSorted((a, b) => (b.cacheHitRate ?? 0) - (a.cacheHitRate ?? 0))[0],
    `a cache hit rate over ${MIN_OBSERVED_REQUESTS} requests`,
  );

  pick(
    'default',
    endpoints.find((e) => e.tag === author),
    `no ${author} endpoint`,
  );

  const hasOrigin = endpoints.some((e) => hostOf(e.tag) === author);
  pick(
    'alt-host',
    cheapestOf(
      endpoints.filter((e) => !hasOrigin || hostOf(e.tag) !== author),
      cost,
    ),
    'no other priced host',
  );

  // Two strategies landing on one tag are a single configuration.
  const configs: Config[] = [];
  for (const { id, tag, observed: obs } of picks) {
    let config = configs.find((c) => c.tag === tag);
    if (!config) configs.push((config = { ids: [], tag, fromObserved: [] }));
    config.ids.push(id);
    if (obs) config.fromObserved.push(id);
  }
  return { configs, omitted, costBasis: profile ? 'profile' : 'input' };
}

/** The request body a configuration sends: untouched for auto, pinned like the plugin does. */
export function buildBody(base: Record<string, unknown>, config: Config): Record<string, unknown> {
  return config.tag === null ? base : pinProvider(base, config.tag);
}

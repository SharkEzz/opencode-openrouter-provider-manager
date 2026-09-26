import { normalize } from 'opencode-openrouter-provider-manager/openrouter';
import type { Endpoint } from 'opencode-openrouter-provider-manager/rpc';
import { describe, expect, it } from 'vitest';
import deepseekListing from '../../plugin/tests/fixtures/deepseek.endpoints.json' with { type: 'json' };
import solListing from '../../plugin/tests/fixtures/gpt-6-sol.endpoints.json' with { type: 'json' };
import { Observed, type Profile } from '../schema.ts';
import { buildBody, origin, resolveConfigs, weightedCost } from '../strategies.ts';
import observedJson from './fixtures/observed.json' with { type: 'json' };

const endpoints = (listing: {
  data: { endpoints: Parameters<typeof normalize>[0][] };
}): Endpoint[] =>
  listing.data.endpoints.map(normalize).filter((e): e is Endpoint => e !== undefined);
const sol = endpoints(solListing);
const deepseek = endpoints(deepseekListing);
const observed = Observed.parse(observedJson);

const profile: Profile = {
  id: 'coding-agent',
  label: 'Coding agent',
  source: 'openrouter-observed',
  shares: { input: 0.05, cachedInput: 0.9, output: 0.04, reasoning: 0.01 },
  n: 100,
};

/** Strategy id → resolved tag, for compact assertions. */
const tags = (resolution: ReturnType<typeof resolveConfigs>) =>
  Object.fromEntries(resolution.configs.flatMap((c) => c.ids.map((id) => [id, c.tag])));

describe('origin', () => {
  it('reads the author of the slug, ignoring the alias marker', () => {
    expect(origin('openai/gpt-6-sol')).toBe('openai');
    expect(origin('~deepseek/deepseek-flash-latest')).toBe('deepseek');
  });
});

describe('weightedCost', () => {
  it('weights each price by the profile and bills reasoning as output', () => {
    const flex = sol.find((e) => e.tag === 'openai/flex');
    expect(weightedCost(flex, profile)).toBeCloseTo(0.05 * 1 + 0.9 * 0.1 + 0.05 * 5);
  });

  it('bills cached input at the input price when no cache price is published', () => {
    const azure = sol.find((e) => e.tag === 'azure');
    expect(weightedCost(azure, profile)).toBeCloseTo(0.95 * 2 + 0.05 * 10);
  });

  it('is null when a needed price is unknown', () => {
    const router = sol.find((e) => e.tag === 'router');
    expect(weightedCost(router, profile)).toBeNull();
  });
});

describe('resolveConfigs', () => {
  it('resolves the OpenAI tiers of gpt-6-sol from the catalog', () => {
    const resolution = resolveConfigs('openai/gpt-6-sol', sol, observed, profile);
    expect(tags(resolution)).toEqual({
      auto: null,
      cheapest: 'openai/flex',
      fastest: 'openai/fast',
      default: 'openai',
      'alt-host': 'azure',
    });
    expect(resolution.omitted).toEqual([
      { id: 'best-cache', reason: 'no provider with a cache hit rate over 50 requests' },
    ]);
    expect(resolution.costBasis).toBe('profile');
    expect(resolution.configs.every((c) => c.fromObserved.length === 0)).toBe(true);
  });

  it('ignores the router and keeps one entry per tag', () => {
    const resolution = resolveConfigs('openai/gpt-6-sol', sol, null, profile);
    const pinned = resolution.configs.map((c) => c.tag);
    expect(pinned).not.toContain('router');
    expect(new Set(pinned).size).toBe(pinned.length);
  });

  it('picks from observed usage above the request threshold, and merges equal tags', () => {
    const resolution = resolveConfigs('deepseek/deepseek-v4.1-flash', deepseek, observed, profile);
    // Groq is faster and caches better, but has only 12 requests.
    expect(resolution.configs).toEqual([
      { ids: ['auto'], tag: null, fromObserved: [] },
      { ids: ['cheapest', 'fastest', 'alt-host'], tag: 'deepinfra/fp8', fromObserved: ['fastest'] },
      { ids: ['best-cache', 'default'], tag: 'deepseek', fromObserved: ['best-cache'] },
    ]);
    expect(resolution.omitted).toEqual([]);
  });

  it('omits the observed strategies without an export', () => {
    const resolution = resolveConfigs('deepseek/deepseek-v4.1-flash', deepseek, null, profile);
    expect(resolution.omitted).toEqual([
      { id: 'fastest', reason: 'no observed export' },
      { id: 'best-cache', reason: 'no observed export' },
    ]);
  });

  it('omits a strategy whose observed provider has no endpoint, and default without an origin', () => {
    // GLM rows only name Chutes; this listing has DeepInfra and DeepSeek hosts, none is z-ai.
    const resolution = resolveConfigs('z-ai/glm-5.3-flash', deepseek, observed, profile);
    expect(resolution.omitted).toEqual([
      { id: 'fastest', reason: 'observed Chutes has no endpoint' },
      { id: 'best-cache', reason: 'observed Chutes has no endpoint' },
      { id: 'default', reason: 'no z-ai endpoint' },
    ]);
    expect(tags(resolution)['alt-host']).toBe('deepinfra/fp8');
  });

  it('ranks by input price alone without a profile', () => {
    const resolution = resolveConfigs('deepseek/deepseek-v4.1-flash', deepseek, null, null);
    expect(resolution.costBasis).toBe('input');
    // DeepSeek has the lowest input price, DeepInfra the lowest weighted cost.
    expect(tags(resolution).cheapest).toBe('deepseek');
  });

  it('never picks an endpoint with an unknown price', () => {
    const ds0 = deepseek[0];
    if (ds0 == undefined) throw new Error('Failed to find deepseek result');
    const unpriced: Endpoint = {
      ...ds0,
      tag: 'free/beta',
      provider: 'Free',
      output: null,
    };
    const resolution = resolveConfigs(
      'deepseek/deepseek-v4.1-flash',
      [unpriced, ...deepseek],
      null,
      profile,
    );
    expect(resolution.configs.map((c) => c.tag)).not.toContain('free/beta');
  });

  it('drops an incompletely priced endpoint from every strategy, even without a profile', () => {
    const ds0 = deepseek[0];
    if (ds0 == undefined) throw new Error('Failed to find deepseek result');
    // Cheapest by input price and the origin tag, but its output price is unknown.
    const unpriced: Endpoint = {
      ...ds0,
      tag: 'deepseek',
      provider: 'DeepSeek',
      input: 0.01,
      output: null,
    };
    const others = deepseek.filter((e) => e.tag !== 'deepseek');
    const resolution = resolveConfigs(
      'deepseek/deepseek-v4.1-flash',
      [unpriced, ...others],
      null,
      null,
    );
    expect(resolution.configs.map((c) => c.tag)).not.toContain('deepseek');
    expect(resolution.omitted).toContainEqual({ id: 'default', reason: 'no deepseek endpoint' });
  });
});

describe('buildBody', () => {
  const base = { model: 'openai/gpt-6-sol', provider: { order: ['azure'], sort: 'price' } };

  it('leaves the auto body untouched', () => {
    expect(buildBody(base, { ids: ['auto'], tag: null, fromObserved: [] })).toBe(base);
  });

  it('pins like the plugin does', () => {
    expect(buildBody(base, { ids: ['cheapest'], tag: 'openai/flex', fromObserved: [] })).toEqual({
      model: 'openai/gpt-6-sol',
      provider: { sort: 'price', only: ['openai/flex'], allow_fallbacks: false },
    });
  });
});

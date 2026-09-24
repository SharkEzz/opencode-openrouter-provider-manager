import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import alias from './fixtures/alias.endpoints.json' with { type: 'json' };
import deepseek from './fixtures/deepseek.endpoints.json' with { type: 'json' };
import sol from './fixtures/gpt-6-sol.endpoints.json' with { type: 'json' };
import models from './fixtures/models.json' with { type: 'json' };
import {
  clearEndpointCache,
  fetchEndpoints,
  normalize,
  perMillion,
  tierOf,
} from '../src/openrouter.ts';

const API = 'https://openrouter.ai/api/v1';

/** Routes fetch calls to fixtures; unknown URLs answer 404. */
function mockFetch(routes: Record<string, unknown>) {
  const fetch = vi.fn<(url: string | URL, _init?: RequestInit) => Promise<Response>>(
    async (url: string | URL, _init?: RequestInit) => {
      const body = routes[String(url)];
      return body === undefined
        ? new Response('model not found', { status: 404 })
        : new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
    },
  );
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

beforeEach(() => clearEndpointCache());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('perMillion', () => {
  it('converts USD per token to USD per million without float noise', () => {
    expect(perMillion('0.00000005')).toBe(0.05);
    expect(perMillion('0.0000022')).toBe(2.2);
    expect(perMillion('0')).toBe(0);
  });
  it('treats variable (-1), missing and invalid prices as unknown', () => {
    expect(perMillion('-1')).toBeNull();
    expect(perMillion(undefined)).toBeNull();
    expect(perMillion('n/a')).toBeNull();
  });
});

describe('tierOf', () => {
  it('reads the tier from the tag suffix', () => {
    expect(tierOf('openai/flex')).toBe('flex');
    expect(tierOf('openai/fast')).toBe('priority');
    expect(tierOf('anthropic/priority')).toBe('priority');
    expect(tierOf('azure/us')).toBe('default');
    expect(tierOf('openai')).toBe('default');
  });
});

describe('normalize', () => {
  it('maps the raw endpoint', () => {
    expect(normalize(sol.data.endpoints[0]!)).toEqual({
      tag: 'openai/fast',
      provider: 'OpenAI',
      tier: 'priority',
      input: 4,
      output: 20,
      context: 1_100_000,
      quantization: null,
      status: 0,
      uptime: 100,
      reasoning: true,
    });
  });
  it('detects endpoints without reasoning support', () => {
    expect(normalize(sol.data.endpoints[2]!)?.reasoning).toBe(false);
  });
  it('skips endpoints without a tag, which provider.only cannot target', () => {
    expect(normalize(sol.data.endpoints[7]!)).toBeUndefined();
  });
});

describe('fetchEndpoints', () => {
  it('sorts by input price with unknown prices last, and drops duplicate tags keeping the cheapest', async () => {
    mockFetch({ [`${API}/models/openai/gpt-6-sol/endpoints`]: sol });
    const endpoints = await fetchEndpoints('openai/gpt-6-sol', undefined);
    expect(endpoints.map((e) => e.tag)).toEqual([
      'openai/flex',
      'openai',
      'azure',
      'azure/us',
      'openai/fast',
      'router',
    ]);
    expect(endpoints.find((e) => e.tag === 'azure/us')?.input).toBe(2.2);
  });

  it('sends the API key only when there is one', async () => {
    const fetch = mockFetch({ [`${API}/models/openai/gpt-6-sol/endpoints`]: sol });
    await fetchEndpoints('openai/gpt-6-sol', 'sk-or-test');
    expect(fetch.mock.calls[0]![1]).toMatchObject({
      headers: { authorization: 'Bearer sk-or-test' },
    });

    clearEndpointCache();
    await fetchEndpoints('openai/gpt-6-sol', undefined);
    expect(fetch.mock.calls[1]![1]).toMatchObject({ headers: {} });
  });

  it('falls back to the alias target when an alias has no endpoints', async () => {
    mockFetch({
      [`${API}/models/~deepseek/deepseek-flash-latest/endpoints`]: alias,
      [`${API}/models`]: models,
      [`${API}/models/deepseek/deepseek-v4.1-flash/endpoints`]: deepseek,
    });
    const endpoints = await fetchEndpoints('~deepseek/deepseek-flash-latest', undefined);
    expect(endpoints.map((e) => e.tag)).toEqual(['deepseek', 'deepinfra/fp8']);
  });

  it('returns an empty list for a model without endpoints that is not an alias', async () => {
    mockFetch({
      [`${API}/models/acme/empty/endpoints`]: { data: { endpoints: [] } },
      [`${API}/models`]: models,
    });
    expect(await fetchEndpoints('acme/empty', undefined)).toEqual([]);
  });

  it('reports HTTP errors with the status', async () => {
    mockFetch({});
    await expect(fetchEndpoints('acme/missing', undefined)).rejects.toThrow(
      /OpenRouter 404.*model not found/,
    );
  });

  it('rejects malformed endpoint data instead of trusting the response shape', async () => {
    mockFetch({
      [`${API}/models/acme/model/endpoints`]: {
        data: { endpoints: [{ tag: 'acme/model', pricing: { prompt: 42 } }] },
      },
    });
    await expect(fetchEndpoints('acme/model', undefined)).rejects.toThrow('expected string');
  });

  it('serves a cached listing for 10 minutes', async () => {
    vi.useFakeTimers();
    const fetch = mockFetch({ [`${API}/models/openai/gpt-6-sol/endpoints`]: sol });
    await fetchEndpoints('openai/gpt-6-sol', undefined);
    vi.advanceTimersByTime(9 * 60 * 1000);
    await fetchEndpoints('openai/gpt-6-sol', undefined);
    expect(fetch).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2 * 60 * 1000);
    await fetchEndpoints('openai/gpt-6-sol', undefined);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

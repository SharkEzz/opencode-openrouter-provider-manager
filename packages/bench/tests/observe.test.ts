import { describe, expect, it, vi } from 'vitest';
import {
  baseSlug,
  buildQuery,
  exportObserved,
  MAX_DAYS,
  period,
  resolveAppId,
  toRows,
} from '../observe.ts';
import { Observed } from '../schema.ts';
import analytics from './fixtures/analytics-query.json' with { type: 'json' };

const NOW = new Date('2026-09-25T15:30:00Z');

function mockFetch(routes: Record<string, unknown>) {
  return vi.fn<typeof fetch>(async (input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const route = Object.keys(routes).find((prefix) => url.includes(prefix));
    if (!route) return new Response('not found', { status: 404 });
    return Response.json(routes[route]);
  });
}

describe('period', () => {
  it('covers the last full UTC days and ends today at midnight, exclusive', () => {
    expect(period(30, NOW)).toEqual({ from: '2026-08-26', to: '2026-09-25' });
  });
  it(`rejects ranges the percentile metrics refuse (over ${MAX_DAYS} days)`, () => {
    expect(() => period(32, NOW)).toThrow(/between 1 and 31/);
    expect(() => period(0, NOW)).toThrow(/between 1 and 31/);
    expect(() => period(1.5, NOW)).toThrow(/between 1 and 31/);
  });
});

describe('buildQuery', () => {
  it('filters on the numeric app id and groups by model and provider', () => {
    const query = buildQuery(2312835, { from: '2026-08-26', to: '2026-09-25' });
    expect(query.filters).toEqual([{ field: 'app', operator: 'eq', value: 2312835 }]);
    expect(query.dimensions).toEqual(['model', 'provider']);
    expect(query.time_range).toEqual({
      start: '2026-08-26T00:00:00Z',
      end: '2026-09-25T00:00:00Z',
    });
  });
  it('leaves out the cache-capture metrics the API refuses to combine', () => {
    const metrics: string[] = buildQuery(1, { from: '2026-08-26', to: '2026-09-25' }).metrics;
    expect(metrics.some((m) => m.startsWith('possible_') || m === 'cache_capture_rate')).toBe(
      false,
    );
  });
});

describe('baseSlug', () => {
  it('drops the release date suffix only', () => {
    expect(baseSlug('deepseek/deepseek-v4.1-flash-20260910')).toBe('deepseek/deepseek-v4.1-flash');
    expect(baseSlug('openai/gpt-6-sol')).toBe('openai/gpt-6-sol');
  });
});

describe('toRows', () => {
  it('coerces string counts and keeps percentiles as numbers', () => {
    expect(toRows(analytics)[0]).toEqual({
      model: 'deepseek/deepseek-v4.1-flash',
      permaslug: 'deepseek/deepseek-v4.1-flash-20260910',
      provider: 'DeepSeek',
      requests: 3681,
      usageUsd: 7.95,
      promptTokens: 956212260,
      cachedTokens: 939187584,
      completionTokens: 3224839,
      reasoningTokens: 1677571,
      ttftP50Ms: 2316,
      ttftP95Ms: 3982,
      tpsP50: 117,
      cacheHitRate: 0.98,
    });
  });
  it('keeps two versions of one model as separate rows', () => {
    const pro = toRows(analytics).filter((row) => row.model === 'deepseek/deepseek-v4-pro');
    expect(pro.map((row) => row.permaslug)).toEqual([
      'deepseek/deepseek-v4-pro-20260813',
      'deepseek/deepseek-v4-pro-20260423',
    ]);
  });
  it('reports missing latency and cache figures as null, and missing counts as 0', () => {
    const old = toRows(analytics).find((row) => row.permaslug.endsWith('20260423'));
    expect(old).toMatchObject({
      cachedTokens: 0,
      reasoningTokens: 0,
      ttftP50Ms: null,
      cacheHitRate: null,
    });
  });
  it('drops rows without a provider, which cannot be pinned', () => {
    expect(toRows(analytics).some((row) => row.model.startsWith('z-ai/'))).toBe(false);
  });
  it('refuses a truncated result instead of exporting a partial one', () => {
    const truncated = { data: { ...analytics.data, metadata: { truncated: true } } };
    expect(() => toRows(truncated)).toThrow(/more than/);
  });
});

describe('exportObserved', () => {
  it('produces a valid Observed document with only whitelisted fields', async () => {
    const fetchMock = mockFetch({
      '/analytics/query': {
        data: {
          ...analytics.data,
          data: analytics.data.data.map((row) =>
            Object.assign({ api_key_id: 42, session_id: 's' }, row),
          ),
        },
      },
    });
    const range = { from: '2026-08-26', to: '2026-09-25' };
    const observed = await exportObserved(2312835, range, 'mgmt-key', fetchMock, NOW);

    expect(Observed.parse(observed)).toEqual(observed);
    expect(observed.period).toEqual(range);
    expect(observed.exportedAt).toBe('2026-09-25T15:30:00.000Z');
    expect(JSON.stringify(observed)).not.toMatch(/api_key_id|session_id|2312835/);
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({
      method: 'POST',
      headers: { authorization: 'Bearer mgmt-key' },
    });
  });
  it('surfaces API errors with their status', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('forbidden', { status: 403 }));
    await expect(
      exportObserved(1, { from: '2026-08-26', to: '2026-09-25' }, 'inference-key', fetchMock, NOW),
    ).rejects.toThrow('OpenRouter 403 (/analytics/query): forbidden');
  });
});

describe('resolveAppId', () => {
  const keys = { management: 'mgmt-key', api: 'sk-or-key' };

  it('maps an app name to its id through one of its generations', async () => {
    const fetchMock = mockFetch({
      '/analytics/query': {
        data: {
          data: [
            { app: 'Claude Code', generation_id: 'gen-other' },
            { app: 'OpenCode', generation_id: 'gen-opencode' },
          ],
        },
      },
      '/generation?id=gen-opencode': { data: { app_id: 2312835 } },
    });
    expect(await resolveAppId('OpenCode', keys, fetchMock, NOW)).toBe(2312835);
    expect(fetchMock.mock.calls[1]![1]).toMatchObject({
      headers: { authorization: 'Bearer sk-or-key' },
    });
  });
  it('asks for --app-id when the app has no recent generation', async () => {
    const fetchMock = mockFetch({ '/analytics/query': { data: { data: [] } } });
    await expect(resolveAppId('OpenCode', keys, fetchMock, NOW)).rejects.toThrow(/--app-id/);
  });
  it('needs an inference key to read /generation', async () => {
    await expect(
      resolveAppId('OpenCode', { management: 'mgmt-key', api: undefined }),
    ).rejects.toThrow(/OPENROUTER_API_KEY/);
  });
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { fakeSummary } from '../fake-summary.ts';
import { profileFromObserved } from '../profiles.ts';
import { Cell, Observed, Profile, Summary } from '../schema.ts';

const observed = Observed.parse({
  period: { from: '2026-08-25', to: '2026-09-24' },
  exportedAt: '2026-09-24T22:57:42.526Z',
  rows: [
    {
      model: 'a/model',
      permaslug: 'a/model-20260101',
      provider: 'Host A',
      requests: 10,
      promptTokens: 1000,
      cachedTokens: 900,
      completionTokens: 100,
      reasoningTokens: 40,
      ttftP50Ms: 1000,
      ttftP95Ms: 2000,
      tpsP50: 50,
      cacheHitRate: 0.9,
    },
  ],
});

const cell = (overrides: Partial<Cell> = {}) => ({
  model: 'a/model',
  workload: 'short',
  effort: 'medium',
  config: 'cheapest',
  tag: 'host-a',
  n: 4,
  ok: 0,
  truncated: 0,
  successRate: 0,
  ttftMs: null,
  totalMs: null,
  outputTps: null,
  costUsd: null,
  cv: null,
  errors: { http_429: 4 },
  ...overrides,
});

describe('profileFromObserved', () => {
  it('splits cached input out of the prompt and reasoning out of the completion', () => {
    const profile = profileFromObserved(observed);
    expect(profile.shares).toEqual({
      input: 100 / 1100,
      cachedInput: 900 / 1100,
      output: 60 / 1100,
      reasoning: 40 / 1100,
    });
    expect(profile).toMatchObject({ id: 'coding-agent', source: 'openrouter-observed', n: 10 });
    expect(Profile.safeParse(profile).success).toBe(true);
  });
  it('refuses an export without tokens', () => {
    expect(() => profileFromObserved({ ...observed, rows: [] })).toThrow(/no tokens/);
  });
});

describe('Summary schema', () => {
  it('accepts a cell with no success and null stats', () => {
    expect(Cell.safeParse(cell()).success).toBe(true);
  });
  it('rejects stats invented for a cell with no success', () => {
    const invented = cell({ ttftMs: { p50: 1, p90: 1, p95: 1, ci50: [1, 1] } });
    expect(Cell.safeParse(invented).success).toBe(false);
  });
  it('rejects a success rate that does not match ok / n', () => {
    expect(Cell.safeParse(cell({ ok: 2, successRate: 0.9 })).success).toBe(false);
  });
  it('requires a null tag exactly for auto', () => {
    expect(Cell.safeParse(cell({ config: 'auto' })).success).toBe(false);
    expect(Cell.safeParse(cell({ tag: null })).success).toBe(false);
  });
  it('rejects profile shares that do not sum to 1', () => {
    const profile = {
      id: 'x',
      label: 'X',
      source: 'bench',
      shares: { input: 0.5, cachedInput: 0.5, output: 0.5, reasoning: 0 },
      n: 0,
    };
    expect(Profile.safeParse(profile).success).toBe(false);
  });
});

describe('fakeSummary', () => {
  it('is marked synthetic and satisfies the schema', () => {
    const summary = fakeSummary(observed);
    expect(summary.run.synthetic).toBe(true);
    expect(summary.observed).toEqual(observed);
    expect(summary.profiles[0]?.id).toBe('coding-agent');
  });
  it('is reproducible: every call replays the same seeded sequence', () => {
    expect(fakeSummary(observed)).toEqual(fakeSummary(observed));
  });
  it('only headlines ratios whose interval excludes 1', () => {
    for (const headline of fakeSummary(null).headlines)
      expect(headline.ci[0] > 1 || headline.ci[1] < 1).toBe(true);
  });
  it('keeps the committed file valid against the schema', () => {
    const file = path.join(import.meta.dirname, '../results/summary.fake.json');
    const summary = Summary.parse(JSON.parse(readFileSync(file, 'utf8')));
    expect(summary.run.synthetic).toBe(true);
  });
});

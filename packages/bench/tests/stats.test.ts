import { describe, expect, it } from 'vitest';
import { cv, iqr, median, quantile, ratioCi, rng, spread, stat } from '../stats.ts';

const sample = (seed: number, size: number, scale = 1) => {
  const random = rng(seed);
  return Array.from({ length: size }, () => scale * (100 + 20 * random()));
};

describe('quantile', () => {
  it('interpolates between closest ranks', () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(quantile([10, 20, 30], 0.95)).toBeCloseTo(29);
    expect(quantile([7], 0.9)).toBe(7);
  });
});

describe('stat', () => {
  it('is null without values', () => {
    expect(stat([], 0)).toBeNull();
  });

  it('reports percentiles and a bootstrap interval that contains the median', () => {
    const values = sample(1, 15);
    const result = stat(values, 3)!;
    expect(result.p50).toBeCloseTo(median(values), 3);
    expect(result.p50).toBeLessThanOrEqual(result.p90);
    expect(result.p90).toBeLessThanOrEqual(result.p95);
    expect(result.ci50[0]).toBeLessThanOrEqual(result.p50);
    expect(result.ci50[1]).toBeGreaterThanOrEqual(result.p50);
  });

  it('is deterministic for a given seed', () => {
    const values = sample(2, 8);
    expect(stat(values, 3, 42)).toEqual(stat(values, 3, 42));
  });
});

describe('dispersion', () => {
  it('computes the coefficient of variation, IQR and p95/p50 spread', () => {
    expect(cv([2, 4, 4, 4, 5, 5, 7, 9])).toBe(0.4);
    expect(cv([0, 0])).toBe(0);
    expect(iqr([1, 2, 3, 4, 5])).toBe(2);
    expect(spread([1, 1, 1])).toBe(1);
  });
});

describe('ratioCi', () => {
  it('is about 1 for two draws of the same distribution, with an interval around 1', () => {
    const result = ratioCi(sample(3, 15), sample(4, 15), median)!;
    expect(result.ratio).toBeGreaterThan(0.9);
    expect(result.ratio).toBeLessThan(1.1);
    expect(result.ci[0]).toBeLessThanOrEqual(1);
    expect(result.ci[1]).toBeGreaterThanOrEqual(1);
  });

  it('excludes 1 for clearly separated samples', () => {
    const result = ratioCi(sample(5, 8, 0.5), sample(6, 8), median)!;
    expect(result.ratio).toBeCloseTo(0.5, 1);
    expect(result.ci[1]).toBeLessThan(1);
  });

  it('is null without values or with a zero denominator', () => {
    expect(ratioCi([], [1], median)).toBeNull();
    expect(ratioCi([1], [0], median)).toBeNull();
  });
});

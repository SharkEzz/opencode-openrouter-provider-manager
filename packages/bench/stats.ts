import type { Stat } from './schema.ts';

/** Descriptive statistics and seeded bootstrap intervals (SPEC §9). */

const BOOTSTRAP_ITERATIONS = 1_000;
/** Fixed seed: the same values always give the same interval. */
export const BOOTSTRAP_SEED = 20260926;

/** mulberry32: small, seedable, good enough for resampling and shuffling. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Linear interpolation between closest ranks; `sorted` must be ascending and non-empty. */
export function quantile(sorted: number[], q: number) {
  const index = (sorted.length - 1) * q;
  const low = Math.floor(index);
  const high = Math.ceil(index);
  return sorted[low]! + (sorted[high]! - sorted[low]!) * (index - low);
}

export const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const ascending = (values: number[]) => values.toSorted((a, b) => a - b);
export const median = (values: number[]) => quantile(ascending(values), 0.5);

function resample<T>(values: T[], random: () => number): T[] {
  return values.map(() => values[Math.floor(random() * values.length)]!);
}

/** The 95% interval of `fn` over bootstrap resamples; non-finite results are dropped. */
function interval(draws: number[]): [number, number] | null {
  const finite = ascending(draws.filter(Number.isFinite));
  if (finite.length === 0) return null;
  return [quantile(finite, 0.025), quantile(finite, 0.975)];
}

/** p50/p90/p95 and the bootstrap 95% CI of the median; null without values. */
export function stat(values: number[], decimals: number, seed = BOOTSTRAP_SEED): Stat | null {
  if (values.length === 0) return null;
  const sorted = ascending(values);
  const random = rng(seed);
  const draws = Array.from({ length: BOOTSTRAP_ITERATIONS }, () =>
    median(resample(values, random)),
  );
  const [low, high] = interval(draws)!;
  return {
    p50: round(quantile(sorted, 0.5), decimals),
    p90: round(quantile(sorted, 0.9), decimals),
    p95: round(quantile(sorted, 0.95), decimals),
    ci50: [round(low, decimals), round(high, decimals)],
  };
}

/** Coefficient of variation (population standard deviation over the mean). */
export function cv(values: number[]) {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return round(Math.sqrt(variance) / mean, 3);
}

export function iqr(values: number[]) {
  const sorted = ascending(values);
  return quantile(sorted, 0.75) - quantile(sorted, 0.25);
}

/**
 * `fn(a) / fn(b)` with a 95% CI from resampling both samples independently. null when either
 * sample is empty or the ratio is not a positive finite number.
 */
export function ratioCi<T>(
  a: T[],
  b: T[],
  fn: (values: T[]) => number,
  seed = BOOTSTRAP_SEED,
): { ratio: number; ci: [number, number] } | null {
  if (a.length === 0 || b.length === 0) return null;
  const ratio = fn(a) / fn(b);
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  const random = rng(seed);
  const draws = Array.from(
    { length: BOOTSTRAP_ITERATIONS },
    () => fn(resample(a, random)) / fn(resample(b, random)),
  );
  const ci = interval(draws);
  if (!ci) return null;
  return { ratio: round(ratio, 3), ci: [round(ci[0], 3), round(ci[1], 3)] };
}

/** p95 / p50: the spread of a latency distribution. */
export const spread = (values: number[]) => {
  const sorted = ascending(values);
  return quantile(sorted, 0.95) / quantile(sorted, 0.5);
};

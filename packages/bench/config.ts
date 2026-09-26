/**
 * The benchmark matrix (SPEC §3, §5, §8). Starting values: the dry-run settles the final ones,
 * and `run.ts` overrides them from the command line.
 */

export const EFFORTS = ['low', 'medium', 'high'] as const;
export type Effort = (typeof EFFORTS)[number];

export const WORKLOADS = ['short', 'long', 'agentic', 'big-context'] as const;
export type Workload = (typeof WORKLOADS)[number];

/** `open-weight` models are cheap, so they get more repetitions than `premium` ones. */
export type ModelClass = 'open-weight' | 'premium';

export const MODELS: readonly { id: string; class: ModelClass }[] = [
  { id: 'z-ai/glm-5.3-flash', class: 'open-weight' },
  { id: 'deepseek/deepseek-v4.1-flash', class: 'open-weight' },
  { id: 'openai/gpt-6-sol', class: 'premium' },
];

/**
 * `max_tokens` per workload × effort. It includes reasoning tokens, so it grows with the effort.
 * Agentic is per turn. A missing effort is not measured for that workload.
 */
export const MAX_TOKENS: Record<Workload, Partial<Record<Effort, number>>> = {
  // Mini-runs: short barely reasons at any effort, so one level is enough. On long, deepseek
  // reasons ~1.8k tokens at low then writes ~3k: 4k truncated it.
  short: { medium: 4_000 },
  long: { low: 8_000, medium: 12_000, high: 16_000 },
  agentic: { medium: 4_000 },
  'big-context': { medium: 4_000 },
};

/**
 * Repetitions per cell, warm-up excluded. Premium is trimmed to fit the $5 budget: agentic 4
 * tasks, big-context one series of 5.
 */
export const REPETITIONS: Record<Workload, Record<ModelClass, number>> = {
  short: { 'open-weight': 8, premium: 4 },
  long: { 'open-weight': 8, premium: 4 },
  agentic: { 'open-weight': 15, premium: 4 },
  'big-context': { 'open-weight': 15, premium: 5 },
};

/** Efforts a model class skips on a workload: premium long costs too much at low and high. */
export const SKIPPED_EFFORTS: Partial<Record<ModelClass, Partial<Record<Workload, Effort[]>>>> = {
  premium: { long: ['low', 'high'] },
};

/** The efforts measured for a workload (and a model class), in `EFFORTS` order. */
export function effortsOf(workload: Workload, modelClass?: ModelClass): Effort[] {
  const skipped = (modelClass && SKIPPED_EFFORTS[modelClass]?.[workload]) ?? [];
  return EFFORTS.filter(
    (effort) => MAX_TOKENS[workload][effort] !== undefined && !skipped.includes(effort),
  );
}

/** Strategies picked from observed usage ignore providers below this many requests. */
export const MIN_OBSERVED_REQUESTS = 50;
export const DEFAULT_MAX_USD = 5;
export const MAX_AGENTIC_TURNS = 8;
/** Below this many successes on either side, a bootstrap interval is meaningless: no headline. */
export const MIN_HEADLINE_N = 5;

/** Requests of one big-context series: one cold call, then calls on the cached prefix (SPEC §5). */
export const SERIES_LENGTH = 5;

/**
 * Reasoning tokens expected per request, for the dry-run estimate only (never for reservation).
 * short and long come from the mini-runs of 2026-09-26 (medians across models, rounded up;
 * deepseek reasons the most); agentic and big-context are not measured yet.
 */
export const EXPECTED_REASONING: Record<Workload, Partial<Record<Effort, number>>> = {
  short: { medium: 64 },
  long: { low: 1_000, medium: 1_500, high: 4_000 },
  agentic: { medium: 1_024 },
  'big-context': { medium: 1_024 },
};

/**
 * Slowest decode rate the request timeout allows for: a complete answer at `max_tokens` must not
 * time out on a slow but working endpoint (mini-runs saw 70–100 tok/s on some hosts).
 */
export const MIN_TIMEOUT_TPS = 40;

export function timeoutFor(maxTokens: number) {
  return 60_000 + (maxTokens * 1_000) / MIN_TIMEOUT_TPS;
}

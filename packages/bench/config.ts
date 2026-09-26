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
  short: { low: 2_000, medium: 4_000, high: 8_000 },
  long: { low: 4_000, medium: 8_000, high: 16_000 },
  agentic: { medium: 4_000 },
  'big-context': { medium: 4_000 },
};

/** Repetitions per cell, warm-up excluded. */
export const REPETITIONS: Record<Workload, Record<ModelClass, number>> = {
  short: { 'open-weight': 8, premium: 4 },
  long: { 'open-weight': 8, premium: 4 },
  agentic: { 'open-weight': 15, premium: 6 },
  'big-context': { 'open-weight': 15, premium: 6 },
};

/** The efforts measured for a workload, in `EFFORTS` order. */
export function effortsOf(workload: Workload): Effort[] {
  return EFFORTS.filter((effort) => MAX_TOKENS[workload][effort] !== undefined);
}

/** Strategies picked from observed usage ignore providers below this many requests. */
export const MIN_OBSERVED_REQUESTS = 50;
export const DEFAULT_MAX_USD = 5;
export const MAX_AGENTIC_TURNS = 8;

/** Requests of one big-context series: one cold call, then calls on the cached prefix (SPEC §5). */
export const SERIES_LENGTH = 5;

/** Reasoning tokens expected per request, for the dry-run estimate only (never for reservation). */
export const EXPECTED_REASONING: Record<Effort, number> = { low: 256, medium: 1_024, high: 3_072 };

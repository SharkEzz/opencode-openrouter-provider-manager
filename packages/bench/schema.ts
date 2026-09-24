import { z } from 'zod';

/**
 * Real-world usage exported from the OpenRouter analytics API (SPEC §10, §11.9).
 * Only aggregates: no app, key, session or generation id may appear here.
 */
export const ObservedRow = z.strictObject({
  /** Slug without its date suffix, e.g. "deepseek/deepseek-v4.1-flash". */
  model: z.string(),
  /** Exact dated slug; two versions of one model stay separate rows. */
  permaslug: z.string(),
  /** Hosting provider as OpenRouter names it, e.g. "DeepInfra". */
  provider: z.string(),
  requests: z.number().int().nonnegative(),
  promptTokens: z.number().int().nonnegative(),
  cachedTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  reasoningTokens: z.number().int().nonnegative(),
  ttftP50Ms: z.number().nonnegative().nullable(),
  ttftP95Ms: z.number().nonnegative().nullable(),
  tpsP50: z.number().nonnegative().nullable(),
  cacheHitRate: z.number().min(0).max(1).nullable(),
});
export type ObservedRow = z.infer<typeof ObservedRow>;

export const Observed = z.strictObject({
  /** UTC dates (YYYY-MM-DD), `to` exclusive; at most 31 days because of percentile metrics. */
  period: z.strictObject({ from: z.iso.date(), to: z.iso.date() }),
  exportedAt: z.iso.datetime(),
  rows: z.array(ObservedRow),
});
export type Observed = z.infer<typeof Observed>;

/* ------------------------------------------------------------------------------------------ */
/* summary.json: the contract with the site (SPEC §10).                                        */
/* ------------------------------------------------------------------------------------------ */

const Interval = z
  .tuple([z.number(), z.number()])
  .refine(([low, high]) => low <= high, 'interval bounds are reversed');

export const Tier = z.enum(['flex', 'default', 'priority']);

export const Run = z.strictObject({
  id: z.string(),
  date: z.iso.datetime(),
  commit: z.string(),
  seed: z.number().int(),
  maxUsd: z.number().positive(),
  spentUsd: z.number().nonnegative(),
  /** Generated, not measured. The site shows a banner and refuses a production build (§11.8). */
  synthetic: z.boolean(),
});

export const Headline = z.strictObject({
  metric: z.enum(['cost', 'ttft', 'stability', 'cacheHit']),
  model: z.string(),
  config: z.string(),
  workload: z.string(),
  effort: z.string(),
  value: z.number(),
  /** The Auto value. */
  baseline: z.number(),
  ratio: z.number().positive(),
  ci: Interval,
  /** Successes of the pinned config behind the figure. */
  n: z.number().int().positive(),
});

export const Stat = z.strictObject({
  p50: z.number(),
  p90: z.number(),
  p95: z.number(),
  ci50: Interval,
});

const VsAuto = z.strictObject({
  ttft: z.number().positive(),
  cost: z.number().positive(),
  /** Ratio of the p95/p50 TTFT spreads. */
  stability: z.number().positive(),
  /** Ratio of cache ratios; null outside big-context. */
  cacheHit: z.number().positive().nullable(),
  ci: z.strictObject({
    ttft: Interval,
    cost: Interval,
    stability: Interval,
    cacheHit: Interval.nullable(),
  }),
});

export const Cell = z
  .strictObject({
    model: z.string(),
    workload: z.string(),
    effort: z.string(),
    config: z.string(),
    /** null for auto. */
    tag: z.string().nullable(),
    /** Attempts, warm-up excluded. */
    n: z.number().int().nonnegative(),
    ok: z.number().int().nonnegative(),
    /** Cut by max_tokens: neither a success nor an error. */
    truncated: z.number().int().nonnegative(),
    successRate: z.number().min(0).max(1),
    // null when ok === 0: no value is ever made up.
    ttftMs: Stat.nullable(),
    totalMs: Stat.nullable(),
    outputTps: Stat.nullable(),
    costUsd: Stat.nullable(),
    cv: z.strictObject({ ttftMs: z.number(), totalMs: z.number() }).nullable(),
    /** null when the config or auto has no success. */
    vsAuto: VsAuto.nullable().optional(),
    cacheRatio: z.number().min(0).max(1).optional(),
    coldVsCached: z.strictObject({ coldUsd: z.number(), cachedUsd: z.number() }).optional(),
    /** auto only: share of requests per hosting provider. */
    providers: z.record(z.string(), z.number().min(0).max(1)).optional(),
    /** auto × agentic: share of tasks whose provider changed mid-task. */
    providerSwitchRate: z.number().min(0).max(1).optional(),
    /** Includes truncated. */
    errors: z.record(z.string(), z.number().int().nonnegative()),
  })
  .superRefine((cell, ctx) => {
    if (cell.ok + cell.truncated > cell.n)
      ctx.addIssue({ code: 'custom', message: 'ok + truncated exceeds n' });
    if (cell.n > 0 && Math.abs(cell.successRate - cell.ok / cell.n) > 1e-9)
      ctx.addIssue({ code: 'custom', message: 'successRate must equal ok / n' });
    const stats = [cell.ttftMs, cell.totalMs, cell.outputTps, cell.costUsd];
    if (cell.ok === 0 && stats.some((stat) => stat !== null))
      ctx.addIssue({ code: 'custom', message: 'stats must be null when ok is 0' });
    if ((cell.config === 'auto') !== (cell.tag === null))
      ctx.addIssue({ code: 'custom', message: 'tag must be null exactly for auto' });
  });

/** An endpoint as listed by /endpoints when the run started (the plugin's Endpoint + model). */
export const EndpointSnapshot = z.strictObject({
  model: z.string(),
  tag: z.string(),
  provider: z.string(),
  tier: Tier,
  input: z.number().nullable(),
  output: z.number().nullable(),
  cached: z.number().nullable(),
  context: z.number().nullable(),
  quantization: z.string().nullable(),
  status: z.number(),
  uptime: z.number().nullable(),
});

export const CostModel = z.strictObject({
  model: z.string(),
  config: z.string(),
  inputPerM: z.number().nonnegative(),
  outputPerM: z.number().nonnegative(),
  /** null when the endpoint does not publish input_cache_read. */
  cachedPerM: z.number().nonnegative().nullable(),
});

export const Profile = z
  .strictObject({
    id: z.string(),
    /** English label shown on the site. */
    label: z.string(),
    source: z.enum(['bench', 'opencode-history', 'openrouter-observed']),
    /** Shares of the total token volume; reasoning is billed as output. */
    shares: z.strictObject({
      input: z.number().min(0).max(1),
      cachedInput: z.number().min(0).max(1),
      output: z.number().min(0).max(1),
      reasoning: z.number().min(0).max(1),
    }),
    n: z.number().int().nonnegative(),
    period: z.strictObject({ from: z.iso.date(), to: z.iso.date() }).optional(),
  })
  .refine(
    ({ shares }) =>
      Math.abs(shares.input + shares.cachedInput + shares.output + shares.reasoning - 1) < 1e-6,
    'profile shares must sum to 1',
  );

export const Sample = z.strictObject({
  model: z.string(),
  workload: z.string(),
  effort: z.string(),
  config: z.string(),
  /** Seconds since the run started. */
  t: z.number().nonnegative(),
  ttftMs: z.number().nonnegative().nullable(),
  outputTps: z.number().nonnegative().nullable(),
  costUsd: z.number().nonnegative().nullable(),
  ok: z.boolean(),
});

export const Summary = z.strictObject({
  version: z.literal(1),
  run: Run,
  headlines: z.array(Headline),
  cells: z.array(Cell),
  endpoints: z.array(EndpointSnapshot),
  costModel: z.array(CostModel),
  profiles: z.array(Profile),
  samples: z.array(Sample),
  observed: Observed.nullable(),
});
export type Summary = z.infer<typeof Summary>;
export type Cell = z.infer<typeof Cell>;
export type Stat = z.infer<typeof Stat>;
export type Profile = z.infer<typeof Profile>;
export type CostModel = z.infer<typeof CostModel>;
export type EndpointSnapshot = z.infer<typeof EndpointSnapshot>;
export type Sample = z.infer<typeof Sample>;
export type Headline = z.infer<typeof Headline>;

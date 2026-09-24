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

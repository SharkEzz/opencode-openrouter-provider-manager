/**
 * Writes `results/summary.fake.json`: a **synthetic** summary shaped like a real run, so the
 * site can be built before the first measured run (SPEC §10). `run.synthetic` is true, and the
 * site refuses to ship it (§11.8). Only `observed` and the `coding-agent` profile are real:
 * they come from the latest `observed/*.json` export.
 *
 *   node fake-summary.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { latestObserved } from './observe.ts';
import { profileFromObserved } from './profiles.ts';
import {
  type Cell,
  type CostModel,
  type EndpointSnapshot,
  type Headline,
  type Observed,
  type Profile,
  type Sample,
  type Stat,
  Summary,
} from './schema.ts';
import { quantile, rng, round } from './stats.ts';

const SEED = 20260925;

type Config = {
  id: string;
  /** null for auto. */
  tag: string | null;
  ttft: number;
  cost: number;
  success: number;
  cacheRatio: number;
  /** Log-normal sigma of the TTFT: Auto spreads more because it changes hosts. */
  spread: number;
};

type ModelSpec = {
  model: string;
  /** Workload scale: open-weight models get the most repetitions (SPEC §8). */
  n: { core: number; light: number };
  ttft: number;
  cost: number;
  endpoints: Omit<EndpointSnapshot, 'model'>[];
  configs: Config[];
  autoProviders: Record<string, number>;
};

const endpoint = (
  tag: string,
  provider: string,
  input: number,
  output: number,
  cached: number | null,
  tier: EndpointSnapshot['tier'] = 'default',
): Omit<EndpointSnapshot, 'model'> => ({
  tag,
  provider,
  tier,
  input,
  output,
  cached,
  context: 1_048_576,
  quantization: null,
  status: 0,
  uptime: 99.5,
  reasoning: true,
});

const auto = (spread = 0.5): Config => ({
  id: 'auto',
  tag: null,
  ttft: 1,
  cost: 1,
  success: 0.99,
  cacheRatio: 0.62,
  spread,
});
const pin = (
  id: string,
  tag: string,
  ttft: number,
  cost: number,
  cacheRatio: number,
  success = 0.97,
): Config => ({ id, tag, ttft, cost, success, cacheRatio, spread: 0.22 });

const MODELS: ModelSpec[] = [
  {
    model: 'z-ai/glm-5.3-flash',
    n: { core: 15, light: 8 },
    ttft: 1,
    cost: 1,
    endpoints: [
      endpoint('siliconflow', 'SiliconFlow', 0.06, 0.4, 0.012),
      endpoint('parasail', 'Parasail', 0.08, 0.45, 0.016),
      endpoint('z-ai', 'Z.AI', 0.1, 0.5, 0.01),
      endpoint('together', 'Together', 0.12, 0.6, 0.03),
    ],
    configs: [
      auto(0.6),
      pin('cheapest', 'siliconflow', 1.7, 0.72, 0.9, 0.93),
      pin('fastest', 'together', 0.42, 1.18, 0.88),
      pin('best-cache', 'z-ai', 1.05, 0.81, 0.98),
      pin('alt-host', 'parasail', 0.9, 0.95, 0.94),
    ],
    autoProviders: { 'Z.AI': 0.41, Parasail: 0.27, GMICloud: 0.19, SiliconFlow: 0.13 },
  },
  {
    model: 'deepseek/deepseek-v4.1-flash',
    n: { core: 15, light: 8 },
    ttft: 1.1,
    cost: 1.3,
    endpoints: [
      endpoint('morph', 'Morph', 0.075, 0.3, 0.0015),
      endpoint('deepseek', 'DeepSeek', 0.04, 1, 0.01),
      endpoint('relace', 'Relace', 0.1, 0.5, 0.01),
      endpoint('deepinfra/fp8', 'DeepInfra', 0.14, 0.42, 0.0042),
    ],
    configs: [
      auto(0.45),
      pin('cheapest', 'morph', 1.9, 0.78, 0.9, 0.95),
      pin('fastest', 'relace', 0.88, 1.05, 0.92),
      pin('best-cache', 'deepseek', 1, 0.83, 0.98),
      pin('alt-host', 'deepinfra/fp8', 1.35, 0.97, 0.85),
    ],
    autoProviders: { DeepSeek: 0.52, Morph: 0.21, Relace: 0.15, DeepInfra: 0.12 },
  },
  {
    model: 'openai/gpt-6-sol',
    n: { core: 6, light: 4 },
    ttft: 1.3,
    cost: 8,
    endpoints: [
      endpoint('openai/flex', 'OpenAI', 1, 5, 0.1, 'flex'),
      endpoint('openai', 'OpenAI', 2, 10, 0.2),
      endpoint('azure', 'Azure', 2, 10, null),
      endpoint('openai/fast', 'OpenAI', 4, 20, 0.4, 'priority'),
    ],
    configs: [
      auto(0.3),
      pin('cheapest', 'openai/flex', 2.6, 0.5, 0.9, 0.9),
      pin('fastest', 'openai/fast', 0.6, 2, 0.9),
      pin('default', 'openai', 1, 1, 0.9),
      pin('alt-host', 'azure', 1.1, 1.02, 0.7),
    ],
    autoProviders: { OpenAI: 0.86, Azure: 0.14 },
  },
];

const WORKLOADS = [
  {
    id: 'short',
    efforts: ['low', 'medium', 'high'],
    core: false,
    ttft: 1400,
    tps: 70,
    cost: 0.0004,
  },
  { id: 'long', efforts: ['low', 'medium', 'high'], core: false, ttft: 1700, tps: 65, cost: 0.004 },
  { id: 'agentic', efforts: ['medium'], core: true, ttft: 2400, tps: 55, cost: 0.05 },
  { id: 'big-context', efforts: ['medium'], core: true, ttft: 3800, tps: 50, cost: 0.012 },
] as const;
const EFFORT = {
  low: { ttft: 0.8, cost: 0.8 },
  medium: { ttft: 1, cost: 1 },
  high: { ttft: 1.5, cost: 1.6 },
};

// Reset by fakeSummary() so every call replays the same sequence from SEED.
let random = rng(SEED);
/** Log-normal multiplier with median 1 (Box–Muller). */
function logNormal(sigma: number) {
  const u = Math.max(random(), 1e-12);
  const v = random();
  return Math.exp(sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
}

/** Synthetic: the CI is a flat ±10% band, not a bootstrap. */
function stat(values: number[], decimals: number): Stat | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const p50 = quantile(sorted, 0.5);
  return {
    p50: round(p50, decimals),
    p90: round(quantile(sorted, 0.9), decimals),
    p95: round(quantile(sorted, 0.95), decimals),
    ci50: [round(p50 * 0.9, decimals), round(p50 * 1.1, decimals)],
  };
}
function cv(values: number[]) {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return round(Math.sqrt(variance) / mean, 3);
}
const band = (ratio: number): [number, number] => [round(ratio * 0.85, 3), round(ratio * 1.15, 3)];

export function fakeSummary(observed: Observed | null): Summary {
  random = rng(SEED);
  const cells: Cell[] = [];
  const samples: Sample[] = [];
  let clock = 0;

  for (const spec of MODELS) {
    for (const workload of WORKLOADS) {
      for (const effort of workload.efforts) {
        const n = workload.core ? spec.n.core : spec.n.light;
        const perConfig = spec.configs.map((config) => {
          const ttft: number[] = [];
          const total: number[] = [];
          const tps: number[] = [];
          const cost: number[] = [];
          let ok = 0;
          for (let i = 0; i < n; i++) {
            clock += 4 + random() * 8;
            const success = random() < config.success;
            const t =
              workload.ttft *
              EFFORT[effort].ttft *
              spec.ttft *
              config.ttft *
              logNormal(config.spread);
            const speed = (workload.tps / config.ttft ** 0.3) * logNormal(0.15);
            const price =
              workload.cost * EFFORT[effort].cost * spec.cost * config.cost * logNormal(0.1);
            samples.push({
              model: spec.model,
              workload: workload.id,
              effort,
              config: config.id,
              t: round(clock, 1),
              ttftMs: success ? round(t, 0) : null,
              outputTps: success ? round(speed, 1) : null,
              costUsd: success ? round(price, 6) : null,
              ok: success,
            });
            if (!success) continue;
            ok++;
            ttft.push(t);
            tps.push(speed);
            cost.push(price);
            total.push(t + (workload.id === 'short' ? 60 : 1500) * (1000 / speed));
          }
          return { config, n, ok, ttft, total, tps, cost };
        });

        const autoRun = perConfig[0]!;
        for (const run of perConfig) {
          const { config } = run;
          const ttftStat = stat(run.ttft, 0);
          const costStat = stat(run.cost, 6);
          const autoTtft = stat(autoRun.ttft, 0);
          const autoCost = stat(autoRun.cost, 6);
          const isBigContext = workload.id === 'big-context';
          const cell: Cell = {
            model: spec.model,
            workload: workload.id,
            effort,
            config: config.id,
            tag: config.tag,
            n: run.n,
            ok: run.ok,
            truncated: 0,
            successRate: run.ok / run.n,
            ttftMs: ttftStat,
            totalMs: stat(run.total, 0),
            outputTps: stat(run.tps, 1),
            costUsd: costStat,
            cv: run.ok ? { ttftMs: cv(run.ttft), totalMs: cv(run.total) } : null,
            errors: run.n - run.ok ? { http_429: run.n - run.ok } : {},
          };
          if (isBigContext) {
            cell.cacheRatio = config.cacheRatio;
            if (costStat)
              cell.coldVsCached = {
                coldUsd: round(costStat.p50 * 2.6, 6),
                cachedUsd: round(costStat.p50 * 0.55, 6),
              };
          }
          if (config.id === 'auto') {
            cell.providers = spec.autoProviders;
            if (workload.id === 'agentic') cell.providerSwitchRate = 0.34;
          } else if (ttftStat && costStat && autoTtft && autoCost) {
            const ttft = round(ttftStat.p50 / autoTtft.p50, 3);
            const cost = round(costStat.p50 / autoCost.p50, 3);
            const stability = round(ttftStat.p95 / ttftStat.p50 / (autoTtft.p95 / autoTtft.p50), 3);
            const cacheHit = isBigContext ? round(config.cacheRatio / 0.62, 3) : null;
            cell.vsAuto = {
              ttft,
              cost,
              stability,
              cacheHit,
              ci: {
                ttft: band(ttft),
                cost: band(cost),
                stability: band(stability),
                cacheHit: cacheHit === null ? null : band(cacheHit),
              },
            };
          } else {
            cell.vsAuto = null;
          }
          cells.push(cell);
        }
      }
    }
  }

  const headlines: Headline[] = [];
  const pick = (metric: Headline['metric'], config: string, workload: string) => {
    for (const cell of cells) {
      if (cell.config !== config || cell.workload !== workload || cell.effort !== 'medium')
        continue;
      const vs = cell.vsAuto;
      const autoCell = cells.find(
        (c) =>
          c.model === cell.model &&
          c.workload === workload &&
          c.effort === 'medium' &&
          c.config === 'auto',
      );
      if (!vs || !autoCell) continue;
      const ratio = vs[metric];
      const ci = vs.ci[metric];
      if (ratio === null || ci === null || (ci[0] <= 1 && ci[1] >= 1)) continue;
      const value =
        metric === 'cost' ? cell.costUsd!.p50 : metric === 'ttft' ? cell.ttftMs!.p50 : ratio;
      const baseline =
        metric === 'cost' ? autoCell.costUsd!.p50 : metric === 'ttft' ? autoCell.ttftMs!.p50 : 1;
      headlines.push({
        metric,
        model: cell.model,
        config,
        workload,
        effort: 'medium',
        value,
        baseline,
        ratio,
        ci,
        n: cell.ok,
      });
    }
  };
  pick('cost', 'cheapest', 'agentic');
  pick('ttft', 'fastest', 'short');
  pick('cacheHit', 'best-cache', 'big-context');

  const endpoints: EndpointSnapshot[] = MODELS.flatMap((spec) =>
    spec.endpoints.map((e) => ({ model: spec.model, ...e })),
  );
  const costModel: CostModel[] = MODELS.flatMap((spec) =>
    spec.configs.map((config) => {
      // Auto has no single price: use the mean of the endpoints it may route to.
      const pool = config.tag ? spec.endpoints.filter((e) => e.tag === config.tag) : spec.endpoints;
      const mean = (field: (e: (typeof pool)[number]) => number | null) => {
        const values = pool.map(field).filter((v): v is number => v !== null);
        return values.length ? round(values.reduce((s, v) => s + v, 0) / values.length, 6) : null;
      };
      return {
        model: spec.model,
        config: config.id,
        inputPerM: mean((e) => e.input) ?? 0,
        outputPerM: mean((e) => e.output) ?? 0,
        cachedPerM: mean((e) => e.cached),
      };
    }),
  );

  const profiles: Profile[] = [
    {
      id: 'chat',
      label: 'Chat',
      source: 'bench',
      shares: { input: 0.55, cachedInput: 0.25, output: 0.15, reasoning: 0.05 },
      n: 0,
    },
    {
      id: 'long-generation',
      label: 'Long generation',
      source: 'bench',
      shares: { input: 0.12, cachedInput: 0.03, output: 0.6, reasoning: 0.25 },
      n: 0,
    },
  ];
  if (observed) profiles.unshift(profileFromObserved(observed));

  return Summary.parse({
    version: 1,
    run: {
      id: 'synthetic',
      date: '2026-09-25T00:00:00.000Z',
      commit: 'synthetic',
      seed: SEED,
      maxUsd: 5,
      spentUsd: 0,
      synthetic: true,
    },
    headlines,
    cells,
    endpoints,
    costModel,
    profiles,
    samples,
    observed,
  });
}

if (import.meta.main) {
  const summary = fakeSummary(latestObserved());
  const dir = path.join(import.meta.dirname, 'results');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'summary.fake.json');
  writeFileSync(file, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(
    `synthetic summary · ${summary.cells.length} cells · ${summary.samples.length} samples → ${path.relative(process.cwd(), file)}`,
  );
}

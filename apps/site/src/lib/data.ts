import { createContext, use } from 'react';
import type { CostModel, Profile, Summary } from '@orpm/bench/schema';

/** Site strategy tabs (SPEC §11.2), in display order. */
export const STRATEGIES = [
  { id: 'cheapest', label: 'cost' },
  { id: 'fastest', label: 'speed' },
  { id: 'best-cache', label: 'cache' },
  { id: 'default', label: 'default' },
  { id: 'alt-host', label: 'alt host' },
] as const;
export type StrategyId = (typeof STRATEGIES)[number]['id'];

// The schema validated this file at build time; the runtime check only guards against a stale
// or missing file.
const isSummary = (value: unknown): value is Summary =>
  typeof value === 'object' && value !== null && 'version' in value && value.version === 1;

/** Fetched once, next to index.html. Resolves to null when unavailable. */
export const summaryPromise: Promise<Summary | null> = fetch(
  new URL('summary.json', document.baseURI),
)
  .then(async (response) => {
    const json: unknown = response.ok ? await response.json() : null;
    return isSummary(json) ? json : null;
  })
  .catch(() => null);

/**
 * USD per million tokens for a token mix (SPEC §4, §11.3): cached input at the cache price
 * (or the input price when unpublished), reasoning at the output price.
 */
export function blendedPerM(cost: CostModel, profile: Profile) {
  const { shares } = profile;
  return (
    shares.input * cost.inputPerM +
    shares.cachedInput * (cost.cachedPerM ?? cost.inputPerM) +
    (shares.output + shares.reasoning) * cost.outputPerM
  );
}

/** Lookups over one summary. */
export function createData(summary: Summary) {
  const cellOf = (model: string, workload: string, effort: string, config: string) =>
    summary.cells.find(
      (cell) =>
        cell.model === model &&
        cell.workload === workload &&
        cell.effort === effort &&
        cell.config === config,
    );
  return {
    summary,
    models: [...new Set(summary.cells.map((cell) => cell.model))],
    /** Workloads only measured at `medium` fall back to it (SPEC §8). */
    cellAt: (model: string, workload: string, effort: string, config: string) =>
      cellOf(model, workload, effort, config) ?? cellOf(model, workload, 'medium', config),
    configsOf: (model: string) => [
      ...new Set(summary.cells.filter((c) => c.model === model).map((c) => c.config)),
    ],
    tagOf: (model: string, config: string) =>
      summary.cells.find((c) => c.model === model && c.config === config)?.tag ?? null,
    costModelOf: (model: string, config: string) =>
      summary.costModel.find((entry) => entry.model === model && entry.config === config),
    /** Successes over attempts across every cell of a model × config. */
    reliabilityOf: (model: string, config: string) => {
      const cells = summary.cells.filter((c) => c.model === model && c.config === config);
      const n = cells.reduce((sum, c) => sum + c.n, 0);
      const ok = cells.reduce((sum, c) => sum + c.ok, 0);
      const errors: Record<string, number> = {};
      for (const cell of cells)
        for (const [kind, count] of Object.entries(cell.errors))
          errors[kind] = (errors[kind] ?? 0) + count;
      return { n, ok, rate: n ? ok / n : null, errors };
    },
  };
}
export type Data = ReturnType<typeof createData>;

export const DataContext = createContext<Data | null>(null);

/** Reads the loaded summary; only valid under <DataProvider>. */
export function useData(): Data {
  const data = use(DataContext);
  if (!data) throw new Error('useData() needs <DataProvider>');
  return data;
}

export type { Profile };

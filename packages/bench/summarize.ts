/**
 * Builds `results/summary.json` (SPEC §9, §10) from the raw lines and the meta file of a run,
 * validated by the `Summary` schema. Defaults to the newest run.
 *
 *   node summarize.ts [runId]
 */
import { readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { MIN_HEADLINE_N, type Workload } from './config.ts';
import { profileFromObserved } from './profiles.ts';
import {
  latestRunId,
  readLines,
  readMeta,
  type ResultLine,
  RESULTS_DIR,
  type RunMeta,
} from './results.ts';
import {
  type Cell,
  type CostModel,
  type EndpointSnapshot,
  type Headline,
  type Profile,
  type Sample,
  Summary,
} from './schema.ts';
import { cv, median, ratioCi, round, spread, stat } from './stats.ts';

/** One attempt of a cell: a request, or a whole task for agentic (SPEC §7). */
type Attempt = {
  status: ResultLine['status'];
  ttftMs: number | null;
  totalMs: number;
  outputTps: number | null;
  costUsd: number | null;
  lines: ResultLine[];
};

function attemptsOf(workload: Workload, lines: ResultLine[]): Attempt[] {
  if (workload !== 'agentic') return lines.map((line) => ({ ...line, lines: [line] }));
  const tasks = Map.groupBy(lines, (line) => line.key);
  return [...tasks.values()].map((turns) => {
    const failed = turns.find((turn) => turn.status !== 'ok');
    const streaming = turns.filter((t) => t.ttftMs !== null && t.completionTokens !== null);
    const streamMs = streaming.reduce((sum, t) => sum + t.totalMs - t.ttftMs!, 0);
    const tokens = streaming.reduce((sum, t) => sum + t.completionTokens!, 0);
    return {
      status: failed?.status ?? 'ok',
      // The task starts answering when its first turn does.
      ttftMs: turns[0]?.ttftMs ?? null,
      totalMs: turns.reduce((sum, t) => sum + t.totalMs, 0),
      outputTps: streamMs > 0 ? (tokens * 1000) / streamMs : null,
      costUsd: turns.some((t) => t.costUsd === null)
        ? null
        : turns.reduce((sum, t) => sum + t.costUsd!, 0),
      lines: turns,
    };
  });
}

const values = (attempts: Attempt[], field: 'ttftMs' | 'totalMs' | 'outputTps' | 'costUsd') =>
  attempts.map((a) => a[field]).filter((v): v is number => v !== null);

const cacheRatio = (lines: ResultLine[]) => {
  const prompt = lines.reduce((sum, l) => sum + (l.promptTokens ?? 0), 0);
  const cached = lines.reduce((sum, l) => sum + (l.cachedTokens ?? 0), 0);
  return prompt > 0 ? cached / prompt : NaN;
};

function shares(names: (string | null)[]) {
  const known = names.filter((name): name is string => name !== null);
  const counts = Map.groupBy(known, (name) => name);
  return Object.fromEntries(
    [...counts].map(([name, list]) => [name, round(list.length / known.length, 4)]),
  );
}

type Group = {
  model: string;
  workload: Workload;
  effort: string;
  tag: string | null;
  ids: string[];
  attempts: Attempt[];
};

/** One group per model × workload × effort × configuration, warm-ups excluded. */
function groupsOf(lines: ResultLine[]): Group[] {
  const measured = lines.filter((line) => !line.warmup);
  const byCell = Map.groupBy(measured, (l) =>
    [l.model, l.workload, l.effort, l.tag ?? 'auto'].join('|'),
  );
  return [...byCell.values()].map((cellLines) => {
    const first = cellLines[0]!;
    return {
      model: first.model,
      workload: first.workload,
      effort: first.effort,
      tag: first.tag,
      ids: first.configs,
      attempts: attemptsOf(first.workload, cellLines),
    };
  });
}

function cellOf(group: Group, id: string): Cell {
  const ok = group.attempts.filter((a) => a.status === 'ok');
  const errors: Record<string, number> = {};
  for (const a of group.attempts)
    if (a.status !== 'ok') errors[a.status] = (errors[a.status] ?? 0) + 1;
  const ttft = values(ok, 'ttftMs');
  const total = values(ok, 'totalMs');
  const cell: Cell = {
    model: group.model,
    workload: group.workload,
    effort: group.effort,
    config: id,
    tag: group.tag,
    n: group.attempts.length,
    ok: ok.length,
    truncated: errors.truncated ?? 0,
    successRate: group.attempts.length > 0 ? ok.length / group.attempts.length : 0,
    ttftMs: stat(ttft, 0),
    totalMs: stat(total, 0),
    outputTps: stat(values(ok, 'outputTps'), 1),
    costUsd: stat(values(ok, 'costUsd'), 6),
    cv: ttft.length > 0 ? { ttftMs: cv(ttft), totalMs: cv(total) } : null,
    errors,
  };
  if (group.workload === 'big-context') {
    const okLines = ok.flatMap((a) => a.lines);
    const ratio = cacheRatio(okLines);
    if (Number.isFinite(ratio)) cell.cacheRatio = round(ratio, 4);
    const costs = (cold: boolean) =>
      okLines
        .filter((l) => (l.position === 0) === cold && l.costUsd !== null)
        .map((l) => l.costUsd!);
    const cold = costs(true);
    const cached = costs(false);
    if (cold.length > 0 && cached.length > 0)
      cell.coldVsCached = { coldUsd: round(median(cold), 6), cachedUsd: round(median(cached), 6) };
  }
  if (group.tag === null) {
    const lines = group.attempts.flatMap((a) => a.lines);
    cell.providers = shares(lines.map((l) => l.providerUsed));
    if (group.workload === 'agentic' && group.attempts.length > 0) {
      const switched = group.attempts.filter(
        (a) => new Set(a.lines.map((l) => l.providerUsed).filter(Boolean)).size > 1,
      );
      cell.providerSwitchRate = round(switched.length / group.attempts.length, 4);
    }
  }
  return cell;
}

/** Ratios to auto with bootstrap CIs; null when either side lacks successes (SPEC §9). */
function vsAuto(pin: Group, auto: Group): Cell['vsAuto'] {
  const okOf = (g: Group) => g.attempts.filter((a) => a.status === 'ok');
  const [p, a] = [okOf(pin), okOf(auto)];
  const ttft = ratioCi(values(p, 'ttftMs'), values(a, 'ttftMs'), median);
  const cost = ratioCi(values(p, 'costUsd'), values(a, 'costUsd'), median);
  const stability = ratioCi(values(p, 'ttftMs'), values(a, 'ttftMs'), spread);
  if (!ttft || !cost || !stability) return null;
  const cacheHit =
    pin.workload === 'big-context'
      ? ratioCi(
          p.flatMap((x) => x.lines),
          a.flatMap((x) => x.lines),
          cacheRatio,
        )
      : null;
  return {
    ttft: ttft.ratio,
    cost: cost.ratio,
    stability: stability.ratio,
    cacheHit: cacheHit?.ratio ?? null,
    ci: { ttft: ttft.ci, cost: cost.ci, stability: stability.ci, cacheHit: cacheHit?.ci ?? null },
  };
}

const METRICS = ['cost', 'ttft', 'stability', 'cacheHit'] as const;

/** Only the ratios whose interval excludes 1, with enough successes on both sides. */
function headlinesOf(cell: Cell, auto: Cell): Headline[] {
  const vs = cell.vsAuto;
  if (!vs || cell.ok < MIN_HEADLINE_N || auto.ok < MIN_HEADLINE_N) return [];
  const pair = (metric: Headline['metric']): [number, number] | null => {
    if (metric === 'cacheHit')
      return cell.cacheRatio !== undefined && auto.cacheRatio !== undefined
        ? [cell.cacheRatio, auto.cacheRatio]
        : null;
    if (metric === 'cost')
      return cell.costUsd && auto.costUsd ? [cell.costUsd.p50, auto.costUsd.p50] : null;
    if (!cell.ttftMs || !auto.ttftMs) return null;
    if (metric === 'ttft') return [cell.ttftMs.p50, auto.ttftMs.p50];
    return [
      round(cell.ttftMs.p95 / cell.ttftMs.p50, 3),
      round(auto.ttftMs.p95 / auto.ttftMs.p50, 3),
    ];
  };
  return METRICS.flatMap((metric) => {
    const ratio = vs[metric];
    const ci = vs.ci[metric];
    const measured = pair(metric);
    if (ratio === null || ci === null || !measured || (ci[0] <= 1 && ci[1] >= 1)) return [];
    const [value, baseline] = measured;
    return [
      {
        metric,
        model: cell.model,
        config: cell.config,
        workload: cell.workload,
        effort: cell.effort,
        value,
        baseline,
        ratio,
        ci,
        n: cell.ok,
      },
    ];
  });
}

/** The endpoint an observed provider name stands for: its unsuffixed tag, else the cheapest. */
function endpointOfProvider(endpoints: EndpointSnapshot[], provider: string) {
  const matches = endpoints.filter((e) => e.provider.toLowerCase() === provider.toLowerCase());
  return (
    matches.find((e) => !e.tag.includes('/')) ??
    matches.toSorted((a, b) => (a.input ?? Infinity) - (b.input ?? Infinity))[0]
  );
}

/**
 * Prices per million tokens of each configuration: the pinned endpoint, or for auto the
 * endpoints weighted by how often auto used their provider during the run.
 */
function costModelOf(meta: RunMeta, lines: ResultLine[]): CostModel[] {
  return meta.models.flatMap(({ model, configs }) => {
    const endpoints = meta.endpoints.filter(
      (e) => e.model === model && e.tag !== 'router' && e.input !== null && e.output !== null,
    );
    return configs.flatMap(({ ids, tag }) => {
      let weighted: { endpoint: EndpointSnapshot; weight: number }[];
      if (tag !== null) {
        const endpoint = endpoints.find((e) => e.tag === tag);
        weighted = endpoint ? [{ endpoint, weight: 1 }] : [];
      } else {
        const used = shares(
          lines.filter((l) => l.model === model && l.tag === null).map((l) => l.providerUsed),
        );
        weighted = Object.entries(used).flatMap(([provider, weight]) => {
          const endpoint = endpointOfProvider(endpoints, provider);
          return endpoint ? [{ endpoint, weight }] : [];
        });
        if (weighted.length === 0)
          weighted = endpoints.map((endpoint) => ({ endpoint, weight: 1 }));
      }
      const sum = weighted.reduce((s, w) => s + w.weight, 0);
      if (sum === 0) return [];
      const mean = (price: (e: EndpointSnapshot) => number) =>
        round(weighted.reduce((s, w) => s + price(w.endpoint) * w.weight, 0) / sum, 6);
      return ids.map((id) => ({
        model,
        config: id,
        inputPerM: mean((e) => e.input!),
        outputPerM: mean((e) => e.output!),
        cachedPerM: weighted.every((w) => w.endpoint.cached === null)
          ? null
          : mean((e) => e.cached ?? e.input!),
      }));
    });
  });
}

/** Token mix measured on a workload (SPEC §10 `profiles`, source `bench`). */
function measuredProfile(lines: ResultLine[], id: string, label: string): Profile | null {
  let prompt = 0;
  let cached = 0;
  let completion = 0;
  let reasoning = 0;
  for (const l of lines) {
    prompt += l.promptTokens ?? 0;
    cached += Math.min(l.cachedTokens ?? 0, l.promptTokens ?? 0);
    completion += l.completionTokens ?? 0;
    reasoning += Math.min(l.reasoningTokens ?? 0, l.completionTokens ?? 0);
  }
  const total = prompt + completion;
  if (total === 0) return null;
  return {
    id,
    label,
    source: 'bench',
    shares: {
      input: (prompt - cached) / total,
      cachedInput: cached / total,
      output: (completion - reasoning) / total,
      reasoning: reasoning / total,
    },
    n: lines.length,
  };
}

export function summarize(meta: RunMeta, lines: ResultLine[]): Summary {
  const groups = groupsOf(lines);
  const cells: Cell[] = [];
  const headlines: Headline[] = [];
  for (const group of groups) {
    const autoGroup = groups.find(
      (g) =>
        g.tag === null &&
        g.model === group.model &&
        g.workload === group.workload &&
        g.effort === group.effort,
    );
    const autoCell = autoGroup ? cellOf(autoGroup, 'auto') : null;
    // A merged configuration is one cell per strategy, so every strategy tab has its data.
    for (const id of group.ids) {
      const cell = cellOf(group, id);
      if (group.tag !== null) {
        cell.vsAuto = autoGroup ? vsAuto(group, autoGroup) : null;
        if (autoCell) headlines.push(...headlinesOf(cell, autoCell));
      }
      cells.push(cell);
    }
  }

  const start = Date.parse(meta.date);
  const measured = lines.filter((l) => !l.warmup);
  const samples: Sample[] = measured.flatMap((l) => {
    const ok = l.status === 'ok';
    return l.configs.map((config) => ({
      model: l.model,
      workload: l.workload,
      effort: l.effort,
      config,
      t: Math.max(0, round((Date.parse(l.startedAt) - start) / 1000, 1)),
      ttftMs: ok ? l.ttftMs : null,
      outputTps: ok ? l.outputTps : null,
      costUsd: ok ? l.costUsd : null,
      ok,
    }));
  });

  const okLines = (workload: Workload) =>
    measured.filter((l) => l.workload === workload && l.status === 'ok');
  const profiles = [
    meta.observed ? profileFromObserved(meta.observed) : null,
    measuredProfile(okLines('short'), 'chat', 'Chat'),
    measuredProfile(okLines('long'), 'long-generation', 'Long generation'),
  ].filter((p): p is Profile => p !== null);

  return Summary.parse({
    version: 1,
    run: {
      id: meta.runId,
      date: meta.date,
      commit: meta.commit,
      seed: meta.seed,
      maxUsd: meta.args.maxUsd,
      spentUsd: round(
        lines.reduce((sum, l) => sum + (l.costUsd ?? 0), 0),
        6,
      ),
      synthetic: false,
    },
    headlines,
    cells,
    endpoints: meta.endpoints,
    costModel: costModelOf(meta, measured),
    profiles,
    samples,
    observed: meta.observed,
  });
}

if (import.meta.main) {
  try {
    const runId = process.argv[2] ?? latestRunId(readdirSync(RESULTS_DIR));
    if (!runId) throw new Error(`No run in ${RESULTS_DIR}`);
    const summary = summarize(readMeta(runId), readLines(runId));
    const file = path.join(RESULTS_DIR, 'summary.json');
    writeFileSync(file, `${JSON.stringify(summary, null, 2)}\n`);
    console.log(
      `run ${runId} · ${summary.cells.length} cells · ${summary.headlines.length} headlines · ` +
        `$${summary.run.spentUsd} → ${path.relative(process.cwd(), file)}`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

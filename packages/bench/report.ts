/**
 * Writes `results/<runId>.md`, a Markdown report to review a run without the site (SPEC §9):
 * resolved configurations, cell statistics, ratios to auto, headlines, and the gap between the
 * cost computed from listed prices and `usage.cost` (SPEC §12: discounts already included?).
 *
 *   node report.ts [runId]
 */
import { readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  latestRunId,
  readLines,
  readMeta,
  type ResultLine,
  RESULTS_DIR,
  type RunMeta,
} from './results.ts';
import type { Stat, Summary } from './schema.ts';
import { summarize } from './summarize.ts';

const row = (cells: (string | number)[]) => `| ${cells.join(' | ')} |`;
const table = (head: string[], rows: (string | number)[][]) =>
  [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n');

const ms = (s: Stat | null) => (s ? `${s.p50} / ${s.p90} / ${s.p95}` : '—');
const ci = (value: number | null | undefined, interval: [number, number] | null | undefined) =>
  value == null || !interval ? '—' : `${value} [${interval[0]}, ${interval[1]}]`;

/** Listed-price cost of the pinned lines against `usage.cost`, per model × tag. */
export function costCheck(meta: RunMeta, lines: ResultLine[]) {
  const pinned = lines.filter(
    (l) =>
      l.tag !== null &&
      l.costUsd !== null &&
      l.promptTokens !== null &&
      l.completionTokens !== null,
  );
  const groups = Map.groupBy(pinned, (l) => `${l.model}|${l.tag}`);
  return [...groups.values()].flatMap((group) => {
    const { model, tag } = group[0]!;
    const e = meta.endpoints.find((x) => x.model === model && x.tag === tag);
    if (!e || e.input === null || e.output === null) return [];
    let listed = 0;
    let actual = 0;
    for (const l of group) {
      const cached = l.cachedTokens ?? 0;
      listed +=
        ((l.promptTokens! - cached) * e.input +
          cached * (e.cached ?? e.input) +
          l.completionTokens! * e.output) /
        1e6;
      actual += l.costUsd!;
    }
    return [{ model, tag: tag!, requests: group.length, listed, actual, gap: actual / listed - 1 }];
  });
}

export function report(
  meta: RunMeta,
  lines: ResultLine[],
  summary: Summary = summarize(meta, lines),
) {
  const { run } = summary;
  const out = [
    `# Benchmark run ${run.id}`,
    '',
    `${run.date} · commit \`${run.commit.slice(0, 12)}\` · seed ${run.seed} · ` +
      `spent $${run.spentUsd.toFixed(4)} of $${run.maxUsd} · ${lines.length} requests`,
    '',
    '## Configurations',
    '',
  ];
  for (const m of meta.models) {
    out.push(`- **${m.model}** (${m.class}, cost basis: ${m.costBasis})`);
    for (const c of m.configs) {
      const observed = c.fromObserved.length > 0 ? ` (observed: ${c.fromObserved.join(', ')})` : '';
      out.push(`  - ${c.ids.join(' + ')} → \`${c.tag ?? 'auto'}\`${observed}`);
    }
    for (const o of m.omitted) out.push(`  - ~~${o.id}~~: ${o.reason}`);
  }

  out.push(
    '',
    '## Cells',
    '',
    'Latencies in ms (p50 / p90 / p95), successes only; cost in USD per request (per task for agentic).',
    '',
    table(
      [
        'model',
        'workload',
        'effort',
        'config',
        'n',
        'ok',
        'errors',
        'TTFT',
        'total',
        'tok/s p50',
        'cost p50',
        'cache',
      ],
      summary.cells.map((c) => [
        c.model,
        c.workload,
        c.effort,
        c.config,
        c.n,
        c.ok,
        Object.entries(c.errors)
          .map(([k, v]) => `${k} ${v}`)
          .join(', ') || '—',
        ms(c.ttftMs),
        ms(c.totalMs),
        c.outputTps?.p50 ?? '—',
        c.costUsd?.p50 ?? '—',
        c.cacheRatio ?? '—',
      ]),
    ),
    '',
    '## Versus auto',
    '',
    'Ratio pinned / auto with its 95% bootstrap interval; below 1 is cheaper, faster or steadier.',
    '',
    table(
      ['model', 'workload', 'effort', 'config', 'TTFT', 'cost', 'stability', 'cache hit'],
      summary.cells
        .filter((c) => c.tag !== null)
        .map((c) => [
          c.model,
          c.workload,
          c.effort,
          c.config,
          ci(c.vsAuto?.ttft, c.vsAuto?.ci.ttft),
          ci(c.vsAuto?.cost, c.vsAuto?.ci.cost),
          ci(c.vsAuto?.stability, c.vsAuto?.ci.stability),
          ci(c.vsAuto?.cacheHit, c.vsAuto?.ci.cacheHit),
        ]),
    ),
    '',
    '## Headlines',
    '',
    summary.headlines.length === 0
      ? 'None: no interval excludes 1.'
      : table(
          ['metric', 'model', 'config', 'workload', 'effort', 'value', 'auto', 'ratio', 'n'],
          summary.headlines.map((h) => [
            h.metric,
            h.model,
            h.config,
            h.workload,
            h.effort,
            h.value,
            h.baseline,
            ci(h.ratio, h.ci),
            h.n,
          ]),
        ),
    '',
    '## Cost check',
    '',
    'Cost from listed prices against `usage.cost`, pinned requests only (auto may use any host).',
    '',
    table(
      ['model', 'tag', 'requests', 'listed', 'usage.cost', 'gap'],
      costCheck(meta, lines).map((c) => [
        c.model,
        c.tag,
        c.requests,
        `$${c.listed.toFixed(6)}`,
        `$${c.actual.toFixed(6)}`,
        `${(c.gap * 100).toFixed(2)}%`,
      ]),
    ),
    '',
  );
  return out.join('\n');
}

if (import.meta.main) {
  try {
    const runId = process.argv[2] ?? latestRunId(readdirSync(RESULTS_DIR));
    if (!runId) throw new Error(`No run in ${RESULTS_DIR}`);
    const file = path.join(RESULTS_DIR, `${runId}.md`);
    writeFileSync(file, report(readMeta(runId), readLines(runId)));
    console.log(`report → ${path.relative(process.cwd(), file)}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

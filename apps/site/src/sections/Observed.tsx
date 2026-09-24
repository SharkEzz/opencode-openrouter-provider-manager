import { Panel } from '@/components/ds';
import { useData } from '@/lib/data';
import { ms, pct, shortModel, tokens, tps } from '@/lib/format';

/** Below this many requests a host is shown but muted: too few to compare (SPEC §4). */
const MIN_REQUESTS = 50;

/**
 * Real OpenCode usage exported from OpenRouter analytics (SPEC §11.9). Observations, not an
 * experiment: shown apart from the benchmark, and never as Auto vs pinned.
 */
export function Observed() {
  const { summary } = useData();
  const { observed } = summary;
  if (!observed) return null;
  const byModel = Map.groupBy(observed.rows, (row) => row.model);
  const multiHost = [...byModel.entries()]
    .filter(([, rows]) => new Set(rows.map((r) => r.provider)).size >= 2)
    .map(([model, rows]) => ({ model, rows: rows.toSorted((a, b) => b.requests - a.requests) }))
    .toSorted((a, b) => sum(b.rows) - sum(a.rows));
  const coding = summary.profiles.find((p) => p.source === 'openrouter-observed');

  return (
    <section id="observed" className="mx-auto grid max-w-6xl gap-4 px-4 py-16">
      <span className="label-sm text-telemetry-ink">real-world usage · observed</span>
      <h2 className="headline-md">The same model, many hosts</h2>
      <p className="body-md text-text-secondary">
        {tokens(observed.rows.reduce((s, r) => s + r.requests, 0))} opencode requests from{' '}
        {observed.period.from} to {observed.period.to}, as reported by openrouter.
      </p>
      <p className="body-sm rounded-md border border-warn-bg bg-warn-bg px-3 py-2 text-warn">
        observations, not an experiment: prompts, periods and the share of pinned requests differ
        between hosts. use them to see the spread, not to rank hosts.
      </p>
      {coding && (
        <p className="body-sm text-text-muted">
          token mix of this usage: {pct(coding.shares.cachedInput)} cached input ·{' '}
          {pct(coding.shares.input)} uncached input ·{' '}
          {pct(coding.shares.output + coding.shares.reasoning)} output — cache prices matter more
          than output prices for a coding agent.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {multiHost.map(({ model, rows }) => (
          <Panel
            key={model}
            title={shortModel(model)}
            meta={`${rows.length} hosts`}
            bodyClassName="overflow-x-auto p-0">
            <table className="body-sm w-full text-left">
              <thead className="label-sm text-text-faint">
                <tr className="h-8 border-b border-hairline">
                  {['host', 'requests', 'ttft p50', 'ttft p95', 'tok/s', 'cache'].map((h, i) => (
                    <th key={h} className={`px-3 font-semibold ${i > 0 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={`${row.permaslug}·${row.provider}`}
                    className={`h-8 border-b border-hairline last:border-none ${row.requests < MIN_REQUESTS ? 'text-text-faint' : ''}`}>
                    <td className="px-3">{row.provider}</td>
                    <td className="px-3 text-right">{row.requests.toLocaleString('en-US')}</td>
                    <td className="px-3 text-right text-telemetry-ink">
                      {row.ttftP50Ms != null ? ms(row.ttftP50Ms) : '—'}
                    </td>
                    <td className="px-3 text-right">
                      {row.ttftP95Ms != null ? ms(row.ttftP95Ms) : '—'}
                    </td>
                    <td className="px-3 text-right">
                      {row.tpsP50 != null ? tps(row.tpsP50) : '—'}
                    </td>
                    <td className="px-3 text-right text-meta-ink">
                      {row.cacheHitRate != null ? pct(row.cacheHitRate) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        ))}
      </div>
      <p className="body-sm text-text-faint">muted rows: fewer than {MIN_REQUESTS} requests.</p>
    </section>
  );
}

const sum = (rows: { requests: number }[]) => rows.reduce((s, r) => s + r.requests, 0);

import { StatusDot, Badge, Panel } from '@/components/ds';
import { useData } from '@/lib/data';
import { change, ms, pct, pricePerM, tps } from '@/lib/format';

/** One row per measured config, Auto first, like the /provider picker (SPEC §11.6). */
export function EndpointMatrix({ model }: { model: string }) {
  const { summary, cellAt, reliabilityOf } = useData();
  const configs = [...new Set(summary.cells.filter((c) => c.model === model).map((c) => c.config))];
  const rows = configs.map((config) => {
    const short = cellAt(model, 'short', 'medium', config);
    const big = cellAt(model, 'big-context', 'medium', config);
    const endpoint = summary.endpoints.find((e) => e.model === model && e.tag === short?.tag);
    return { config, short, big, endpoint, reliability: reliabilityOf(model, config) };
  });

  return (
    <Panel title="endpoints" meta="short · medium effort" bodyClassName="overflow-x-auto p-0">
      <table className="body-sm w-full min-w-[720px] text-left">
        <thead className="label-sm text-text-faint">
          <tr className="h-9 border-b border-hairline">
            {[
              'endpoint',
              'in /M',
              'out /M',
              'cache /M',
              'ttft p50',
              'tok/s p50',
              'success',
              'cache hit',
              'Δ ttft vs auto',
            ].map((h, i) => (
              <th key={h} className={`px-3 font-semibold ${i > 0 ? 'text-right' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ config, short, big, endpoint, reliability }) => (
            <tr
              key={config}
              className="h-9 border-b border-hairline last:border-none hover:bg-surface-hover">
              <td className="px-3 text-text-primary">{short?.tag ?? 'auto'}</td>
              <td className="px-3 text-right">
                {endpoint?.input != null ? pricePerM(endpoint.input) : '—'}
              </td>
              <td className="px-3 text-right">
                {endpoint?.output != null ? pricePerM(endpoint.output) : '—'}
              </td>
              <td className="px-3 text-right text-meta-ink">
                {endpoint?.cached != null ? pricePerM(endpoint.cached) : '—'}
              </td>
              <td className="px-3 text-right">{short?.ttftMs ? ms(short.ttftMs.p50) : '—'}</td>
              <td className="px-3 text-right">
                {short?.outputTps ? tps(short.outputTps.p50) : '—'}
              </td>
              <td className="px-3 text-right">
                {reliability.rate != null ? (
                  <StatusDot
                    tone={
                      reliability.rate >= 0.99 ? 'ok' : reliability.rate >= 0.95 ? 'warn' : 'fault'
                    }
                    label={pct(reliability.rate)}
                  />
                ) : (
                  '—'
                )}
              </td>
              <td className="px-3 text-right text-meta-ink">
                {big?.cacheRatio != null ? pct(big.cacheRatio) : '—'}
              </td>
              <td className="px-3 text-right">
                {short?.vsAuto ? (
                  <Badge tone={short.vsAuto.ttft < 1 ? 'ok' : 'fault'}>
                    {change(short.vsAuto.ttft)}
                  </Badge>
                ) : (
                  <span className="text-text-faint">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

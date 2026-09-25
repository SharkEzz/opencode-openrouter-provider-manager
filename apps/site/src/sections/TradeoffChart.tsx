import { useState } from 'react';
import { CartesianGrid, ErrorBar, Scatter, ScatterChart, XAxis, YAxis } from 'recharts';
import { Panel } from '@/components/ds';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { blendedPerM, type Profile, useData } from '@/lib/data';
import { ms } from '@/lib/format';
import type { Selection } from './Benchmark';

const WORKLOADS = ['short', 'long', 'agentic', 'big-context'] as const;
const AXIS = { fill: 'var(--text-faint)', fontSize: 11, fontFamily: 'var(--font-mono)' };

const isPoint = (value: unknown): value is Point =>
  typeof value === 'object' && value !== null && 'config' in value && 'fill' in value;

type Point = {
  config: string;
  label: string;
  ttft: number;
  cost: number;
  error: [number, number];
  fill: string;
};

/** Cost × TTFT, one point per config, with the TTFT median interval (SPEC §11.5). */
export function TradeoffChart({
  selection,
  profile,
}: {
  selection: Selection;
  profile: Profile | undefined;
}) {
  const [workload, setWorkload] = useState<(typeof WORKLOADS)[number]>('short');
  const { cellAt, configsOf, costModelOf, tagOf } = useData();
  const { model, strategy, effort } = selection;
  const points: Point[] = profile
    ? configsOf(model).flatMap((config) => {
        const cell = cellAt(model, workload, effort, config);
        const cost = costModelOf(model, config);
        if (!cell?.ttftMs || !cost) return [];
        const { p50, ci50 } = cell.ttftMs;
        return [
          {
            config,
            label: tagOf(model, config) ?? 'auto',
            ttft: p50,
            cost: blendedPerM(cost, profile),
            error: [p50 - ci50[0], ci50[1] - p50],
            fill:
              config === 'auto'
                ? 'var(--text-muted)'
                : config === strategy
                  ? 'var(--accent-route-ink)'
                  : 'var(--accent-telemetry-ink)',
          },
        ];
      })
    : [];

  return (
    <Panel
      title="trade-off"
      meta="median ttft × blended $/M · bars: 95% interval"
      actions={
        <span className="flex gap-1">
          {WORKLOADS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWorkload(w)}
              aria-pressed={w === workload}
              className={`body-sm cursor-pointer rounded-md px-2 py-0.5 ${w === workload ? 'bg-route font-semibold text-text-on-accent' : 'text-text-muted hover:bg-surface-hover'}`}>
              {w}
            </button>
          ))}
        </span>
      }>
      <ChartContainer config={{}} className="aspect-auto h-72 w-full">
        <ScatterChart margin={{ top: 12, right: 24, bottom: 24, left: 8 }}>
          <CartesianGrid stroke="var(--hairline)" />
          <XAxis
            type="number"
            dataKey="ttft"
            name="ttft"
            tick={AXIS}
            tickFormatter={(v: number) => ms(v)}
            stroke="var(--hairline)"
            label={{ value: 'ttft p50', position: 'insideBottom', offset: -12, ...AXIS }}
          />
          <YAxis
            type="number"
            dataKey="cost"
            name="cost"
            tick={AXIS}
            tickFormatter={(v: number) => `$${v.toFixed(3)}`}
            stroke="var(--hairline)"
            width={64}
          />
          <ChartTooltip
            cursor={false}
            content={({ payload }) => {
              const point: unknown = payload?.[0]?.payload;
              if (!isPoint(point)) return null;
              return (
                <div className="body-sm rounded-md border border-hairline bg-surface-raised px-2 py-1 text-text-primary">
                  {point.label} · {ms(point.ttft)} · ${point.cost.toFixed(4)}/M
                </div>
              );
            }}
          />
          <Scatter
            data={points}
            isAnimationActive={false}
            shape={(props: {
              cx?: number | undefined;
              cy?: number | undefined;
              payload?: unknown;
            }) => {
              const point = isPoint(props.payload) ? props.payload : undefined;
              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={point?.config === strategy ? 6 : 4.5}
                  fill={point?.fill}
                />
              );
            }}>
            <ErrorBar dataKey="error" direction="x" stroke="var(--text-faint)" width={4} />
          </Scatter>
        </ScatterChart>
      </ChartContainer>
      <p className="body-sm text-text-faint">
        grey: auto · blue: the selected pin · cyan: other pins. lower-left is cheaper and faster.
      </p>
    </Panel>
  );
}

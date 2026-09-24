import type { ReactNode, CSSProperties } from 'react';

/** Stacked label/value readout for cost, latency, context and throughput figures. */
export interface MetricPairProps {
  /** Uppercase mono key, e.g. `in / out`, `p50`, `ctx`. */
  label: string;
  /** The figure itself. Pre-format it — the component does not round. */
  value: ReactNode;
  /** Faint trailing unit, e.g. `/M`, `ms`, `tok/s`. */
  unit?: string;
  tone?: 'default' | 'route' | 'telemetry' | 'meta' | 'warn' | 'fault' | 'ok';
  align?: 'left' | 'right' | 'center';
  style?: CSSProperties;
}

export function MetricPair(props: MetricPairProps): JSX.Element;

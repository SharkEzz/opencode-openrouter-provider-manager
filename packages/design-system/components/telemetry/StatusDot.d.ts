import type { CSSProperties } from 'react';

/** Health / connection indicator for providers, MCP servers and uptime rows. */
export interface StatusDotProps {
  /** `ok` emerald, `warn` amber, `fault` crimson, `idle` slate, `live` cyan, `route` blue. */
  tone?: 'ok' | 'warn' | 'fault' | 'idle' | 'live' | 'route';
  /** Diameter in px. 5 in dense rows, 6 default, 8 in headers. */
  size?: number;
  /** Adds a glow plus a concentric ring — reserve for genuinely live signals. */
  ping?: boolean;
  /** Optional muted mono caption to the right. */
  label?: string;
  style?: CSSProperties;
}

export function StatusDot(props: StatusDotProps): JSX.Element;

import type { CSSProperties } from 'react';

/** Slim context-window budget track. Blue = consumed, magenta = cached, amber past 90%. */
export interface TokenBudgetBarProps {
  /** Tokens consumed from the window. */
  used?: number;
  /** Cache-read tokens, stacked after the consumed segment. */
  cached?: number;
  /** Context limit. */
  total?: number;
  /** Uppercase mono caption above the track. */
  label?: string;
  /** Show the `used / cached / total` readout. Defaults true. */
  showValues?: boolean;
  /** Track height in px. Defaults to the 3px token. */
  height?: number;
  style?: CSSProperties;
}

export function TokenBudgetBar(props: TokenBudgetBarProps): JSX.Element;

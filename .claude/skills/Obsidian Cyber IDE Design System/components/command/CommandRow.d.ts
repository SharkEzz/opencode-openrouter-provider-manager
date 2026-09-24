import type { ReactNode, CSSProperties } from 'react';

/** One monospace split-column row inside a command palette or route picker. */
export interface CommandRowProps {
  /** Primary label — model id, command name or file path. */
  name: ReactNode;
  /** Secondary provider or scope, rendered faint beside the name. */
  provider?: ReactNode;
  /** Leading glyph at 12–14px. */
  leading?: ReactNode;
  /** Cost metrics column, e.g. `$0.11 in / $0.55 out /M`. */
  cost?: ReactNode;
  /** Context limit column, e.g. `ctx 1.1M`. */
  context?: ReactNode;
  /** Health column: `{ tone, label }` renders a 5px dot plus mono caption. */
  health?: { tone: 'ok' | 'warn' | 'fault' | 'idle'; label: string };
  /** Right-aligned routing alias, e.g. `@fast`. */
  alias?: ReactNode;
  /** Inline `<Badge>` elements placed after the name. */
  badges?: ReactNode;
  /** Active item: solid electric fill, bold white text, cyan rim + indicator dot. */
  selected?: boolean;
  /** 28px log density instead of the 36px item height. */
  dense?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  style?: CSSProperties;
}

export function CommandRow(props: CommandRowProps): JSX.Element;

import type { ReactNode, CSSProperties } from 'react';

/**
 * Tree row for MCP registries, context inspectors and file lineage lists.
 * @startingPoint section="Inspector" subtitle="MCP registry tree with connection status" viewport="700x260"
 */
export interface TreeItemProps {
  label: ReactNode;
  /** Indentation level; each step is 14px with a hairline lineage rule. */
  depth?: number;
  /** Pass a boolean to render a disclosure caret; omit for leaf rows. */
  expanded?: boolean;
  onToggle?: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Leading glyph at 12px. */
  leading?: ReactNode;
  /** Faint right-aligned counter — tool count, token count, latency. */
  meta?: ReactNode;
  /** Connection health dot after the label. */
  status?: 'ok' | 'warn' | 'fault' | 'idle';
  /** Slate-tinted fill plus a 1px cyan left edge. */
  selected?: boolean;
  trailing?: ReactNode;
  /** Nested `TreeItem`s, rendered only when `expanded`. */
  children?: ReactNode;
  style?: CSSProperties;
}

export function TreeItem(props: TreeItemProps): JSX.Element;

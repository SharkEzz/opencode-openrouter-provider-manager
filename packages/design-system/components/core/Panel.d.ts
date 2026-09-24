import type { ReactNode, CSSProperties } from 'react';

/** Structural container for docked sidebars, split panes and floating surfaces. */
export interface PanelProps {
  /** Uppercase mono `label-sm` header text. Omit for a headerless pane. */
  title?: string;
  /** Faint counter or path shown next to the title. */
  meta?: ReactNode;
  /** Right-aligned header affordances — normally `<IconButton>`s. */
  actions?: ReactNode;
  /** `docked` sidebar, `pane` split pane, `glass` floating overlay, `canvas` editor ground. */
  tone?: 'docked' | 'pane' | 'glass' | 'canvas';
  /** Replace the top border with the electric rim used on floating surfaces. */
  rim?: boolean;
  /** Apply the 0.75rem internal gutter. Set false for flush row lists. */
  padded?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

export function Panel(props: PanelProps): JSX.Element;

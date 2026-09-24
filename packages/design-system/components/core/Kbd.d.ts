import type { ReactNode, CSSProperties } from 'react';

/** Hotkey indicator chip for palette headers, rows and tooltips. */
export interface KbdProps {
  /** Lowercase key name or combination, e.g. `esc`, `ctrl+p`, `⏎`. */
  children?: ReactNode;
  /** `accent` tints the chip electric blue for the primary action of a surface. */
  tone?: 'default' | 'accent';
  style?: CSSProperties;
}

export function Kbd(props: KbdProps): JSX.Element;

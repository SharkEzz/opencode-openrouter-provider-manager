import type { ReactNode, CSSProperties } from 'react';

/** Square, transparent glyph trigger for toolbars, panel headers and row affordances. */
export interface IconButtonProps {
  /** A single `<Icon>`, sized 12–16px. */
  children?: ReactNode;
  /** 20 / 24 / 28 px square. */
  size?: 'sm' | 'md' | 'lg';
  /** Sticky toggled state — cyan tint + cyan rim. */
  active?: boolean;
  disabled?: boolean;
  /** Required for a11y; also rendered as the native tooltip. */
  label?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
}

export function IconButton(props: IconButtonProps): JSX.Element;

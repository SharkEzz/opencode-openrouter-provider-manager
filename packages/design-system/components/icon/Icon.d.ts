import type { CSSProperties } from 'react';

/** Icon glyph wrapper. Lucide (stroke 2, 24px grid) is this system's icon set. */
export interface IconProps {
  /** Lucide icon slug, kebab-case — e.g. `search`, `git-branch`, `refresh-cw`. */
  name: string;
  /** Pixel box. 12 for dense rows, 14 default, 16 for palette search. */
  size?: number;
  /** Any CSS colour. Defaults to `currentColor` so it follows the parent's ink. */
  color?: string;
  /** Set only when the glyph carries meaning on its own; otherwise it stays aria-hidden. */
  title?: string;
  style?: CSSProperties;
}

export function Icon(props: IconProps): JSX.Element;
export const ICON_BASE: string;

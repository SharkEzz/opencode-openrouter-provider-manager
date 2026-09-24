import type { ReactNode, CSSProperties } from 'react';
import type { CommandRowProps } from './CommandRow';

export interface CommandGroup {
  /** Uppercase section label, e.g. `frontier`, `local`, `recent`. */
  label?: string;
  /** Faint counter beside the label. */
  meta?: ReactNode;
  /** Rows, each keyed by `id`. */
  items?: Array<CommandRowProps & { id: string }>;
}

/**
 * Floating frosted-glass command surface (Ctrl+P, model router, provider picker).
 * @startingPoint section="Command" subtitle="Model router palette with cost and health columns" viewport="720x420"
 */
export interface CommandPaletteProps {
  query?: string;
  onQueryChange?: (value: string) => void;
  placeholder?: string;
  groups?: CommandGroup[];
  /** `id` of the active row. */
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Status-bar content along the bottom edge — hotkey legend, result count. */
  footer?: ReactNode;
  /** Trailing hotkey chips in the search header. */
  hotkeys?: string[];
  /** Max width. Stay between 640px and 720px. */
  width?: string;
  style?: CSSProperties;
}

export function CommandPalette(props: CommandPaletteProps): JSX.Element;

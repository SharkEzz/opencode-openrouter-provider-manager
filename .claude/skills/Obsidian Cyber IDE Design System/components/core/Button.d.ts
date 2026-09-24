import type { ReactNode, CSSProperties } from 'react';

/**
 * Primary action trigger for command surfaces, dialogs and toolbars.
 * @startingPoint section="Core" subtitle="Buttons, icon buttons, inputs and switches" viewport="700x200"
 */
export interface ButtonProps {
  /** Visual role. `primary` = routing/commit action, `telemetry` = cyan live-data action. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'telemetry' | 'danger';
  /** 24 / 28 / 36 px heights, matching the density scale. */
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
  /** Leading glyph, normally an `<Icon>` at 14px. */
  leading?: ReactNode;
  /** Trailing glyph or `<Kbd>` hotkey hint. */
  trailing?: ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  style?: CSSProperties;
}

export function Button(props: ButtonProps): JSX.Element;

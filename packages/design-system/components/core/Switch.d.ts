import type { CSSProperties } from 'react';

/** Compact toggle for fallback providers, pricing tiers and inspector flags. */
export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Mono label to the right of the track. */
  label?: string;
  /** Second line of faint explanatory copy. */
  hint?: string;
  id?: string;
  style?: CSSProperties;
}

export function Switch(props: SwitchProps): JSX.Element;

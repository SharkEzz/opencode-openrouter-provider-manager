import type { ReactNode, CSSProperties, ChangeEvent, KeyboardEvent } from 'react';

/** Filter / search / value input. 1px border, 4px radius, mono text by default. */
export interface InputProps {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  /** 28 / 36 / 44 px — `lg` is the palette search height. */
  size?: 'sm' | 'md' | 'lg';
  /** Leading glyph (search, filter, terminal chevron). */
  leading?: ReactNode;
  /** Trailing content — usually `<Kbd>` hints such as `esc` / `ctrl+p`. */
  trailing?: ReactNode;
  /** Mono text (default) or Inter for administrative forms. */
  mono?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  /** Chromeless variant for palette headers: no fill, hairline underline only. */
  bare?: boolean;
  autoFocus?: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  style?: CSSProperties;
}

export function Input(props: InputProps): JSX.Element;

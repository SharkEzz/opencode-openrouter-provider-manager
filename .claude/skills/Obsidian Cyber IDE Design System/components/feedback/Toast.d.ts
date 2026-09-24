import type { ReactNode, CSSProperties } from 'react';

/**
 * Level-3 diagnostic toast — route failures, cache busts, provider degradation.
 * @startingPoint section="Feedback" subtitle="Diagnostic toasts for routing and cache events" viewport="700x220"
 */
export interface ToastProps {
  /** Short mono headline, lowercase, e.g. `route failed: 429`. */
  title: ReactNode;
  /** One or two lines of technical detail. */
  detail?: ReactNode;
  /** `info` blue, `live` cyan, `cache` magenta, plus warn / fault / ok. */
  tone?: 'info' | 'live' | 'cache' | 'warn' | 'fault' | 'ok';
  /** Leading glyph at 14px. */
  leading?: ReactNode;
  /** Buttons — normally `<Button size="sm" variant="ghost">`. */
  action?: ReactNode;
  onDismiss?: () => void;
  /** Mono monotonic time, e.g. `12:04:51`. */
  timestamp?: string;
  style?: CSSProperties;
}

export function Toast(props: ToastProps): JSX.Element;

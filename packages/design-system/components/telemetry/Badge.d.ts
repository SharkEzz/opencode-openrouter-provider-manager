import type { ReactNode, CSSProperties } from 'react';

/**
 * Micro-pill carrying provider, routing or telemetry metadata.
 * @startingPoint section="Telemetry" subtitle="Badges, status dots, budget bars and metric pairs" viewport="700x220"
 */
export interface BadgeProps {
  children?: ReactNode;
  /** `route` blue, `telemetry` cyan, `meta` magenta (cache/build), plus status + neutral + solid. */
  tone?: 'route' | 'telemetry' | 'meta' | 'ok' | 'warn' | 'fault' | 'neutral' | 'solid';
  /** `tag` = 4px micro-tag (default), `pill` = fully rounded. */
  shape?: 'tag' | 'pill';
  /** Prepend a 5px status dot in the current ink. */
  dot?: boolean;
  /** Leading glyph at 10–12px. */
  leading?: ReactNode;
  style?: CSSProperties;
}

export function Badge(props: BadgeProps): JSX.Element;

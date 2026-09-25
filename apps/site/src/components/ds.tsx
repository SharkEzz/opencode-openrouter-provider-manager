/**
 * TSX ports of the design system primitives the site needs (packages/design-system/components).
 * They read semantic aliases only, so both themes work. One deliberate deviation: Badge inks use
 * `--accent-*-ink` as in `guidelines/light-badges.html`, and its tints come from the site's
 * `--badge-*` aliases (globals.css); the upstream Badge reads raw `--obs-*` tokens, which stay
 * pale in the light theme.
 */
import type { CSSProperties, ReactNode } from 'react';
import { cn } from 'cn';

const PANEL_TONES = {
  docked: 'bg-surface-docked',
  pane: 'bg-surface-pane',
} as const;

/** Docked container: flat fill, 1px hairline, 4px radius, uppercase label-sm header bar. */
export function Panel({
  title,
  meta,
  actions,
  tone = 'docked',
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  tone?: keyof typeof PANEL_TONES;
  className?: string;
  bodyClassName?: string;
  children?: ReactNode;
}) {
  return (
    <section
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-md border border-hairline',
        PANEL_TONES[tone],
        className,
      )}>
      {(title || actions) && (
        <header className="flex h-9 shrink-0 items-center gap-2 border-b border-hairline px-3">
          <span className="label-sm truncate text-text-secondary">{title}</span>
          {meta && <span className="body-sm truncate text-text-faint">{meta}</span>}
          <span className="flex-1" />
          {actions && <span className="flex items-center gap-1">{actions}</span>}
        </header>
      )}
      <div className={cn('min-h-0 flex-1 p-3', bodyClassName)}>{children}</div>
    </section>
  );
}

const BADGE_TONES: Record<BadgeTone, CSSProperties> = {
  route: {
    color: 'var(--accent-route-ink)',
    background: 'var(--badge-route-bg)',
    borderColor: 'var(--badge-route-border)',
  },
  telemetry: {
    color: 'var(--accent-telemetry-ink)',
    background: 'var(--badge-telemetry-bg)',
    borderColor: 'var(--badge-telemetry-border)',
  },
  meta: {
    color: 'var(--accent-meta-ink)',
    background: 'var(--badge-meta-bg)',
    borderColor: 'var(--badge-meta-border)',
  },
  ok: {
    color: 'var(--status-ok)',
    background: 'var(--status-ok-bg)',
    borderColor: 'var(--status-ok-bg)',
  },
  warn: {
    color: 'var(--status-warn)',
    background: 'var(--status-warn-bg)',
    borderColor: 'var(--status-warn-bg)',
  },
  fault: {
    color: 'var(--status-fault)',
    background: 'var(--status-fault-bg)',
    borderColor: 'var(--status-fault-bg)',
  },
  neutral: {
    color: 'var(--text-muted)',
    background: 'var(--surface-raised)',
    borderColor: 'var(--hairline)',
  },
};
export type BadgeTone = 'route' | 'telemetry' | 'meta' | 'ok' | 'warn' | 'fault' | 'neutral';

/** Micro-pill for routing, telemetry and status metadata. */
export function Badge({
  tone = 'neutral',
  dot = false,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className="label-sm inline-flex h-[18px] items-center gap-1 rounded-md border px-1.5 whitespace-nowrap normal-case"
      style={BADGE_TONES[tone]}>
      {dot && <span className="size-[5px] shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const INK = {
  default: 'text-text-primary',
  route: 'text-route-ink',
  telemetry: 'text-telemetry-ink',
  meta: 'text-meta-ink',
  ok: 'text-ok',
  warn: 'text-warn',
  fault: 'text-fault',
} as const;

/** Label-over-value readout with tabular figures. */
export function MetricPair({
  label,
  value,
  unit,
  tone = 'default',
  align = 'left',
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  tone?: keyof typeof INK;
  align?: 'left' | 'right';
}) {
  return (
    <div className={cn('grid min-w-0 gap-px', align === 'right' && 'text-right')}>
      <span className="label-sm text-text-faint">{label}</span>
      <span className={cn('body-md whitespace-nowrap', INK[tone])}>
        {value}
        {unit && <span className="ml-0.5 text-text-faint">{unit}</span>}
      </span>
    </div>
  );
}

const DOT = { ok: 'bg-ok', warn: 'bg-warn', fault: 'bg-fault', idle: 'bg-text-faint' } as const;

/** Static health dot, with an optional muted label. */
export function StatusDot({ tone = 'ok', label }: { tone?: keyof typeof DOT; label?: ReactNode }) {
  const dot = <span className={cn('inline-block size-1.5 shrink-0 rounded-full', DOT[tone])} />;
  if (!label) return dot;
  return (
    <span className="inline-flex items-center gap-2">
      {dot}
      <span className="body-sm text-text-muted">{label}</span>
    </span>
  );
}

/** Square transparent glyph trigger (toolbars, panel headers). */
export function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-grid size-7 cursor-pointer place-items-center rounded-md border border-transparent text-text-muted transition-colors duration-[140ms] ease-out hover:bg-surface-hover hover:text-telemetry-ink">
      {children}
    </button>
  );
}

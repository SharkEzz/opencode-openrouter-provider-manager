import { useEffect, useEffectEvent, useSyncExternalStore } from 'react';
import { prefersReducedMotion } from './motion';

export type Theme = 'dark' | 'light';

const root = () => document.documentElement;
const read = (): Theme => (root().getAttribute('data-theme') === 'light' ? 'light' : 'dark');

function apply(theme: Theme) {
  if (theme === 'light') root().setAttribute('data-theme', 'light');
  else root().removeAttribute('data-theme');
}

/** The `data-theme` attribute (set before first paint by index.html) is the source of truth. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(root(), { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

function stored(): Theme | null {
  try {
    const value = localStorage.getItem('theme');
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

/**
 * Reveals the new theme in a circle growing from `origin` (a View Transition clip, not a fade).
 * Falls back to an instant switch without the API or under reduced motion.
 */
function switchTo(theme: Theme, origin?: { x: number; y: number }) {
  if (!origin || !document.startViewTransition || prefersReducedMotion()) {
    apply(theme);
    return;
  }
  const radius = Math.hypot(
    Math.max(origin.x, innerWidth - origin.x),
    Math.max(origin.y, innerHeight - origin.y),
  );
  const transition = document.startViewTransition(() => apply(theme));
  void transition.ready.then(() =>
    root().animate(
      {
        clipPath: [
          `circle(0px at ${origin.x}px ${origin.y}px)`,
          `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
        ],
      },
      {
        duration: 400,
        easing: 'cubic-bezier(.2,.8,.3,1)',
        pseudoElement: '::view-transition-new(root)',
      },
    ),
  );
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => 'dark' as const);

  // Follow the system preference live, until the button stores an explicit choice.
  const onSystemChange = useEffectEvent((event: MediaQueryListEvent) => {
    if (stored() === null) apply(event.matches ? 'light' : 'dark');
  });
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: light)');
    query.addEventListener('change', onSystemChange);
    return () => query.removeEventListener('change', onSystemChange);
  }, []);

  /** `origin`: viewport point the reveal grows from (the toggle button). */
  const toggle = (origin?: { x: number; y: number }) => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    switchTo(next, origin);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Private mode: the choice lasts for this page only.
    }
  };
  return { theme, toggle };
}

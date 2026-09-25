import { useEffect, useEffectEvent, useSyncExternalStore } from 'react';

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

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    apply(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Private mode: the choice lasts for this page only.
    }
  };
  return { theme, toggle };
}

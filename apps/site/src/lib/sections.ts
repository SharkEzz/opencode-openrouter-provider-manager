import { useSyncExternalStore } from 'react';

/**
 * Id of the section crossing a band just below the sticky header, or null above the first one.
 * Sections mount late (the data ones wait for summary.json), so each check looks them up again.
 */
export function useActiveSection(ids: readonly string[]) {
  const key = ids.join(',');
  return useSyncExternalStore(
    (onChange) => subscribe(key, onChange),
    () => current.get(key) ?? null,
    () => null,
  );
}

const current = new Map<string, string | null>();

function subscribe(key: string, onChange: () => void) {
  const ids = key.split(',');
  const update = () => {
    // The last section whose top has passed 30% of the viewport.
    let active: string | null = null;
    for (const id of ids) {
      const top = document.getElementById(id)?.getBoundingClientRect().top;
      if (top !== undefined && top <= innerHeight * 0.3) active = id;
    }
    if (current.get(key) !== active) {
      current.set(key, active);
      onChange();
    }
  };
  update();
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  return () => {
    removeEventListener('scroll', update);
    removeEventListener('resize', update);
  };
}

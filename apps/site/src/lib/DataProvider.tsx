import { type ReactNode, use, useMemo } from 'react';
import { createData, DataContext, summaryPromise } from './data';

/** Suspends until summary.json is loaded (wrap in <Suspense>), then provides it. */
export function DataProvider({ children }: { children: ReactNode }) {
  const summary = use(summaryPromise);
  const data = useMemo(() => (summary ? createData(summary) : null), [summary]);
  if (!data)
    return (
      <p className="body-sm mx-auto max-w-6xl px-4 py-16 text-text-muted">
        benchmark data unavailable — summary.json could not be loaded.
      </p>
    );
  return <DataContext value={data}>{children}</DataContext>;
}

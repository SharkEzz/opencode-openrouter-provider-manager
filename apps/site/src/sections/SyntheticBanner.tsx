import { use } from 'react';
import { summaryPromise } from '@/lib/data';

/** Top-of-page notice while the data is generated (SPEC §11.8). Wrap in <Suspense>. */
export function SyntheticBanner() {
  const summary = use(summaryPromise);
  if (!summary?.run.synthetic) return null;
  return (
    <div
      role="status"
      className="body-sm border-b border-warn bg-warn-bg px-4 py-2 text-center text-warn">
      synthetic data — not measured. figures below only preview the layout; the benchmark has not
      run yet.
    </div>
  );
}

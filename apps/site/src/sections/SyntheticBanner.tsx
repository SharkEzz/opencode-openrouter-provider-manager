import { useData } from '@/lib/data';

/** Always visible while the data is generated (SPEC §11.8). */
export function SyntheticBanner() {
  const { summary } = useData();
  if (!summary.run.synthetic) return null;
  return (
    <div
      role="status"
      className="body-sm border-b border-warn bg-warn-bg px-4 py-2 text-center text-warn">
      synthetic data — not measured. figures below only preview the layout; the benchmark has not
      run yet.
    </div>
  );
}

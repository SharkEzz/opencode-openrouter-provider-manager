/** Slowly drifting accent blooms behind the hero (`.halo` in globals.css). Decorative. */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-clip">
      <span className="halo halo-route" />
      <span className="halo halo-telemetry" />
      <span className="halo halo-meta" />
    </div>
  );
}

/**
 * Drifting accent blooms behind the header and hero (`.halo` in globals.css). Taller than the hero
 * and faded out at the bottom, so the colour bleeds into the next section. Decorative.
 */
export function HeroBackdrop() {
  return (
    <div
      aria-hidden
      className="hero-backdrop pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-clip">
      <span className="halo halo-route" />
      <span className="halo halo-telemetry" />
      <span className="halo halo-meta" />
    </div>
  );
}

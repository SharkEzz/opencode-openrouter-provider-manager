import pickerUrl from '../../../../packages/plugin/docs/images/provider-picker.png';

export function Hero() {
  return (
    <section
      id="top"
      className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
      <div className="grid gap-4">
        <span className="label-sm text-telemetry-ink">opencode plugin · openrouter</span>
        <h1 className="headline-lg text-[2.25rem] leading-tight">
          Pick the OpenRouter endpoint for every model.
        </h1>
        <p className="body-lg text-text-secondary">
          openrouter lets many hosts serve the same model, at different prices and speeds. this
          plugin adds a <code>/provider</code> picker to opencode and pins the chosen endpoint —
          flex for cost, fast for latency, or a host that keeps its prompt cache.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="#install"
            className="body-md rounded-md border-none bg-route px-4 py-2 font-semibold text-text-on-accent hover:brightness-110">
            install
          </a>
          <a
            href="#benchmark"
            className="body-md rounded-md border border-hairline px-4 py-2 text-text-primary hover:bg-surface-hover">
            see the benchmark
          </a>
        </div>
      </div>
      <img
        src={pickerUrl}
        alt="The /provider picker in OpenCode, listing OpenRouter endpoints with prices, uptime and tags"
        className="w-full rounded-lg border border-hairline"
      />
    </section>
  );
}

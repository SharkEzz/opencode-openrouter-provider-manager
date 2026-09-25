import { ChartScatter } from 'lucide-react';
import { CopyCommand } from '@/components/CopyCommand';
import { HeroBackdrop } from '@/components/HeroBackdrop';
import { HeroPicker } from '@/components/HeroPicker';
import { REPO_URL } from './Header';

export function Hero() {
  return (
    <section id="top" className="relative isolate -mt-14 pt-14">
      <HeroBackdrop />
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] justify-items-center gap-6 px-4 pt-16 pb-20 text-center">
        <span className="label-sm inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-app/60 px-3 py-1 text-telemetry-ink normal-case">
          <span className="size-1.5 rounded-full bg-telemetry-ink" />
          opencode plugin · openrouter<span className="hidden sm:inline"> · endpoint pinning</span>
        </span>
        <h1 className="headline-lg max-w-4xl text-[2.5rem] leading-[1.1] sm:text-[3.5rem]">
          Pick the OpenRouter endpoint <br className="hidden sm:inline" />
          <span className="text-gradient-accent">for every model.</span>
        </h1>
        <p className="body-lg max-w-2xl text-text-secondary">
          openrouter lets many hosts serve the same model, at different prices and speeds. this
          plugin adds a <code>/provider</code> picker to opencode and pins the chosen endpoint —
          flex for cost, fast for latency, or a host that keeps its prompt cache.
        </p>
        <div className="flex w-full max-w-2xl flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <CopyCommand command={`git clone ${REPO_URL}`} className="sm:max-w-md sm:flex-1" />
          <a href="#benchmark" className="btn-secondary body-sm px-4 py-2">
            <ChartScatter size={14} />
            see the benchmark
          </a>
        </div>
        <span className="body-sm inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-app/60 px-3 py-1 text-text-muted">
          <span className="ping-dot" />
          <span>
            pinned<span className="hidden sm:inline"> · z-ai/glm-5.3-flash →</span>{' '}
            <span className="text-telemetry-ink">deepinfra/fp8</span>
          </span>
        </span>
        <span className="sr-only">
          The /provider picker in OpenCode lists every OpenRouter endpoint of the active model with
          its prices, context, quantization, uptime and tag, and pins the one you choose.
        </span>
        <div className="mt-6 w-full max-w-5xl">
          <HeroPicker />
        </div>
      </div>
    </section>
  );
}

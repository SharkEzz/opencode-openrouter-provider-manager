import { Summary } from '@orpm/bench/schema';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';

const RESULTS = path.join(import.meta.dirname, '..', 'node_modules', '@orpm', 'bench', 'results');
/** Served next to index.html and fetched at runtime, so the data stays out of the JS bundle. */
const FILE = 'summary.json';

/**
 * Validates the benchmark summary with the bench schema at build time (zod stays out of the
 * bundle), then serves it as a static `summary.json`. Uses the measured `results/summary.json`
 * when it exists, else the synthetic one. A production build refuses synthetic data
 * (SPEC §11.8); `--mode preview` allows it and marks the page `noindex`.
 */
export async function summary(mode: string, command: 'build' | 'serve'): Promise<Plugin> {
  const measured = path.join(RESULTS, 'summary.json');
  const file = existsSync(measured) ? measured : path.join(RESULTS, 'summary.fake.json');
  const data = Summary.parse(JSON.parse(await readFile(file, 'utf8')));
  if (command === 'build' && mode === 'production' && data.run.synthetic)
    throw new Error(
      `Refusing a production build on synthetic data (${path.basename(file)}). Run the benchmark first, or use \`pnpm build:preview\`.`,
    );
  const source = JSON.stringify(data);
  return {
    name: 'orpm-summary',
    configureServer(server) {
      server.middlewares.use(`/${FILE}`, (_request, response) => {
        response.setHeader('content-type', 'application/json');
        response.end(source);
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: FILE, source });
    },
    transformIndexHtml: () =>
      data.run.synthetic
        ? [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex' }, injectTo: 'head' }]
        : [],
  } as const satisfies Plugin;
}

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Summary } from '@orpm/bench/schema';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const RESULTS = path.join(import.meta.dirname, 'node_modules/@orpm/bench/results');
/** Served next to index.html and fetched at runtime, so the data stays out of the JS bundle. */
const FILE = 'summary.json';

/**
 * Validates the benchmark summary with the bench schema at build time (zod stays out of the
 * bundle), then serves it as a static `summary.json`. Uses the measured `results/summary.json`
 * when it exists, else the synthetic one. A production build refuses synthetic data
 * (SPEC §11.8); `--mode preview` allows it and marks the page `noindex`.
 */
function summary(mode: string, command: 'build' | 'serve'): Plugin {
  const measured = path.join(RESULTS, 'summary.json');
  const file = existsSync(measured) ? measured : path.join(RESULTS, 'summary.fake.json');
  const data = Summary.parse(JSON.parse(readFileSync(file, 'utf8')));
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
  };
}

export default defineConfig(({ mode, command }) => ({
  // Relative asset paths: works on any host until one is chosen.
  base: './',
  plugins: [react(), tailwindcss(), summary(mode, command)],
  resolve: {
    alias: { '@': path.join(import.meta.dirname, 'src') },
  },
}));

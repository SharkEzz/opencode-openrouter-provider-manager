import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { summary } from './plugins/summary.ts';

export default defineConfig(({ mode, command }) => ({
  // Relative asset paths: works on any host until one is chosen.
  base: './',
  plugins: [react(), tailwindcss(), summary(mode, command)],
  resolve: {
    alias: { '@': path.join(import.meta.dirname, 'src') },
  },
  appType: 'spa',
  build: {
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: false,
  },
}));

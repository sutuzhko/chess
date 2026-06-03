import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const r = (p: string): string => path.resolve(__dirname, p);

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/chess/' : '/',
  plugins: [vue()],
  root: '.',
  resolve: {
    alias: {
      '@': r('src'),
      '@app': r('src/app'),
      '@modules': r('src/modules'),
      '@shared': r('src/shared'),
      '@engine': r('src/engine'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: command !== 'build',
    target: 'es2022',
    rollupOptions: {
      output: {
        // GitHub Pages (Jekyll) ignores files starting with "_" — strip leading underscores.
        chunkFileNames: (info): string => `assets/${info.name.replace(/^_+/, '')}-[hash].js`,
      },
    },
  },
  worker: {
    format: 'es',
  },
}));

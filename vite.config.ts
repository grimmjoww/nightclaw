import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  // Tauri expects a fixed port, fail if not available
  clearScreen: false,
});

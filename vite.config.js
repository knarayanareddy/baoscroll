import { defineConfig } from 'vite';

// GLSL files are imported with the `?raw` suffix (native Vite feature),
// so no shader plugin is required.
export default defineConfig({
  base: './',
  server: {
    port: 4317,
    host: true,
    allowedHosts: true
  },
  build: {
    target: 'es2019',
    chunkSizeWarningLimit: 900
  }
});

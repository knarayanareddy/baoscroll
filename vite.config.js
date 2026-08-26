import { defineConfig } from 'vite';
import { resolve } from 'node:path';

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
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        lighthouse: resolve(__dirname, 'index.html'),
        clockmaker: resolve(__dirname, 'stories/clockmaker/index.html'),
        clockmakerProduction: resolve(__dirname, 'stories/clockmaker/production/index.html'),
        clockmakerWorkshop: resolve(__dirname, 'stories/clockmaker/workshop/index.html'),
        clockmakerCity: resolve(__dirname, 'stories/clockmaker/city/index.html'),
        clockmakerTower: resolve(__dirname, 'stories/clockmaker/tower/index.html'),
        clockmakerFinal: resolve(__dirname, 'stories/clockmaker/final/index.html'),
        clockmakerDawn: resolve(__dirname, 'stories/clockmaker/dawn/index.html')
      }
    }
  }
});

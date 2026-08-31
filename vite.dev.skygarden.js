// Per-story dev server: serves the Sky Garden shell at the ROOT of its own
// port (4322), for a dedicated live preview.
//   SKYGARDEN_DEV_PORT=4325 npm run dev:skygarden   (override)
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const PORT = Number(process.env.SKYGARDEN_DEV_PORT || 4322);

export default defineConfig({
  root: resolve(__dirname, 'stories/sky-garden'),
  base: './',
  server: {
    port: PORT,
    strictPort: true,
    host: true,
    allowedHosts: true
  },
  build: {
    outDir: resolve(__dirname, 'dist-skygarden-dev'),
    emptyOutDir: true
  }
});

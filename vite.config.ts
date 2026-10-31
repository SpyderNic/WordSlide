import { defineConfig } from 'vite';

// Relative asset paths: CrazyGames serves the build from a subfolder.
export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: true },
});

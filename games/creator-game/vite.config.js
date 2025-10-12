import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5175,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});

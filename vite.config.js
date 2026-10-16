import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from the root of the GitHub user site: https://bishwaswarup.github.io/
// (repo name must be exactly "Bishwaswarup.github.io"). If you ever move it back
// to a project repo, set base to '/<repo-name>/'.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    chunkSizeWarningLimit: 1200,
  },
});

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDirectory, 'src'),
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1800,
  },
  test: {
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});

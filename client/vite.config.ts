import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig, type Plugin } from 'vitest/config';

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(rootDirectory, 'public');

/**
 * The dev server answers an unknown path with index.html so client routing
 * keeps working. A mistyped asset path therefore returns markup with a 200,
 * and Phaser fails while decoding it rather than reporting a missing file —
 * an audio version of this cost an afternoon. Serving a real 404 keeps a
 * missing asset looking like a missing asset.
 */
function missingAssets404(): Plugin {
  return {
    name: 'soot:missing-assets-404',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestPath = request.url?.split('?')[0];

        if (!requestPath?.startsWith('/assets/')) {
          next();
          return;
        }

        const filePath = path.resolve(
          publicDirectory,
          `.${decodeURIComponent(requestPath)}`,
        );

        if (filePath.startsWith(publicDirectory) && existsSync(filePath)) {
          next();
          return;
        }

        response.statusCode = 404;
        response.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), missingAssets404()],
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

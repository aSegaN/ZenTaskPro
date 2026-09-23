import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Les tests d'API (*.api.test.ts) nécessitent une base : lancés via `npm run test:api` (CI).
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.api.test.ts'],
  },
});

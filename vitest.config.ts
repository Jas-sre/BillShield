import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Unit tests for the BillShield engine and store.
 *
 * The forecast utilities, insight generators and the demo reducer are pure, so a
 * plain Node environment is enough — no DOM and no browser APIs required.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    reporters: 'default',
  },
});

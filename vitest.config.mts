import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Only the pure helpers in src/lib are unit-tested, so there is no jsdom
// environment and no React plugin here — nothing under test renders. Components
// and routes are covered by `next build` in CI instead.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
  },
});

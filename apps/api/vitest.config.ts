import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
      exclude: ['src/test/**', 'src/index.ts', 'prisma/**', 'dist/**'],
    },
  },
  resolve: {
    alias: {
      '@local-dungeon/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});


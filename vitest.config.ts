import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Se miden TODOS los archivos de producción, aunque ningún test los importe.
      include: ['src/**/*.ts'],
      exclude: ['src/**/contratos.ts'], // solo tipos: no generan código ejecutable
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: { lines: 90.01, statements: 90, functions: 90, branches: 85 },
    },
  },
});

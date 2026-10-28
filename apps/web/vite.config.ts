import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import solid from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';
import { qualityManifest } from '../../tools/quality/build-manifest.mjs';
import coverageScope from '../../tools/quality/coverage-scope.json' with {
  type: 'json',
};

export default defineConfig(({ mode }) => ({
  // Component tests do not run a hot-reload server.
  plugins: [
    solid({ hot: mode !== 'test' }),
    tailwindcss(),
    qualityManifest(fileURLToPath(new URL('../../', import.meta.url))),
  ],
  // jsdom needs Solid's reactive browser build. Production retains Vite's
  // default production conditions rather than shipping development helpers.
  resolve:
    mode === 'test' ? { conditions: ['development', 'browser'] } : undefined,
  test: {
    // Bound isolated jsdom/Effect workers on developer machines and CI;
    // increasing concurrency can exhaust memory and starve interaction timers.
    maxWorkers: 2,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    reporters: ['default', 'json'],
    outputFile: { json: './coverage/test-results.json' },
    coverage: {
      provider: 'v8',
      clean: false,
      include: coverageScope.files,
      exclude: [],
      reporter: ['json', 'json-summary'],
      reportsDirectory: './coverage',
      reportOnFailure: true,
    },
  },
}));

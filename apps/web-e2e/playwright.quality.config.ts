import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const port = Number(process.env.FLEETIQ_E2E_QUALITY_PORT ?? 4175);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Invalid quality preview port');
export default defineConfig({
  testDir: './quality',
  outputDir: `${root}test-results/quality`,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 120_000,
  reporter: [
    ['list'],
    [
      'html',
      { open: 'never', outputFolder: `${root}playwright-report/quality` },
    ],
  ],
  use: {
    browserName: 'chromium',
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1365, height: 900 },
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'geographic-map',
      testMatch: ['**/geographic-map.spec.ts'],
      use: {
        trace: 'off',
        video: 'off',
        launchOptions: {
          args: [
            '--js-flags=--expose-gc',
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
          ],
        },
      },
    },
    {
      name: 'rendered-accessibility',
      testMatch: [
        '**/measured-browser.spec.ts',
        '**/geographic-map-accessibility.spec.ts',
        '**/overview-accessibility.spec.ts',
        '**/commissioning-accessibility.spec.ts',
        '**/binding-accessibility.spec.ts',
        '**/alerts-accessibility.spec.ts',
        '**/alert-rules-accessibility.spec.ts',
        '**/acknowledgement-accessibility.spec.ts',
      ],
    },
    {
      name: 'rendering-performance',
      testMatch: [
        '**/rendering-performance.spec.ts',
        '**/resource-sensors.spec.ts',
        '**/overview-performance.spec.ts',
      ],
      use: {
        trace: 'off',
        video: 'off',
        // Test-only V8 GC entry point; no production browser requirement.
        launchOptions: { args: ['--js-flags=--expose-gc'] },
      },
    },
  ],
  webServer: {
    command:
      'pnpm --filter @fleetiq/web preview --host 127.0.0.1 --port ' +
      port +
      ' --strictPort',
    cwd: root,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

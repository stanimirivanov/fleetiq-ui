import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';
import { browserScenarioMode } from './user-guide/guide-mode';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const userGuideMode = browserScenarioMode() === 'user-guide';
const port = Number(process.env.FLEETIQ_E2E_PREVIEW_PORT ?? 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Invalid FleetIQ Playwright port');
}
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: fileURLToPath(new URL('../../test-results/', import.meta.url)),
  fullyParallel: !userGuideMode,
  forbidOnly: Boolean(process.env.CI),
  failOnFlakyTests: true,
  retries: process.env.CI && !userGuideMode ? 1 : 0,
  workers: userGuideMode ? 1 : process.env.CI ? 2 : undefined,
  timeout: userGuideMode ? 120_000 : 30_000,
  reporter: [
    ['list'],
    [
      'html',
      {
        open: 'never',
        outputFolder: fileURLToPath(
          new URL('../../playwright-report/', import.meta.url),
        ),
      },
    ],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    colorScheme: 'light',
    locale: 'en-US',
    reducedMotion: 'reduce',
    timezoneId: 'UTC',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: `pnpm --filter @fleetiq/web preview --host 127.0.0.1 --port ${port} --strictPort`,
    cwd: repositoryRoot,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

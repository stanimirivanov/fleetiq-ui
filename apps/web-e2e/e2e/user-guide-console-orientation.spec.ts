import { mockUnavailableSignIn } from '../fixtures/metadata-api';
import { expect, test } from '../fixtures/production-test';
import { AssetsPage } from '../pages/assets.page';
import { DesignSystemPage } from '../pages/design-system.page';
import { OverviewPage } from '../pages/overview.page';
import { ShellPage } from '../pages/shell.page';
import { UserGuideSession } from '../user-guide/user-guide-session';

/**
 * A complete, honest first-use journey. In ordinary E2E mode this is an
 * assertion-first test; guide mode records only its verified outcomes.
 */
test('orient in the FleetIQ console and choose appearance', {
  tag: '@user-guide',
}, async ({ baseURL, browser }) => {
  const guide = await UserGuideSession.start(browser, {
    baseURL: baseURL ?? 'http://127.0.0.1:4173',
    dataMode: 'production-shell',
    order: 10,
    slug: 'console-orientation',
    summary:
      'Find the available workspaces, understand unavailable fleet data and status examples, and choose an appearance preference.',
    title: 'Get oriented in the FleetIQ console',
  });

  await mockUnavailableSignIn(guide.page);

  try {
    const shell = new ShellPage(guide.page, guide);
    const overview = new OverviewPage(guide.page, guide);
    const assets = new AssetsPage(guide.page, guide);
    const designSystem = new DesignSystemPage(guide.page, guide);
    const documentRoot = guide.page.locator('html');

    await test.step('Start with an honest fleet overview', async () => {
      await shell.open();
      await expect(overview.heading).toBeVisible();
      await expect(overview.connectionNotice).toContainText(
        'sign-in service is unavailable',
      );
      await expect(shell.overviewLink).toHaveAttribute('aria-current', 'page');
      await expect(documentRoot).toHaveAttribute('data-theme', 'light');
      await overview.document();
    });

    await test.step('Find the asset catalogue and its connection state', async () => {
      await shell.goToAssets();
      await expect(assets.heading).toBeVisible();
      await expect(assets.connectionNotice).toContainText(
        'Sign-in unavailable',
      );
      await expect(shell.assetsLink).toHaveAttribute('aria-current', 'page');
      await assets.document();
    });

    await test.step('Read the operational state vocabulary', async () => {
      await shell.goToDesignSystem();
      await expect(designSystem.heading).toBeVisible();
      await expect(designSystem.lightSample).toBeVisible();
      await expect(designSystem.darkSample).toBeVisible();
      for (const label of [
        'Asset condition',
        'Gateway connection',
        'Telemetry freshness',
        'Alert severity',
      ]) {
        await expect(designSystem.lightSample.getByText(label)).toBeVisible();
      }
      await designSystem.document();
    });

    await test.step('Choose Dark and then System appearance', async () => {
      await shell.cycleTheme();
      await expect(documentRoot).toHaveAttribute('data-theme', 'dark');
      await expect(shell.themeButton).toHaveAccessibleName(
        'Theme: dark. Switch to system.',
      );
      await shell.cycleTheme();
      await expect(shell.themeButton).toHaveAccessibleName(
        'Theme: system (light). Switch to light.',
      );
      await expect(documentRoot).toHaveAttribute('data-theme', 'light');
    });

    await test.step('Follow the system setting and keep it after reload', async () => {
      await guide.page.emulateMedia({ colorScheme: 'dark' });
      await expect(documentRoot).toHaveAttribute('data-theme', 'dark');
      await expect(shell.themeButton).toHaveAccessibleName(
        'Theme: system (dark). Switch to light.',
      );
      await guide.result(shell.themeButton, {
        title: 'System follows this device',
        body: 'When System is selected, FleetIQ follows the device appearance. The preference remains System rather than becoming a fixed dark choice.',
      });
      await guide.page.reload();
      await expect(shell.themeButton).toHaveAccessibleName(
        'Theme: system (dark). Switch to light.',
      );
      await guide.result(shell.themeButton, {
        title: 'The preference survives a return visit',
        body: 'After a reload, FleetIQ remembers System and continues to use the device appearance.',
      });
    });

    await test.step('Return to the overview without losing the frame', async () => {
      await shell.goToOverview();
      await expect(overview.heading).toBeVisible();
      await expect(shell.overviewLink).toHaveAttribute('aria-current', 'page');
      await expect(overview.connectionNotice).toBeVisible();
      await overview.document();
    });

    await guide.finish();
  } catch (error: unknown) {
    await guide.abort();
    throw error;
  }
});

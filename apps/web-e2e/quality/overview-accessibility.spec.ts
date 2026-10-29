import { installOverviewApi } from '../fixtures/overview-api';
import { expect, test } from '../fixtures/production-test';
import { auditAccessibility } from '../pages/accessibility-audit';
import { FleetOverviewPage } from '../pages/fleet-overview.page';
import { ShellPage } from '../pages/shell.page';

for (const viewport of [
  { name: 'desktop', width: 1365, height: 900 },
  { name: 'narrow', width: 390, height: 844 },
] as const)
  for (const theme of ['light', 'dark'] as const) {
    test(`overview accessibility ${viewport.name} ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      const api = await installOverviewApi(page, {
          inventorySize: 200,
          pending: true,
        }),
        overview = new FleetOverviewPage(page);
      await overview.open();
      if (theme === 'dark') await new ShellPage(page).cycleTheme();
      await overview.asset('Positioned equipment').click();
      await expect(overview.location).toContainText('51.5, -0.12');
      expect(await auditAccessibility(page)).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      api.fleet.deny();
      await overview.refresh();
      await expect(
        page.getByRole('region', { name: 'Overview snapshot unavailable' }),
      ).toBeVisible();
      expect(await auditAccessibility(page)).toEqual([]);
    });
  }

import { installAlertsApi } from '../fixtures/alerts-api';
import { expect, test } from '../fixtures/production-test';
import { auditAccessibility } from '../pages/accessibility-audit';
import { ConnectedAlertsPage } from '../pages/connected-alerts.page';
import { ShellPage } from '../pages/shell.page';

for (const viewport of [
  { name: 'desktop', width: 1365, height: 900 },
  { name: 'narrow', width: 390, height: 844 },
] as const)
  for (const theme of ['light', 'dark'] as const)
    test(`alerts accessibility ${viewport.name} ${theme}`, async ({ page }) => {
      const api = await installAlertsApi(page),
        alerts = new ConnectedAlertsPage(page);
      await page.setViewportSize(viewport);
      await alerts.open(
        '?tenant=tenant-a&rule=voltage-high&revision=1&evaluation=evaluation-b',
      );
      await expect(alerts.outputs).toContainText(
        '12345678901234567890.1234567890123456789',
      );
      if (theme === 'dark') await new ShellPage(page).cycleTheme();
      expect(await auditAccessibility(page)).toEqual([]);
      await alerts.filter.focus();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(alerts.filter).toBeFocused();
      expect(await auditAccessibility(page)).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      api.denyAlerts(403);
      await alerts.open();
      await expect(alerts.queue.getByRole('alert')).toHaveText(
        'Access is denied',
      );
      expect(await auditAccessibility(page)).toEqual([]);
    });

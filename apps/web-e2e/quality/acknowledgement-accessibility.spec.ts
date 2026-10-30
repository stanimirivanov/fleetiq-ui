import { installAcknowledgementApi } from '../fixtures/acknowledgement-api';
import { expect, test } from '../fixtures/production-test';
import { auditAccessibility } from '../pages/accessibility-audit';
import { ConnectedAlertsPage } from '../pages/connected-alerts.page';
import { ShellPage } from '../pages/shell.page';

for (const width of [1365, 390])
  for (const dark of [false, true])
    test(`acknowledgement accessibility ${width} ${dark ? 'dark' : 'light'}`, async ({
      page,
    }) => {
      await installAcknowledgementApi(page);
      await page.setViewportSize({ width, height: 900 });
      const alerts = new ConnectedAlertsPage(page);
      await alerts.open('?tenant=tenant-a&rule=voltage-high&revision=1');
      const button = page.getByRole('button', {
        name: 'Acknowledge displayed version',
      });
      await expect(button).toBeEnabled();
      if (dark) await new ShellPage(page).cycleTheme();
      await button.focus();
      await page.keyboard.press('Enter');
      await expect(alerts.detail).toContainText(
        'Acknowledged version 2 by operator-a',
      );
      expect(await auditAccessibility(page)).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });

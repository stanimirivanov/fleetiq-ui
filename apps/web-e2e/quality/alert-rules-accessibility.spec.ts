import { installAlertRulesApi } from '../fixtures/alert-rules-api';
import { expect, test } from '../fixtures/production-test';
import { auditAccessibility } from '../pages/accessibility-audit';
import { AlertRulesPage } from '../pages/alert-rules.page';
import { ShellPage } from '../pages/shell.page';

for (const width of [1365, 390])
  for (const dark of [false, true])
    test(`alert rules accessibility ${width} ${dark ? 'dark' : 'light'}`, async ({
      page,
    }) => {
      await installAlertRulesApi(page);
      await page.setViewportSize({ width, height: 900 });
      const rules = new AlertRulesPage(page);
      await rules.open();
      await expect(rules.threshold).toBeVisible();
      if (dark) await new ShellPage(page).cycleTheme();
      await rules.threshold.focus();
      await page.keyboard.press('Tab');
      expect(await auditAccessibility(page)).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });

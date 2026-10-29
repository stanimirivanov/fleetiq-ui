import { installBindingApi } from '../fixtures/binding-api';
import { installMetadataApi } from '../fixtures/metadata-api';
import { expect, test } from '../fixtures/production-test';
import { auditAccessibility } from '../pages/accessibility-audit';
import { BindingAuthoringPage } from '../pages/binding-authoring.page';
import { ShellPage } from '../pages/shell.page';

for (const width of [1365, 390])
  for (const theme of ['light', 'dark'])
    test(`binding accessibility ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await installMetadataApi(page, {
        tenants: [
          {
            tenant_id: 'tenant-a',
            actions: ['metadata.read', 'metadata.manage', 'protocol.manage'],
          },
        ],
      });
      const api = await installBindingApi(page),
        binding = new BindingAuthoringPage(page);
      await binding.open();
      if (theme === 'dark') await new ShellPage(page).cycleTheme();
      await binding.chooseSource();
      await binding.chooseTarget();
      await binding.draft();
      expect(await auditAccessibility(page)).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      api.failNext('conflict');
      await binding.submit();
      await expect(binding.form()).toContainText('Conflict');
      expect(await auditAccessibility(page)).toEqual([]);
    });

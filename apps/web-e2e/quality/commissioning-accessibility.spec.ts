import { installCommissioningApi } from '../fixtures/commissioning-api';
import { installMetadataApi } from '../fixtures/metadata-api';
import { expect, test } from '../fixtures/production-test';
import { auditAccessibility } from '../pages/accessibility-audit';
import { RegistryCommissioningPage } from '../pages/registry-commissioning.page';
import { ShellPage } from '../pages/shell.page';

for (const width of [1365, 390])
  for (const theme of ['light', 'dark']) {
    test(`commissioning accessibility ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await installMetadataApi(page, {
        tenants: [
          {
            tenant_id: 'tenant-a',
            actions: ['metadata.read', 'metadata.manage'],
          },
        ],
      });
      const api = await installCommissioningApi(page),
        registry = new RegistryCommissioningPage(page);
      await registry.open();
      if (theme === 'dark') await new ShellPage(page).cycleTheme();
      await registry.assetDraft();
      await registry.relationshipDraft();
      expect(await auditAccessibility(page)).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      api.failNext('conflict');
      await registry.submitAsset();
      await expect(registry.asset()).toContainText('Conflict');
      expect(await auditAccessibility(page)).toEqual([]);
    });
  }

import { installFleetApi } from '../fixtures/fleet-api';
import { installMetadataApi } from '../fixtures/metadata-api';
import { expect, test } from '../fixtures/production-test';
import { auditAccessibility } from '../pages/accessibility-audit';
import { ConnectedMapPage } from '../pages/connected-map.page';
import { requireMapMeasurementIsolation } from '../pages/map-resources';
import { ShellPage } from '../pages/shell.page';

// This project's ordinary per-test contexts keep Axe out of resource measurements.
test.use({
  launchOptions: {
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  },
});
for (const viewport of [
  { name: 'desktop', width: 1680, height: 960 },
  { name: 'narrow', width: 390, height: 844 },
] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`geographic map accessibility ${viewport.name} ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await installMetadataApi(page);
      await installFleetApi(page);
      const map = new ConnectedMapPage(page),
        shell = new ShellPage(page);
      await map.open();
      await map.rendererReady();
      if (theme === 'dark') {
        await shell.cycleTheme();
        await map.rendererReady();
      }
      if (viewport.name === 'narrow')
        await page
          .getByRole('button', { name: 'Asset list', exact: true })
          .click();
      await map.asset('Positioned equipment').click();
      await expect(map.evidence).toContainText('51.5, -0.12');
      expect(await auditAccessibility(page)).toEqual([]);
      if (viewport.name === 'narrow') {
        await page
          .getByRole('button', { name: 'Geographic map', exact: true })
          .click();
        expect(await auditAccessibility(page)).toEqual([]);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
  }
}
test('resource isolation rejects a real accessibility-instrumented page', async ({
  page,
}) => {
  await page.setContent(
    '<main><h1>Isolation control</h1><button type="button">Named control</button></main>',
  );
  await requireMapMeasurementIsolation(page);
  await auditAccessibility(page);
  await expect(requireMapMeasurementIsolation(page)).rejects.toThrow(
    'accessibility-free page context',
  );
});

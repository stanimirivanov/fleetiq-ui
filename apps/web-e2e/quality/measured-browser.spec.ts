import {
  sourceIdentity,
  writeQualityEvidence,
} from '../../../tools/quality/evidence.mjs';
import { repositoryRoot } from '../../../tools/quality/policy.mjs';
import { installDevicesApi } from '../fixtures/devices-api';
import { installMetadataApi } from '../fixtures/metadata-api';
import { expect, test } from '../fixtures/production-test';
import { auditAccessibility as audit } from '../pages/accessibility-audit';
import { ConnectedMetadataPage } from '../pages/connected-metadata.page';
import { DevicesPage } from '../pages/devices.page';
import { ShellPage } from '../pages/shell.page';

const viewports = [
  { name: 'desktop', width: 1365, height: 900 },
  { name: 'narrow', width: 390, height: 844 },
] as const;
for (const viewport of viewports) {
  for (const theme of ['light', 'dark'] as const) {
    test(`rendered production accessibility ${viewport.name} ${theme}`, async ({
      page,
    }) => {
      const source = sourceIdentity(repositoryRoot);
      await page.setViewportSize(viewport);
      await installMetadataApi(page);
      const metadata = new ConnectedMetadataPage(page);
      const shell = new ShellPage(page);
      await metadata.openCatalogue('&effective_at_ms=1500&known_at_ms=2500');
      await expect(metadata.catalogue).toBeVisible();
      if (theme === 'dark') await shell.cycleTheme();
      const observations = [];
      for (const screen of ['catalogue', 'inspector', 'registry'] as const) {
        if (screen === 'inspector') {
          await metadata.inspect('Primary machine');
          await expect(metadata.identity).toContainText('SN-100');
        }
        if (screen === 'registry') {
          await metadata.openRegistry();
          await expect(metadata.targetBindings).toContainText('binding-1');
        }
        const violations = await audit(page);
        observations.push({ screen, violations });
        writeQualityEvidence(repositoryRoot, 'accessibility', source, {
          viewport: viewport.name,
          theme,
          observations,
        });
        expect(
          violations,
          'Rendered accessibility rule IDs; DOM is redacted',
        ).toEqual([]);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      writeQualityEvidence(repositoryRoot, 'accessibility', source, {
        viewport: viewport.name,
        theme,
        observations,
      });
    });
  }
}
test('rendered signed-out and denied-access states remain accessible', async ({
  page,
}) => {
  const source = sourceIdentity(repositoryRoot);
  await page.setViewportSize({ width: 390, height: 844 });
  const api = await installMetadataApi(page, {
    sessionStatus: 401,
    catalogueStatus: 403,
  });
  const metadata = new ConnectedMetadataPage(page);
  await metadata.openCatalogue('&effective_at_ms=1500&known_at_ms=2500');
  await expect(
    page.getByRole('heading', { name: 'Sign in to FleetIQ' }),
  ).toBeVisible();
  const signedOut = await audit(page);
  writeQualityEvidence(repositoryRoot, 'accessibility', source, {
    viewport: 'narrow',
    theme: 'light',
    observations: [{ screen: 'signed-out', violations: signedOut }],
  });
  expect(signedOut).toEqual([]);
  api.setSessionStatus(200);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText(
    'Access to this tenant is denied',
  );
  const forbidden = await audit(page);
  writeQualityEvidence(repositoryRoot, 'accessibility', source, {
    viewport: 'narrow',
    theme: 'light',
    observations: [{ screen: 'forbidden', violations: forbidden }],
  });
  expect(forbidden).toEqual([]);
});

for (const viewport of viewports) {
  for (const theme of ['light', 'dark'] as const) {
    test(`rendered device commissioning accessibility ${viewport.name} ${theme}`, async ({
      page,
    }) => {
      const source = sourceIdentity(repositoryRoot);
      await page.setViewportSize(viewport);
      const api = await installDevicesApi(page);
      const devices = new DevicesPage(page);
      await devices.open();
      await devices.registerAsset();
      await devices.registerCapability();
      api.emitTraffic('gateway-new');
      await devices.refreshDiagnostics();
      await expect(devices.diagnostics).toContainText('battery.voltage');
      const frames = devices.diagnostics.getByRole('region', {
        name: 'Recent accepted frames',
        exact: true,
      });
      const refreshFrames = frames.getByRole('button', {
        name: 'Refresh diagnostics',
      });
      await refreshFrames.focus();
      await expect(refreshFrames).toBeFocused();
      await refreshFrames.press('ArrowDown');
      await expect
        .poll(() => frames.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0);
      if (theme === 'dark') await new ShellPage(page).cycleTheme();
      const violations = await audit(page);
      writeQualityEvidence(repositoryRoot, 'accessibility', source, {
        viewport: viewport.name,
        theme,
        observations: [{ screen: 'device-commissioning', violations }],
      });
      expect(
        violations,
        'Device accessibility rule IDs; DOM is redacted',
      ).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
  }
}

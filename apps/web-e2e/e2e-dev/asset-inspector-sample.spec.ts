import { expect, test } from '../fixtures/browser-quality-test';
import { AssetInspectorPage } from '../pages/asset-inspector.page';
import { OverviewPage } from '../pages/overview.page';
import { ShellPage } from '../pages/shell.page';

test('sample rail journey traces selected component evidence and preserves URL history', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1680, height: 940 });
  const shell = new ShellPage(page);
  const overview = new OverviewPage(page);
  const inspector = new AssetInspectorPage(page);

  await shell.open();
  await overview.searchFor('Electric locomotive 417');
  const inspectLink = overview.assetDiscovery.getByRole('link', {
    name: 'Inspect Electric locomotive 417',
  });
  await expect(inspectLink).toBeVisible();
  await inspectLink.click();

  await expect(page).toHaveURL('/assets/asset-004?preview=sample');
  await page.goBack();
  await expect(page).toHaveURL(/q=Electric/u);
  await expect(overview.searchAssets).toHaveValue('Electric locomotive 417');
  await page.goForward();
  await expect(page).toHaveURL('/assets/asset-004?preview=sample');
  await expect(inspector.heading).toHaveText('Electric locomotive 417');
  await expect(page.getByRole('banner')).toContainText('Sample data');
  for (const label of [
    'Asset condition',
    'Device connection',
    'Telemetry freshness',
  ]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  for (const panel of [
    inspector.topology,
    inspector.componentEvidence,
    inspector.context,
  ]) {
    await expect(panel).toBeVisible();
    await expect(
      panel.getByText('Sample data', { exact: true }).first(),
    ).toBeVisible();
  }
  expect((await inspector.topology.boundingBox())?.x ?? -1).toBeLessThan(
    (await inspector.componentEvidence.boundingBox())?.x ?? -1,
  );
  expect(
    (await inspector.componentEvidence.boundingBox())?.x ?? -1,
  ).toBeLessThan((await inspector.context.boundingBox())?.x ?? -1);

  await expect(inspector.node('Traction motor A')).toBeVisible();
  await expect(inspector.node('Battery management system')).toBeVisible();
  await expect(inspector.node('Telemetry gateway')).toBeVisible();
  await expect(inspector.componentEvidence).toContainText('Motor temperature');
  await expect(inspector.componentEvidence).toContainText('Illustrative band');
  await expect(inspector.componentEvidence).toContainText(/event/i);
  await expect(inspector.componentEvidence).toContainText(/received/i);
  await expect(inspector.context).toContainText(/source/i);
  await expect(inspector.context).toContainText('Binding');
  await expect(inspector.context).toContainText('Protocol package');
  await expect(inspector.context).toContainText('Target property');
  await expect(inspector.context).toContainText('Effective from');
  await expect(inspector.context).toContainText('Unassigned signals');

  const windowControls = inspector.componentEvidence.getByRole('group', {
    name: 'History window',
  });
  await windowControls.getByRole('button', { name: '1h' }).click();
  await expect(page).toHaveURL(/window=1h/u);
  const motorHistory = inspector.componentEvidence.getByRole('article').filter({
    has: page.getByRole('img', {
      name: /Sample history for Motor temperature/u,
    }),
  });
  await motorHistory.getByText('View readings as a table').click();
  await expect(motorHistory.getByRole('table')).toContainText('Gap');
  await inspector.componentEvidence
    .getByRole('tab', { name: 'Details' })
    .click();
  await expect(page).toHaveURL(/tab=details/u);
  await expect(inspector.componentEvidence).toContainText(
    'Physical relationship',
  );
  await inspector.componentEvidence
    .getByRole('tab', { name: 'Events' })
    .click();
  await expect(page).toHaveURL(/tab=events/u);
  await expect(inspector.componentEvidence).toContainText('Motor stream gap');
  await inspector.componentEvidence
    .getByRole('tab', { name: 'Overview' })
    .click();
  await inspector.selectNode('Battery management system');
  await expect(page).toHaveURL(/component=sample-bms-417/u);
  await expect(inspector.componentEvidence).toContainText(
    'Battery bus voltage',
  );
  await page.goBack();
  await expect(page).not.toHaveURL(/component=sample-bms-417/u);
  await expect(inspector.componentEvidence).toContainText('Motor temperature');
  await page.goForward();
  await expect(page).toHaveURL(/component=sample-bms-417/u);
  await page.reload();
  await expect(inspector.componentEvidence).toContainText(
    'Battery bus voltage',
  );

  await inspector.selectNode('Traction motor B');
  await expect(page).toHaveURL(/component=sample-motor-b-417/u);
  await expect(inspector.componentEvidence).toContainText(
    'No attributed readings',
  );
  await expect(inspector.context).toContainText('No attributed signal source');

  await shell.themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(inspector.context).toBeVisible();
});

test('sample trailer discloses missing evidence and stays usable at narrow width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const inspector = new AssetInspectorPage(page);

  await inspector.openSample('asset-008');
  await expect(inspector.heading).toHaveText('Refrigerated trailer 11');
  await expect(inspector.node('Refrigeration unit')).toBeVisible();
  await expect(inspector.node('Trailer tracker')).toBeVisible();
  await expect(
    page.getByText('No attributed observation in this snapshot'),
  ).toBeVisible();
  await expect(
    page.getByText('Telemetry freshness', { exact: true }),
  ).toBeVisible();
  await expect(inspector.componentEvidence).toContainText('No observation');
  await expect(inspector.componentEvidence).not.toContainText('0 °C');

  await inspector.selectNode('Trailer tracker');
  await expect(page).toHaveURL(/component=sample-tracker-011/u);
  await expect(inspector.componentEvidence).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('known asset without modeled topology gets an explicit sample empty state', async ({
  page,
}) => {
  await page.goto('/assets/asset-001?preview=sample');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Primary machine',
  );
  await expect(
    page.getByText('No sample topology for this asset'),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Browse sample assets' }),
  ).toHaveAttribute('href', '/assets?preview=sample');
});

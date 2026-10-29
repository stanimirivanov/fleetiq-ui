import { expect, test } from '../fixtures/production-test';
import { OverviewPage } from '../pages/overview.page';
import { ShellPage } from '../pages/shell.page';

test('production overview does not present sample operations as live evidence', async ({
  page,
}) => {
  const shell = new ShellPage(page);
  const overview = new OverviewPage(page);
  await shell.open('/?preview=sample&q=Power%20system&condition=critical');

  await expect(overview.heading).toBeVisible();
  await expect(overview.connectionNotice).toBeVisible();
  await expect(page.getByRole('banner')).toContainText('Sign-in unavailable');
  await expect(overview.metrics).toHaveCount(0);
  await expect(overview.map).toHaveCount(0);
  await expect(overview.assetDiscovery).toHaveCount(0);
  await expect(overview.attentionQueue).toHaveCount(0);
  await expect(overview.dataQuality).toHaveCount(0);
  await expect(overview.energyAndUtilization).toHaveCount(0);
  await expect(page.getByText('Sample data')).toHaveCount(0);
  await expect(page.getByText('Primary machine')).toHaveCount(0);
});

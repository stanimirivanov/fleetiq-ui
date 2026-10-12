import { expect, test } from '../fixtures/browser-quality-test';
import { AssetsPage } from '../pages/assets.page';
import { ShellPage } from '../pages/shell.page';

test('sample catalogue uses shareable forward cursors and browser history', async ({
  page,
}) => {
  const shell = new ShellPage(page);
  const assets = new AssetsPage(page);

  await shell.open('/assets');
  await expect(assets.heading).toBeVisible();
  await expect(assets.connectionNotice).toBeVisible();
  await expect(assets.samplePreview).toHaveCount(0);

  await assets.viewSampleLink.click();
  await expect(page).toHaveURL('/assets?preview=sample');
  await expect(assets.samplePreview).toBeVisible();
  await expect(page.getByRole('banner')).toContainText(
    'Sample data · development',
  );
  await expect(assets.samplePreview.getByText('Sample data')).toBeVisible();
  await expect(assets.samplePreview.getByText('Primary machine')).toBeVisible();
  await expect(assets.samplePreview.getByText('Power system')).toBeVisible();
  await expect(
    assets.samplePreview.getByText('Monitoring gateway'),
  ).toHaveCount(0);
  await expect(assets.nextPageLink).toBeVisible();
  await expect(assets.firstPageLink).toHaveCount(0);
  await expect(shell.main).not.toBeFocused();

  await assets.nextPageLink.click();
  await expect(page).toHaveURL('/assets?preview=sample&after=asset-002');
  await expect(
    assets.samplePreview.getByText('Monitoring gateway'),
  ).toBeVisible();
  await expect(assets.samplePreview.getByText('Primary machine')).toHaveCount(
    0,
  );
  await expect(assets.firstPageLink).toBeVisible();
  await expect(assets.nextPageLink).toBeVisible();
  await expect(shell.main).not.toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL('/assets?preview=sample');
  await expect(assets.samplePreview.getByText('Primary machine')).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL('/assets?preview=sample&after=asset-002');
  await expect(
    assets.samplePreview.getByText('Monitoring gateway'),
  ).toBeVisible();

  await assets.nextPageLink.click();
  await expect(page).toHaveURL('/assets?preview=sample&after=asset-004');
  await expect(
    assets.samplePreview.getByText('Diesel locomotive 206'),
  ).toBeVisible();
  await assets.nextPageLink.click();
  await expect(page).toHaveURL('/assets?preview=sample&after=asset-006');
  await expect(
    assets.samplePreview.getByText('Refrigerated trailer 11'),
  ).toBeVisible();
  await expect(assets.nextPageLink).toHaveCount(0);

  await assets.firstPageLink.click();
  await expect(page).toHaveURL('/assets?preview=sample');
  await expect(assets.samplePreview.getByText('Primary machine')).toBeVisible();

  await assets.exitSampleLink.click();
  await expect(page).toHaveURL('/assets');
  await expect(assets.connectionNotice).toBeVisible();
  await expect(assets.samplePreview).toHaveCount(0);
  await expect(page.getByRole('banner')).toContainText('Sign-in unavailable');
});

test('direct later page remains usable at a narrow width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const assets = new AssetsPage(page);

  await page.goto('/assets?preview=sample&after=asset-002');
  await expect(assets.heading).toBeVisible();
  await expect(assets.samplePreview).toBeVisible();
  await expect(
    assets.samplePreview.getByText('Monitoring gateway'),
  ).toBeVisible();
  await expect(assets.firstPageLink).toBeVisible();
  await expect(assets.exitSampleLink).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('invalid and exhausted cursors offer a first-page recovery', async ({
  page,
}) => {
  const assets = new AssetsPage(page);

  await page.goto('/assets?preview=sample&after=%20');
  await expect(assets.invalidCursorAlert).toBeVisible();
  await expect(
    assets.samplePreview.getByRole('list', { name: 'Sample assets' }),
  ).toHaveCount(0);
  await assets.firstPageLink.click();
  await expect(page).toHaveURL('/assets?preview=sample');
  await expect(assets.samplePreview.getByText('Primary machine')).toBeVisible();

  await page.goto('/assets?preview=sample&after=asset-999');
  await expect(
    assets.samplePreview.getByText(
      /No further sample assets follow this cursor/,
    ),
  ).toBeVisible();
  await expect(assets.firstPageLink).toBeVisible();
  await expect(assets.nextPageLink).toHaveCount(0);
});

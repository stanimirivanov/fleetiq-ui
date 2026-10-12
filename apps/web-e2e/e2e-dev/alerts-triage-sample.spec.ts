import { expect, test } from '../fixtures/browser-quality-test';
import { AlertsPage } from '../pages/alerts.page';
import { ShellPage } from '../pages/shell.page';

test('sample alert triage links priority, selection, evidence, filters, and history', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const alerts = new AlertsPage(page);
  await alerts.openSample();

  await expect(alerts.heading).toBeVisible();
  await expect(page.getByRole('banner')).toContainText('Sample data');
  await expect(alerts.summary).toBeVisible();
  await expect(alerts.queue).toBeVisible();
  await expect(alerts.alertList.getByRole('listitem')).toHaveCount(6);
  await expect(alerts.selectedEvidence).toBeVisible();
  await expect(
    alerts.alert('Inspection required', 'Diesel locomotive 206'),
  ).toHaveAttribute('aria-current', 'true');
  expect((await alerts.queue.boundingBox())?.x ?? -1).toBeLessThan(
    (await alerts.selectedEvidence.boundingBox())?.x ?? -1,
  );
  await expect(alerts.selectedEvidence).toContainText('Inspection required');
  await expect(alerts.selectedEvidence).toContainText(/stale/i);
  await expect(alerts.selectedEvidence).toContainText(/suspect/i);
  await expect(alerts.trend.getByRole('img')).toBeVisible();
  await alerts.showReadingsTable();
  await expect(alerts.trend.getByRole('table')).toBeVisible();
  await expect(alerts.timeline).toBeVisible();
  await expect(alerts.timeline.getByRole('listitem').first()).toBeVisible();
  await alerts.selectedEvidence
    .getByRole('link', { name: 'Open sample asset' })
    .click();
  await expect(page).toHaveURL('/assets/asset-005?preview=sample');
  await page.goBack();
  await expect(alerts.selectedEvidence).toContainText('Inspection required');

  await alerts.select('Power variation', 'Primary machine');
  await expect(page).toHaveURL(/alert=sample-alert-002/u);
  await expect(
    alerts.alert('Power variation', 'Primary machine'),
  ).toHaveAttribute('aria-current', 'true');
  await expect(alerts.selectedEvidence).toContainText('Power variation');
  await page.goBack();
  await expect(
    alerts.alert('Inspection required', 'Diesel locomotive 206'),
  ).toHaveAttribute('aria-current', 'true');
  await page.goForward();
  await expect(alerts.selectedEvidence).toContainText('Power variation');
  await page.reload();
  await expect(alerts.selectedEvidence).toContainText('Power variation');

  await alerts.select('Intermittent telemetry', 'Yard shunter 08');
  await alerts.search.fill('Intermittent');
  await expect(page).toHaveURL(/q=Intermittent/u);
  await expect(alerts.alertList.getByRole('listitem')).toHaveCount(1);
  await alerts.severity.selectOption('attention');
  await expect(page).toHaveURL(/severity=attention/u);
  await alerts.reviewState.selectOption('open');
  await expect(page).toHaveURL(/state=open/u);
  await expect(alerts.selectedEvidence).toContainText('Intermittent telemetry');

  await alerts.search.fill('no such alert');
  await expect(alerts.queue).toContainText(
    'No sample alerts match these filters.',
  );
  await expect(alerts.alertList).toHaveCount(0);
  await alerts.queue.getByRole('button', { name: 'Clear filters' }).click();
  await expect(alerts.alertList.getByRole('listitem')).toHaveCount(6);
});

test('invalid selection is recoverable and missing evidence stays explicit in narrow dark layout', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const shell = new ShellPage(page);
  const alerts = new AlertsPage(page);
  await alerts.openSample('&alert=not-an-alert');
  const criticalSummary = await alerts.summary
    .getByText('Critical', { exact: true })
    .locator('..')
    .boundingBox();
  const warningSummary = await alerts.summary
    .getByText('Warning', { exact: true })
    .locator('..')
    .boundingBox();
  const openSummary = await alerts.summary
    .getByText('Open', { exact: true })
    .locator('..')
    .boundingBox();
  expect(
    Math.abs((criticalSummary?.y ?? -100) - (warningSummary?.y ?? 100)),
  ).toBeLessThan(2);
  expect(warningSummary?.x ?? -1).toBeGreaterThan(criticalSummary?.x ?? 0);
  expect(openSummary?.y ?? -1).toBeGreaterThan(
    criticalSummary?.y ?? Number.POSITIVE_INFINITY,
  );

  await expect(alerts.selectedEvidence).toContainText(
    /not in this queue|unknown|excluded/i,
  );
  await alerts.selectedEvidence
    .getByRole('button', {
      name: 'Clear selection',
    })
    .click();
  await expect(
    alerts.alert('Inspection required', 'Diesel locomotive 206'),
  ).toHaveAttribute('aria-current', 'true');
  await alerts.select('Intermittent telemetry', 'Yard shunter 08');
  await expect(page).toHaveURL(/alert=sample-alert-003/u);
  await expect(alerts.selectedEvidence).toContainText(/missing/i);
  await expect(alerts.selectedEvidence).not.toContainText('0 °C');
  await expect(alerts.evidenceShortcut).toBeVisible();
  await alerts.evidenceShortcut.click();
  await expect(page).toHaveURL(/alert=sample-alert-003#alert-evidence$/u);
  await expect(
    alerts.alert('Intermittent telemetry', 'Yard shunter 08'),
  ).toHaveAttribute('aria-current', 'true');
  await expect(alerts.selectedEvidence).toBeInViewport();

  await shell.themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const queue = await alerts.queue.boundingBox();
  const detail = await alerts.selectedEvidence.boundingBox();
  expect((queue?.y ?? -1) + (queue?.height ?? 0)).toBeLessThan(
    (detail?.y ?? 0) + 8,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  const critical = alerts.alert('Inspection required', 'Diesel locomotive 206');
  await critical.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/alert=sample-alert-001/u);
  await expect(critical).toHaveAttribute('aria-current', 'true');
});

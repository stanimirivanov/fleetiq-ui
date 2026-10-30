import { expect, test } from '../fixtures/production-test';
import { AlertsPage } from '../pages/alerts.page';

test('production Alerts route cannot activate synthetic incidents', async ({
  page,
}) => {
  const alerts = new AlertsPage(page);
  await page.goto('/alerts?preview=sample');

  await expect(alerts.heading).toBeVisible();
  await expect(alerts.queue).toHaveCount(0);
  await expect(alerts.selectedEvidence).toHaveCount(0);
  await expect(page.getByRole('banner')).toContainText('Sign-in unavailable');

  await page.goto('/alerts');
  await expect(page.getByRole('banner')).toContainText('Sign-in unavailable');
  await expect(alerts.alertList).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'View sample alerts' }),
  ).toHaveCount(0);
});

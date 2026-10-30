import { installAlertRulesApi } from '../fixtures/alert-rules-api';
import { expect, test } from '../fixtures/production-test';
import { AlertRulesPage } from '../pages/alert-rules.page';

test('authors an exact revision and explicitly activates/deactivates after fresh head reads', async ({
  page,
}) => {
  const api = await installAlertRulesApi(page),
    rules = new AlertRulesPage(page);
  await rules.open();
  await expect(rules.threshold).toHaveValue('50');
  await rules.threshold.fill('12345678901234567890.1234567890123456789');
  await rules.append();
  await expect(rules.head).toContainText('latest revision 2');
  await expect(rules.region).toContainText('selected revision none');
  await page.getByLabel('Retained revision to activate').fill('2');
  await rules.activate();
  await expect(rules.region).toContainText(
    'Observed generation 1 · selected revision 2',
  );
  await page.getByRole('button', { name: 'Deactivate rule' }).click();
  await expect(rules.region).toContainText(
    'Observed generation 2 · selected revision none',
  );
  expect(
    api.requests.filter((r) => r.method === 'PUT').every((r) => r.csrf === '1'),
  ).toBe(true);
});
test('lost command response locks the captured payload and retries exactly before observing current head', async ({
  page,
}) => {
  const api = await installAlertRulesApi(page),
    rules = new AlertRulesPage(page);
  await rules.open();
  await expect(rules.threshold).toBeVisible();
  api.loseNext();
  await rules.threshold.fill('51.00000000000000000001');
  await rules.append();
  await expect(rules.region.getByRole('alert')).toContainText(
    'Outcome is unconfirmed',
  );
  await expect(rules.threshold).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Refresh rule configuration' }),
  ).toBeDisabled();
  await rules.retry();
  await expect(rules.head).toContainText('latest revision 2');
  const puts = api.requests.filter((r) => r.method === 'PUT');
  expect(puts).toHaveLength(2);
  expect(puts[0]?.body).toEqual(puts[1]?.body);
});
test('invalid, denied and conflict outcomes require correction or fresh-head recovery', async ({
  page,
}) => {
  const api = await installAlertRulesApi(page),
    rules = new AlertRulesPage(page);
  await rules.open();
  await rules.threshold.fill('1e128');
  await rules.append();
  await expect(rules.region.getByRole('alert')).toContainText(
    'Check exact IDs',
  );
  expect(api.requests.filter((r) => r.method === 'PUT')).toHaveLength(0);
  await rules.threshold.fill('60');
  api.deny();
  await rules.append();
  await expect(rules.region.getByRole('alert')).toHaveText('Access is denied');
  api.deny(false);
  api.conflict();
  await rules.activate();
  await expect(rules.region.getByRole('alert').last()).toContainText(
    'conflicts',
  );
  api.conflict(false);
  await page.getByRole('button', { name: 'Reload current rule head' }).click();
  await expect(rules.threshold).toHaveValue('50');
});

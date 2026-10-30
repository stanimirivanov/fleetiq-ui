import { installAlertsApi } from '../fixtures/alerts-api';
import { expect, test } from '../fixtures/production-test';
import { ConnectedAlertsPage } from '../pages/connected-alerts.page';

test('alert-only tenant reads bounded queue, pinned detail/history and separately authorized exact evidence', async ({
  page,
}) => {
  const api = await installAlertsApi(page),
    alerts = new ConnectedAlertsPage(page);
  await alerts.open();
  await alerts.selectRule();
  await alerts.inspectLatest();
  await expect(alerts.outputs).toContainText(
    '12345678901234567890.1234567890123456789 volt',
  );
  await expect(alerts.evidence).toContainText('evaluation-b');
  await expect(alerts.detail).toContainText('mean@1');
  expect(
    api.requests.every(
      (r) => r.method === 'GET' && r.authorization === undefined,
    ),
  ).toBe(true);
  expect(
    api.requests.filter((r) => r.path.endsWith('/alerts'))[0]?.search,
  ).toBe('?limit=20');
  expect(
    api.requests.some((r) =>
      r.path.endsWith('/assets/asset-a/calculator-evaluations/evaluation-b'),
    ),
  ).toBe(true);
  await alerts.transitions
    .getByRole('link', { name: 'Next transitions' })
    .click();
  await expect(page).toHaveURL(/history_after=v1.01/);
  await expect(alerts.evidence).toHaveCount(0);
  await alerts.queue.getByRole('link', { name: 'Next alerts' }).click();
  await expect(alerts.queue).toContainText('voltage-next');
  await expect(alerts.detail).toHaveCount(0);
  await alerts.filter.selectOption('resolved');
  await expect(alerts.queue).toContainText('No observed alerts on this page');
  expect(new URL(page.url()).searchParams.has('after')).toBe(false);
});
test('evidence denial stays local and explicit retry recovers without hiding alert observations', async ({
  page,
}) => {
  const api = await installAlertsApi(page),
    alerts = new ConnectedAlertsPage(page);
  api.denyEvidence(403);
  await alerts.open(
    '?tenant=tenant-a&rule=voltage-high&revision=1&evaluation=evaluation-b',
  );
  await expect(alerts.evidence.getByRole('alert')).toHaveText(
    'Access is denied',
  );
  await expect(alerts.detail).toContainText('voltage-high');
  await expect(alerts.outputs).toHaveCount(0);
  api.denyEvidence(200);
  await alerts.evidence
    .getByRole('button', { name: 'Retry calculator evaluation evidence' })
    .click();
  await expect(alerts.outputs).toContainText('referenced slot');
});
test('malformed, denied and empty queue responses never become synthetic incidents', async ({
  page,
}) => {
  const api = await installAlertsApi(page),
    alerts = new ConnectedAlertsPage(page);
  api.denyAlerts(403);
  await alerts.open();
  await expect(alerts.queue.getByRole('alert')).toHaveText('Access is denied');
  api.denyAlerts(200);
  api.empty();
  await alerts.queue.getByRole('button', { name: 'Retry alert queue' }).click();
  await expect(alerts.queue).toContainText('No observed alerts');
  api.malformed();
  await alerts.open();
  await expect(alerts.queue.getByRole('alert')).toHaveText(
    'The server response is invalid',
  );
  await expect(page.getByText('do-not-render')).toHaveCount(0);
});
test('scope navigation cancels delayed queue work and late evidence cannot replace the current filter', async ({
  page,
}) => {
  const api = await installAlertsApi(page),
    alerts = new ConnectedAlertsPage(page),
    release = api.holdQueue();
  await alerts.open();
  await expect(alerts.queue.getByRole('status')).toHaveText('Loading…');
  await expect
    .poll(() => api.requests.filter((r) => r.path.endsWith('/alerts')).length)
    .toBe(1);
  await alerts.filter.selectOption('resolved');
  release();
  await expect(alerts.queue).toContainText('No observed alerts');
  await expect(
    alerts.queue.getByRole('link', { name: 'voltage-high · revision 1' }),
  ).toHaveCount(0);
});

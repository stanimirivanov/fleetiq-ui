import { installAcknowledgementApi } from '../fixtures/acknowledgement-api';
import { expect, test } from '../fixtures/production-test';
import { ConnectedAlertsPage } from '../pages/connected-alerts.page';

const selection = '?tenant=tenant-a&rule=voltage-high&revision=1';
test('acknowledges the displayed version with independent authority and retains its phase/evidence', async ({
  page,
}) => {
  const api = await installAcknowledgementApi(page),
    alerts = new ConnectedAlertsPage(page);
  await alerts.open(selection);
  await page
    .getByRole('button', { name: 'Acknowledge displayed version' })
    .click();
  await expect(alerts.detail).toContainText(
    'Acknowledged version 2 by operator-a',
  );
  await expect(alerts.detail).toContainText('revision 1 · firing');
  await expect(
    page.getByRole('button', { name: 'Acknowledge displayed version' }),
  ).toBeDisabled();
  expect(api.requests).toEqual([
    { body: { expected_version: '2' }, csrf: '1', authorization: undefined },
  ]);
});
test('unknown outcome permits only the captured acknowledgement retry after later denial', async ({
  page,
}) => {
  const api = await installAcknowledgementApi(page),
    alerts = new ConnectedAlertsPage(page);
  api.setMode('lost');
  await alerts.open(selection);
  await page
    .getByRole('button', { name: 'Acknowledge displayed version' })
    .click();
  await expect(alerts.detail.getByRole('alert')).toContainText(
    'Outcome is unconfirmed',
  );
  api.setMode('denied');
  await page.getByRole('button', { name: 'Retry exact command' }).click();
  await expect(alerts.detail.getByRole('alert')).toContainText(
    'Outcome is unconfirmed',
  );
  await expect(
    page.getByRole('button', { name: 'Acknowledge displayed version' }),
  ).toBeDisabled();
  api.setMode('ok');
  await page.getByRole('button', { name: 'Retry exact command' }).click();
  await expect(alerts.detail).toContainText(
    'Acknowledged version 2 by operator-a',
  );
  expect(api.requests).toHaveLength(3);
  expect(
    api.requests.every(
      (r) => JSON.stringify(r.body) === '{"expected_version":"2"}',
    ),
  ).toBe(true);
});
test('a resolution race exposes conflict and refreshes the exact current alert before another action', async ({
  page,
}) => {
  const api = await installAcknowledgementApi(page),
    alerts = new ConnectedAlertsPage(page);
  api.setMode('conflict');
  await alerts.open(selection);
  await page
    .getByRole('button', { name: 'Acknowledge displayed version' })
    .click();
  await expect(alerts.detail.getByRole('alert')).toContainText('conflicts');
  await page.getByRole('button', { name: 'Refresh current alert' }).click();
  await expect(alerts.detail).toContainText('revision 1 · resolved');
  await expect(
    page.getByRole('button', { name: 'Acknowledge displayed version' }),
  ).toBeDisabled();
  expect(api.requests).toHaveLength(1);
});

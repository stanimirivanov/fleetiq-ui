import { installMetadataApi } from '../fixtures/metadata-api';
import { expect, test } from '../fixtures/production-test';
import { installPropertyLiveApi } from '../fixtures/property-live-api';
import { installTelemetryApi } from '../fixtures/telemetry-api';
import { PropertyLivePage } from '../pages/property-live.page';

test('live inspector resumes replacements, resets continuity and stops on denied access', async ({
  page,
}) => {
  await installMetadataApi(page);
  await installTelemetryApi(page);
  const api = await installPropertyLiveApi(page),
    inspector = new PropertyLivePage(page);
  await inspector.open();
  await expect(inspector.readings).toContainText('32.1');
  await inspector.start();
  await expect(inspector.delivery).toContainText('revision 9');
  api.advance();
  await expect(inspector.delivery).toContainText('revision 20');
  api.advance();
  await expect.poll(() => api.cursors.length).toBe(4);
  api.advance();
  await expect(inspector.delivery).toContainText('revision 30');
  api.advance();
  await expect(inspector.delivery).toContainText('Access is denied');
  await expect(inspector.delivery).not.toContainText('Committed reading');
  await expect(inspector.history).toHaveCount(0);
  expect(api.cursors).toEqual([
    undefined,
    `v1.${'a'.repeat(64)}.1.9`,
    `v1.${'a'.repeat(64)}.1.20`,
    undefined,
    `v1.${'a'.repeat(64)}.1.30`,
  ]);
});

test('bounded high-rate updates retain one reading and dispose on stop in narrow layout', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installMetadataApi(page);
  await installTelemetryApi(page);
  await installPropertyLiveApi(page, 200);
  const inspector = new PropertyLivePage(page);
  await inspector.open();
  await inspector.start();
  await expect(inspector.delivery).toContainText('revision 209');
  await expect(inspector.delivery.getByText(/Committed reading/)).toHaveCount(
    1,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await inspector.stop();
  await expect(inspector.delivery).toContainText('Delivery: paused');
  await expect(inspector.delivery).not.toContainText('Committed reading');
  await inspector.leave();
  await expect(inspector.delivery).toHaveCount(0);
});

test('expired stream handshake invalidates the operator session without retry', async ({
  page,
}) => {
  const metadata = await installMetadataApi(page);
  await installTelemetryApi(page);
  let calls = 0;
  await page.route(
    '**/api/v1/tenants/*/assets/*/properties/*/versions/*/live',
    async (route) => {
      calls++;
      metadata.setSessionStatus(401);
      await route.fulfill({
        status: 401,
        contentType: 'application/problem+json',
        body: '{"status":401,"title":"Sign-in required","type":"about:blank"}',
      });
    },
  );
  const live = new PropertyLivePage(page);
  await live.open();
  await live.start();
  await expect(
    page.getByRole('heading', { name: 'Sign in to FleetIQ' }),
  ).toBeVisible();
  await expect(live.readings).toHaveCount(0);
  expect(calls).toBe(1);
});

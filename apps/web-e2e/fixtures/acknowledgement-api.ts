import type { Page } from '@playwright/test';
import { installAlertsApi } from './alerts-api';
export async function installAcknowledgementApi(page: Page) {
  const alerts = await installAlertsApi(page);
  alerts.metadata.setTenants([
    { tenant_id: 'tenant-a', actions: ['alerts.read', 'alerts.acknowledge'] },
  ]);
  let mode: 'ok' | 'lost' | 'conflict' | 'denied' = 'ok',
    stored:
      | { version: string; actor_id: string; recorded_at_ms: string }
      | undefined;
  const requests: { body: unknown; csrf?: string; authorization?: string }[] =
    [];
  await page.route(
    '**/api/v1/tenants/*/alerts/*/revisions/*/acknowledgement',
    async (route) => {
      const request = route.request(),
        body = request.postDataJSON();
      requests.push({
        body,
        csrf: request.headers()['x-fleetiq-csrf'],
        authorization: request.headers().authorization,
      });
      let status = 200;
      if (mode === 'conflict') {
        alerts.resolve();
        status = 409;
      } else if (mode === 'denied') status = 403;
      else {
        stored ??= {
          version: body.expected_version,
          actor_id: 'operator-a',
          recorded_at_ms: '2015',
        };
        alerts.annotate(stored);
        if (mode === 'lost') {
          mode = 'ok';
          status = 500;
        }
      }
      await route.fulfill({
        status,
        contentType:
          status === 200 ? 'application/json' : 'application/problem+json',
        headers: { 'cache-control': 'no-store' },
        body: JSON.stringify(
          status === 200
            ? stored
            : { type: 'about:blank', title: 'Failure', status },
        ),
      });
    },
  );
  return {
    alerts,
    requests,
    setMode: (value: typeof mode) => {
      mode = value;
    },
  };
}

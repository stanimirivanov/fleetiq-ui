import type { Page } from '@playwright/test';
import { Schema } from 'effect';
import { RestoreJob } from '../../web/src/generated/fleetiq-api';

export async function installRestoreApi(page: Page) {
  const requests: {
    method: string;
    path: string;
    csrf: string | undefined;
    body: string | null;
  }[] = [];
  let first = true;
  await page.route('**/api/v1/tenants/tenant-a/restores/**', async (route) => {
    const request = route.request();
    const method = request.method();
    requests.push({
      method,
      path: new URL(request.url()).pathname,
      csrf: request.headers()['x-fleetiq-csrf'],
      body: request.postData(),
    });
    if (first) {
      first = false;
      return route.fulfill({ status: 500, json: {} });
    }
    return route.fulfill({
      status: method === 'PUT' ? 202 : 200,
      json: Schema.decodeUnknownSync(RestoreJob)({
        manifest_id: '7',
        restore_generation: '1',
        state: method === 'PUT' ? 'pending' : 'ready',
      }),
    });
  });
  return requests;
}

import type { Page } from '@playwright/test';
import { installMetadataApi } from './metadata-api';

export async function installOperationsApi(page: Page) {
  await installMetadataApi(page, {
    tenants: [
      {
        tenant_id: 'tenant-a',
        actions: ['operations.read', 'operations.manage'],
      },
      { tenant_id: 'tenant-b', actions: ['operations.read'] },
    ],
  });
  let mode: 'ok' | 'lost' | 'conflict' | 'denied' = 'ok';
  let generation = '9007199254740993';
  const controls = new Map<string, { generation: string; paused: boolean }>();
  const receipts = new Map<
    string,
    {
      request_id?: string;
      generation: string;
      actor_id: string;
      recorded_at_ms: string;
    }
  >();
  let retryAvailable = true;
  const requests: {
    path: string;
    body: unknown;
    csrf?: string;
    authorization?: string;
  }[] = [];
  await page.route('**/api/v1/tenants/*/work-diagnostics', (route) => {
    const first = route.request().url().includes('/tenant-a/');
    return route.fulfill({
      json: {
        observed_at_ms: '60000',
        worker_liveness: 'not_observed',
        notification_seeding: 'not_observed',
        sample_limit: 64,
        queues: [
          'replay',
          'calculator',
          'alert_evaluation',
          'notification',
        ].map((kind) => {
          const eligible = kind === 'replay' && first ? 1 : 0;
          return {
            kind,
            sampled: eligible,
            eligible,
            leased: 0,
            failed: 0,
            blocked: 0,
            deferred: 0,
            max_attempts: 0,
            oldest_sampled_eligible_at_ms: eligible ? '0' : null,
            failure_categories: [],
            truncated: false,
          };
        }),
      },
    });
  });
  await page.route('**/api/v1/tenants/*/work-recovery/*', (route) => {
    const path = new URL(route.request().url()).pathname;
    const kind = path.split('/').at(-1);
    return route.fulfill({
      json: {
        kind,
        control: controls.get(path) ?? { generation: '0', paused: false },
        truncated: false,
        targets:
          kind === 'replay' && retryAvailable
            ? [{ target: { id: 'frame-1' }, expected_generation: generation }]
            : [],
      },
    });
  });
  await page.route(
    '**/api/v1/tenants/*/work-recovery/*/commands/*',
    (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const body = request.postDataJSON();
      requests.push({
        path,
        body,
        csrf: request.headers()['x-fleetiq-csrf'],
        authorization: request.headers().authorization,
      });
      const status = { ok: 200, lost: 500, conflict: 409, denied: 403 }[mode];
      if (mode === 'conflict') generation = '9007199254740995';
      if ((mode === 'ok' || mode === 'lost') && !receipts.has(path)) {
        const nextGeneration = String(BigInt(body.expected_generation) + 1n);
        receipts.set(path, {
          request_id: path.split('/').at(-1),
          generation: nextGeneration,
          actor_id: 'operator-a',
          recorded_at_ms: '60001',
        });
        if (body.operation === 'retry') retryAvailable = false;
        else
          controls.set(path.split('/commands/')[0] ?? '', {
            generation: nextGeneration,
            paused: body.operation === 'pause',
          });
      }
      if (mode === 'lost') mode = 'ok';
      return route.fulfill({
        status,
        json:
          status === 200
            ? receipts.get(path)
            : { type: 'about:blank', title: 'Failure', status },
      });
    },
  );
  return {
    requests,
    setMode(value: typeof mode) {
      mode = value;
    },
  };
}

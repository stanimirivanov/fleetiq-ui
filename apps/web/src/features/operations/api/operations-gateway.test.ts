import { afterEach, expect, test } from 'vitest';
import { type BrowserApi, createBrowserApi } from '#shared/api';
import {
  createOperationsGateway,
  type RecoveryRequest,
} from './operations-gateway';

const runtimes: BrowserApi[] = [];
const signal = new AbortController().signal;
afterEach(async () => {
  await Promise.all(runtimes.splice(0).map((runtime) => runtime.dispose()));
});
function gateway(body: unknown) {
  const api = createBrowserApi({
    origin: 'https://fleet.example',
    fetch: async () => Response.json(body),
  });
  runtimes.push(api);
  return createOperationsGateway(api);
}

test('rejects a preparation for another work family and targets from the wrong family', async () => {
  const preparation = {
    kind: 'replay',
    control: { generation: '0', paused: false },
    targets: [
      { target: { id: 'frame-a' }, expected_generation: '9223372036854775806' },
    ],
    truncated: false,
  };
  await expect(
    gateway(preparation).prepare('tenant-a', 'replay', signal),
  ).resolves.toEqual(preparation);
  await expect(
    gateway(preparation).prepare('tenant-a', 'calculator', signal),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
  await expect(
    gateway({ ...preparation, kind: 'notification' }).prepare(
      'tenant-a',
      'notification',
      signal,
    ),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
});

test('rejects diagnostics that reuse a family or count more positions than sampled', async () => {
  const queue = {
    kind: 'replay',
    sampled: 0,
    eligible: 0,
    leased: 0,
    failed: 0,
    blocked: 0,
    deferred: 0,
    max_attempts: 0,
    oldest_sampled_eligible_at_ms: null,
    failure_categories: [],
    truncated: false,
  };
  const view = {
    observed_at_ms: '1500',
    worker_liveness: 'not_observed',
    notification_seeding: 'not_observed',
    sample_limit: 64,
    queues: [
      queue,
      ...['calculator', 'alert_evaluation', 'notification'].map((kind) => ({
        ...queue,
        kind,
      })),
    ],
  };
  await expect(gateway(view).diagnostics('tenant-a', signal)).resolves.toEqual(
    view,
  );
  for (const first of [
    { ...queue, kind: 'calculator' },
    { ...queue, failed: 1 },
  ]) {
    const wrong = { ...view, queues: [first, ...view.queues.slice(1)] };
    await expect(
      gateway(wrong).diagnostics('tenant-a', signal),
    ).rejects.toMatchObject({ kind: 'invalid-response' });
  }
});

test('binds the receipt to the captured request, actor, and exact next generation', async () => {
  const request: RecoveryRequest = {
    tenant: 'tenant-a',
    kind: 'replay',
    actor: 'operator-a',
    requestId: 'request-a',
    body: {
      operation: 'retry',
      target: { id: 'frame-a' },
      expected_generation: '9007199254740993',
    },
  };
  const receipt = {
    request_id: 'request-a',
    actor_id: 'operator-a',
    generation: '9007199254740994',
    recorded_at_ms: '9007199254740995',
  };
  await expect(gateway(receipt).apply(request, signal)).resolves.toEqual(
    receipt,
  );
  for (const changed of [
    { request_id: 'request-b' },
    { actor_id: 'operator-b' },
    { generation: '9007199254740993' },
    { recorded_at_ms: '9223372036854775808' },
  ]) {
    await expect(
      gateway({ ...receipt, ...changed }).apply(request, signal),
    ).rejects.toMatchObject({ kind: 'invalid-response' });
  }
});

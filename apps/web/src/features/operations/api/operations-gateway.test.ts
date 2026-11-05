import { afterEach, expect, test, vi } from 'vitest';
import { type BrowserApi, createBrowserApi } from '#shared/api';
import type { RecoveryRequest } from '../model/recovery';
import { createOperationsGateway } from './operations-gateway';

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
  ).resolves.toEqual({
    ...preparation,
    targets: [
      { target: { id: 'frame-a' }, expectedGeneration: '9223372036854775806' },
    ],
  });
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
      expectedGeneration: '9007199254740993',
    },
  };
  const receipt = {
    request_id: 'request-a',
    actor_id: 'operator-a',
    generation: '9007199254740994',
    recorded_at_ms: '9007199254740995',
  };
  await expect(gateway(receipt).apply(request, signal)).resolves.toEqual({
    requestId: receipt.request_id,
    actorId: receipt.actor_id,
    generation: receipt.generation,
    recordedAtMs: receipt.recorded_at_ms,
  });
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

test('maps notification preparation into owned recovery values without losing exact counters', async () => {
  const wire = {
    kind: 'notification',
    control: { generation: '9007199254740993', paused: true },
    targets: [
      {
        target: {
          destination: 'ab'.repeat(32),
          rule_id: 'high',
          revision: '4294967295',
          firing_version: '9007199254740995',
        },
        expected_generation: '9007199254740996',
      },
    ],
    truncated: false,
  };
  await expect(
    gateway(wire).prepare('tenant-a', 'notification', signal),
  ).resolves.toEqual({
    kind: 'notification',
    control: wire.control,
    targets: [
      {
        target: {
          destination: 'ab'.repeat(32),
          ruleId: 'high',
          revision: '4294967295',
          firingVersion: '9007199254740995',
        },
        expectedGeneration: '9007199254740996',
      },
    ],
    truncated: false,
  });
});

test('rejects malformed and inconsistent recovery preparations at the transport boundary', async () => {
  const view = {
    kind: 'notification',
    control: { generation: '1', paused: false },
    targets: [
      {
        target: {
          destination: 'ab'.repeat(32),
          rule_id: 'high',
          revision: '1',
          firing_version: '1',
        },
        expected_generation: '2',
      },
    ],
    truncated: false,
  };
  for (const changed of [
    { control: { generation: '0', paused: true } },
    { control: { generation: '9223372036854775808', paused: false } },
    { targets: [view.targets[0], view.targets[0]] },
    { truncated: true },
    {
      targets: [
        { ...view.targets[0], expected_generation: '9223372036854775807' },
      ],
    },
    {
      targets: [
        {
          ...view.targets[0],
          target: { ...view.targets[0]?.target, revision: '4294967296' },
        },
      ],
    },
    {
      targets: [
        {
          ...view.targets[0],
          target: {
            ...view.targets[0]?.target,
            firing_version: '9223372036854775808',
          },
        },
      ],
    },
    {
      targets: [
        {
          ...view.targets[0],
          target: { ...view.targets[0]?.target, destination: 'invalid' },
        },
      ],
    },
  ]) {
    await expect(
      gateway({ ...view, ...changed }).prepare(
        'tenant-a',
        'notification',
        signal,
      ),
    ).rejects.toMatchObject({ kind: 'invalid-response' });
  }
});

test('maps owned retries to wire payloads and keeps exact request identity across repeated sends', async () => {
  const receipt = {
    request_id: 'request-a',
    actor_id: 'operator-a',
    generation: '9007199254740994',
    recorded_at_ms: '9007199254740995',
  };
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json(receipt),
  );
  const api = createBrowserApi({ origin: 'https://fleet.example', fetch });
  runtimes.push(api);
  const write = createOperationsGateway(api);
  const request: RecoveryRequest = {
    tenant: 'tenant-a',
    kind: 'notification',
    actor: 'operator-a',
    requestId: 'request-a',
    body: {
      operation: 'retry',
      expectedGeneration: '9007199254740993',
      target: {
        destination: 'ab'.repeat(32),
        ruleId: 'high',
        revision: '4294967295',
        firingVersion: '9007199254740995',
      },
    },
  };
  const first = await write.apply(request, signal);
  expect(await write.apply(request, signal)).toEqual(first);
  expect(fetch).toHaveBeenCalledTimes(2);
  for (const [url, init] of fetch.mock.calls) {
    expect(String(url)).toBe(
      'https://fleet.example/api/v1/tenants/tenant-a/work-recovery/notification/commands/request-a',
    );
    expect(init?.method).toBe('PUT');
    expect(new Headers(init?.headers).get('x-fleetiq-csrf')).toBe('1');
    expect(init?.credentials).toBe('same-origin');
    expect(new Headers(init?.headers).has('authorization')).toBe(false);
    expect(JSON.parse(String(init?.body))).toEqual({
      operation: 'retry',
      expected_generation: '9007199254740993',
      target: {
        destination: 'ab'.repeat(32),
        rule_id: 'high',
        revision: '4294967295',
        firing_version: '9007199254740995',
      },
    });
  }
});

test.each(['pause', 'resume'] as const)(
  'preserves the empty %s target and exact control generation on the wire',
  async (operation) => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      Response.json({
        request_id: 'control-a',
        actor_id: 'operator-a',
        generation: '2',
        recorded_at_ms: '1000',
      }),
    );
    const api = createBrowserApi({ origin: 'https://fleet.example', fetch });
    runtimes.push(api);
    await createOperationsGateway(api).apply(
      {
        tenant: 'tenant-a',
        kind: 'alert_evaluation',
        actor: 'operator-a',
        requestId: 'control-a',
        body: { operation, expectedGeneration: '1', target: {} },
      },
      signal,
    );
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      operation,
      expected_generation: '1',
      target: {},
    });
  },
);

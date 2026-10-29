import { afterEach, expect, test, vi } from 'vitest';
import { type BrowserApi, createBrowserApi } from '#shared/api';

const diagnosticsEvidence = (populated = false) => ({
  observed_at_ms: 2500,
  connection_liveness: 'not_observed',
  worker_liveness: 'not_observed',
  coverage: {
    frame_limit: 64,
    output_limit_per_frame: 64,
    source_limit: 128,
    frames_truncated: populated,
    observations_truncated: false,
    sources_truncated: false,
  },
  frames: [],
  sources: populated
    ? [
        {
          endpoint_id: 'can-primary',
          signal_id: 'battery.voltage',
          package_id: 'custom.protocol',
          package_version: '1',
        },
      ]
    : [],
});

import { createBindingGateway } from './binding-gateway';

const owned: BrowserApi[] = [];
afterEach(async () => {
  await Promise.all(owned.splice(0).map((api) => api.dispose()));
});
const source = {
  device_asset_id: 'gateway-1',
  endpoint_id: 'can-primary',
  signal_id: 'battery.voltage',
};
const draft = {
  source,
  target: {
    asset_id: 'asset-a',
    property: { id: 'battery.voltage', version: 3 },
  },
  effective_interval: { start_ms: -100, end_ms: 200 },
};
function setup(body: unknown, status = 200) {
  const fetch = vi.fn<typeof globalThis.fetch>(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
  );
  const api = createBrowserApi({ origin: 'https://fleet.test', fetch });
  owned.push(api);
  return { gateway: createBindingGateway(api), fetch };
}
test('binding commands preserve exact source/target, decimal revision and CSRF with original audit receipt', async () => {
  const revision = '18446744073709551615';
  const s = setup(
    {
      outcome: 'appended',
      id: 'binding-a',
      revision,
      recorded_by: 'operator-a',
      recorded_at_ms: 2500,
    },
    201,
  );
  expect(
    await s.gateway.append('tenant-a', 'binding-a', revision, draft),
  ).toMatchObject({ actor: 'operator-a', revision, recordedAt: 2500 });
  const [url, init] = s.fetch.mock.calls[0] ?? [];
  expect(String(url)).toContain(
    `/signal-bindings/binding-a/revisions/${revision}`,
  );
  expect(new Headers(init?.headers).get('X-FleetIQ-CSRF')).toBe('1');
  expect(init?.credentials).toBe('same-origin');
  expect(JSON.parse(String(init?.body))).toEqual(draft);
  await expect(
    s.gateway.append('tenant-a', 'different', revision, draft),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
});
test('exact revision reads never substitute another revision, tenant or source tuple', async () => {
  const fact = {
    ...draft,
    id: 'binding-a',
    tenant_id: 'tenant-a',
    revision: '2',
    recorded_at_ms: 2500,
  };
  const s = setup(fact);
  expect((await s.gateway.exact('tenant-a', 'binding-a', '2')).source).toEqual(
    source,
  );
  await expect(
    s.gateway.exact('tenant-a', 'binding-a', '1'),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
  await expect(
    s.gateway.exact('tenant-b', 'binding-a', '2'),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
  await expect(
    s.gateway.exact('tenant-a', 'binding-a', '0'),
  ).rejects.toMatchObject({ kind: 'invalid-request' });
});
test('registered endpoints and observed sources retain distinct scope and bounded coverage', async () => {
  const device = setup({
    tenant_id: 'tenant-a',
    asset_id: 'gateway-1',
    endpoints: [{ id: 'can-primary', kind: 'bus.can', name: 'Primary CAN' }],
  });
  expect(
    (await device.gateway.device('tenant-a', 'gateway-1')).endpoints,
  ).toHaveLength(1);
  await expect(
    device.gateway.device('tenant-b', 'gateway-1'),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
  const observed = setup(diagnosticsEvidence(true));
  expect(
    (await observed.gateway.observed('tenant-a', 'gateway-1')).truncated,
  ).toBe(true);
  const empty = setup(diagnosticsEvidence(false));
  expect(
    (await empty.gateway.observed('tenant-a', 'gateway-1')).sources,
  ).toEqual([]);
});
test('invalid input, denied writes and conflicts stay failures, never optimistic binding success', async () => {
  const s = setup({ type: 'about:blank', title: 'Conflict', status: 409 }, 409);
  await expect(
    s.gateway.append('tenant-a', 'binding-a', '1', {
      ...draft,
      source: { ...source, signal_id: '' },
    }),
  ).rejects.toMatchObject({ kind: 'invalid-request' });
  expect(s.fetch).not.toHaveBeenCalled();
  await expect(
    s.gateway.append('tenant-a', 'binding-a', '1', draft),
  ).rejects.toMatchObject({ kind: 'conflict' });
  const denied = setup(
    { type: 'about:blank', title: 'Forbidden', status: 403 },
    403,
  );
  await expect(
    denied.gateway.append('tenant-a', 'binding-a', '1', draft),
  ).rejects.toMatchObject({ kind: 'forbidden' });
});

import { afterEach, expect, test, vi } from 'vitest';
import { type BrowserApi, createBrowserApi } from '#shared/api';
import { createCommissioningGateway } from './commissioning-gateway';

const owned: BrowserApi[] = [];
afterEach(async () => {
  await Promise.all(owned.splice(0).map((api) => api.dispose()));
});
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
  return { gateway: createCommissioningGateway(api), fetch };
}
const draft = {
  id: 'asset-a',
  name: 'Equipment',
  asset_type: { id: 'equipment', version: 1 },
  external_identifiers: [],
};
const edge = {
  relationship_type: { id: 'contains', version: 2 },
  source_asset_id: 'asset-a',
  target_asset_id: 'asset-b',
  effective_interval: { start_ms: -100, end_ms: 200 },
};
test('asset registration uses cookie runtime and exact CSRF/body without client attribution', async () => {
  const s = setup(
    {
      outcome: 'registered',
      registered_by: 'operator-a',
      recorded_at_ms: 2500,
    },
    201,
  );
  expect(await s.gateway.register('tenant-a', draft)).toEqual({
    outcome: 'registered',
    actor: 'operator-a',
    recordedAt: 2500,
  });
  const [url, init] = s.fetch.mock.calls[0] ?? [];
  expect(String(url)).toContain('/tenants/tenant-a/assets');
  expect(new Headers(init?.headers).get('X-FleetIQ-CSRF')).toBe('1');
  expect(new Headers(init?.headers).has('authorization')).toBe(false);
  expect(init?.credentials).toBe('same-origin');
  expect(JSON.parse(String(init?.body))).toEqual(draft);
});
test('relationship commands preserve direction, interval and full u64 identity and validate receipt scope', async () => {
  const revision = '18446744073709551615';
  const s = setup(
    {
      outcome: 'appended',
      id: 'edge-a',
      revision,
      recorded_by: 'operator-a',
      recorded_at_ms: 2500,
    },
    201,
  );
  expect(
    (await s.gateway.append('tenant-a', 'edge-a', revision, edge)).revision,
  ).toBe(revision);
  expect(String(s.fetch.mock.calls[0]?.[0])).toContain(
    `/relationships/edge-a/revisions/${revision}`,
  );
  expect(JSON.parse(String(s.fetch.mock.calls[0]?.[1]?.body))).toEqual(edge);
  await expect(
    s.gateway.append('tenant-a', 'other', revision, edge),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
});
test('invalid commands fail before HTTP and conflicts stay typed rather than becoming success', async () => {
  const s = setup({ type: 'about:blank', title: 'Conflict', status: 409 }, 409);
  await expect(
    s.gateway.register('tenant-a', { ...draft, id: 'bad id' }),
  ).rejects.toMatchObject({ kind: 'invalid-request' });
  expect(s.fetch).not.toHaveBeenCalled();
  await expect(s.gateway.register('tenant-a', draft)).rejects.toMatchObject({
    kind: 'conflict',
  });
});
test('definition pages enforce bounded exact numeric ordering and terminal cursor identity', async () => {
  const defs = [
    { id: 'contains', version: 2, name: 'Contains' },
    { id: 'contains', version: 10, name: 'Contains' },
  ];
  const s = setup({
    definitions: defs,
    next_after: { id: 'contains', version: 10 },
  });
  expect(
    (await s.gateway.types('tenant-a', 'relationship', null)).next?.version,
  ).toBe(10);
  await expect(
    s.gateway.types('tenant-a', 'relationship', {
      id: 'contains',
      version: 10,
    }),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
  const invalid = setup({
    definitions: defs,
    next_after: { id: 'unrelated', version: 1 },
  });
  await expect(
    invalid.gateway.types('tenant-a', 'asset', null),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
});

import { afterEach, expect, test } from 'vitest';
import { type BrowserApi, createBrowserApi } from '#shared/api';
import { createOperatorTenantReader } from './operator-tenant-reader';

const lifetimes: BrowserApi[] = [];
afterEach(async () => {
  await Promise.all(lifetimes.splice(0).map((api) => api.dispose()));
});
const completeActions = [
  'access.manage',
  'metadata.manage',
  'metadata.read',
  'protocol.manage',
  'telemetry.read',
  'analytics.manage',
  'alerts.read',
  'alerts.manage',
  'alerts.acknowledge',
] as const;
const payload = {
  tenants: [{ tenant_id: 'tenant-a', actions: ['metadata.read'] }],
  next_after: null,
};
function reader(fetch: typeof globalThis.fetch) {
  const browser = createBrowserApi({ origin: 'https://fleet.invalid', fetch });
  lifetimes.push(browser);
  return createOperatorTenantReader(browser);
}
const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
  });

test('uses the shared generated client with bounded params and no credentials in JavaScript', async () => {
  const service = reader(async (url, init) => {
    const target = new URL(String(url));
    expect(target.pathname).toBe('/api/v1/me/tenants');
    expect(target.searchParams.get('limit')).toBe('50');
    expect(target.searchParams.get('after')).toBe('old-cursor');
    expect(init?.credentials).toBe('same-origin');
    expect(init?.cache).toBe('no-store');
    expect(new Headers(init?.headers).has('authorization')).toBe(false);
    return json(payload);
  });
  await expect(
    service.list({ limit: 50, after: 'old-cursor' }),
  ).resolves.toEqual({
    tenants: [{ id: 'tenant-a', actions: ['metadata.read'] }],
    nextAfter: null,
  });
});

test.each([4, 5, 9])(
  'accepts complete %i-grant discovery without dropping advertised actions',
  async (count) => {
    const actions = completeActions.slice(0, count);
    await expect(
      reader(async () =>
        json({
          tenants: [{ tenant_id: 'tenant-a', actions }],
          next_after: null,
        }),
      ).list({ limit: 50 }),
    ).resolves.toEqual({
      tenants: [{ id: 'tenant-a', actions }],
      nextAfter: null,
    });
  },
);

test.each([400, 401, 500])(
  'keeps HTTP %s as a structured failure',
  async (status) => {
    const kind =
      status === 400
        ? 'invalid-request'
        : status === 401
          ? 'unauthorized'
          : 'unavailable';
    await expect(
      reader(async () => new Response('untrusted', { status })).list({
        limit: 50,
      }),
    ).rejects.toMatchObject({ kind });
  },
);

test.each([
  {
    tenants: [{ tenant_id: '', actions: ['metadata.read'] }],
    next_after: null,
  },
  {
    tenants: [{ tenant_id: ' bad', actions: ['metadata.read'] }],
    next_after: null,
  },
  { tenants: [{ tenant_id: 'a', actions: [] }], next_after: null },
  { tenants: [{ tenant_id: 'a', actions: ['unknown'] }], next_after: null },
  {
    tenants: [{ tenant_id: 'a', actions: ['metadata.read', 'metadata.read'] }],
    next_after: null,
  },
  {
    tenants: [
      { tenant_id: 'a', actions: [...completeActions, 'metadata.read'] },
    ],
    next_after: null,
  },
  { tenants: [payload.tenants[0], payload.tenants[0]], next_after: null },
  { tenants: [], next_after: 'invented' },
  { ...payload, next_after: 'different' },
  { ...payload, next_after: ' tenant-a' },
  { tenants: 'invalid', next_after: null },
])('rejects malformed grants and unusable cursors', async (body) => {
  await expect(
    reader(async () => json(body)).list({ limit: 50 }),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
});

test('rejects repeated request identity and pages exceeding the requested limit', async () => {
  await expect(
    reader(async () => json(payload)).list({ limit: 50, after: 'tenant-a' }),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
  await expect(
    reader(async () =>
      json({
        tenants: [
          ...payload.tenants,
          { tenant_id: 'b', actions: ['access.manage'] },
        ],
        next_after: null,
      }),
    ).list({ limit: 1 }),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
});
test('does not guess database collation and accepts a valid next cursor', async () => {
  await expect(
    reader(async () => json({ ...payload, next_after: 'tenant-a' })).list({
      limit: 50,
      after: 'z',
    }),
  ).resolves.toMatchObject({ nextAfter: 'tenant-a' });
});
test.each([
  { limit: 0 },
  { limit: 101 },
  { limit: 1.5 },
  { limit: 1, after: ' ' },
])('rejects invalid requests before transport', async (request) => {
  let calls = 0;
  await expect(
    reader(async () => {
      calls++;
      return json(payload);
    }).list(request),
  ).rejects.toMatchObject({ kind: 'invalid-request' });
  expect(calls).toBe(0);
});

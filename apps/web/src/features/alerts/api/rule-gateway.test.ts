import { afterEach, expect, test, vi } from 'vitest';
import { type BrowserApi, createBrowserApi } from '#shared/api';
import { type RuleCommand, threshold } from '../model/alert-rules';
import { createRuleGateway } from './rule-gateway';
import { detail } from './tests/alert-fixture';

const scope = { tenant: 'tenant-a', rule: 'voltage-high' },
  head = {
    latest_revision: 1,
    activation: {
      generation: 0,
      revision: null,
      actor_id: null,
      recorded_at_ms: null,
    },
  },
  owned: BrowserApi[] = [];
afterEach(async () => {
  await Promise.all(owned.splice(0).map((a) => a.dispose()));
});
function setup(body: unknown, status = 200) {
  const fetch = vi.fn<typeof globalThis.fetch>(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: {
          'content-type':
            status === 200 ? 'application/json' : 'application/problem+json',
        },
      }),
  );
  const api = createBrowserApi({ origin: 'https://fleet.example', fetch });
  owned.push(api);
  return { gateway: createRuleGateway(api), fetch };
}
test('reads exact retained configuration and rejects impossible activation attribution or unsafe clocks', async () => {
  await expect(setup(head).gateway.head(scope)).resolves.toEqual(head);
  const revision = {
    revision: 1,
    definition: detail.definition,
    actor_id: 'operator-a',
    recorded_at_ms: 2000,
  };
  await expect(
    setup(revision).gateway.revision({ ...scope, revision: 1 }),
  ).resolves.toEqual(revision);
  for (const body of [
    { ...head, activation: { ...head.activation, generation: 1 } },
    {
      ...head,
      activation: {
        generation: 1,
        revision: 2,
        actor_id: 'operator-a',
        recorded_at_ms: 1,
      },
    },
    { ...head, activation: { ...head.activation, actor_id: 'operator-a' } },
  ])
    await expect(setup(body).gateway.head(scope)).rejects.toMatchObject({
      kind: 'invalid-response',
    });
  await expect(
    setup({ ...revision, recorded_at_ms: 9007199254740992 }).gateway.revision({
      ...scope,
      revision: 1,
    }),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
  await expect(
    setup({ ...revision, revision: 2 }).gateway.revision({
      ...scope,
      revision: 1,
    }),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
});
test('commands carry exact immutable payload and CSRF through same-origin transport, without actor or authority invention', async () => {
  const { gateway, fetch } = setup({ revision: 1 });
  await gateway.command({
    ...scope,
    kind: 'append',
    revision: 1,
    definition: {
      ...detail.definition,
      threshold: '12345678901234567890.1234567890123456789',
    },
  });
  const [url, init] = fetch.mock.calls[0] ?? [];
  expect(String(url)).toBe(
    'https://fleet.example/api/v1/tenants/tenant-a/alert-rules/voltage-high/revisions/1',
  );
  expect(init?.method).toBe('PUT');
  expect(JSON.parse(String(init?.body))).toEqual({
    ...detail.definition,
    threshold: '12345678901234567890.1234567890123456789',
  });
  expect(new Headers(init?.headers).get('x-fleetiq-csrf')).toBe('1');
  expect(new Headers(init?.headers).has('authorization')).toBe(false);
  expect(init?.credentials).toBe('same-origin');
  const a = setup({
    generation: 3,
    revision: null,
    actor_id: 'operator-a',
    recorded_at_ms: 3,
  });
  await a.gateway.command({
    ...scope,
    kind: 'activate',
    expected_generation: 2,
    revision: null,
  });
  expect(JSON.parse(String(a.fetch.mock.calls[0]?.[1]?.body))).toEqual({
    expected_generation: 2,
    revision: null,
  });
  await expect(
    setup({
      generation: 5,
      revision: 1,
      actor_id: 'operator-a',
      recorded_at_ms: 5,
    }).gateway.command({
      ...scope,
      kind: 'activate',
      expected_generation: 2,
      revision: 1,
    }),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
});
test('validates finite exact decimals and bounded commands before any network request', async () => {
  for (const s of [
    '0',
    '-0',
    '.5',
    '1e127',
    '1e-64',
    '100e-66',
    '12345678901234567890.1234567890123456789',
  ])
    expect(threshold(s), s).toBe(true);
  for (const s of ['NaN', 'Infinity', '1e128', '1e-65', ' 1', '1'.repeat(257)])
    expect(threshold(s), s).toBe(false);
  const { gateway, fetch } = setup({});
  for (const r of [
    { ...scope, kind: 'append', revision: 0, definition: detail.definition },
    {
      ...scope,
      kind: 'append',
      revision: 1,
      definition: { ...detail.definition, threshold: '1e128' },
    },
    { ...scope, kind: 'activate', revision: 1, expected_generation: -1 },
    {
      ...scope,
      rule: '..',
      kind: 'activate',
      revision: null,
      expected_generation: 0,
    },
  ] as RuleCommand[])
    await expect(gateway.command(r)).rejects.toMatchObject({
      kind: 'invalid-request',
    });
  expect(fetch).not.toHaveBeenCalled();
});
test('retains denied, conflict and ambiguous failures as distinct categories', async () => {
  for (const [status, kind] of [
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [409, 'conflict'],
    [500, 'unavailable'],
  ] as const)
    await expect(
      setup(
        { type: 'about:blank', title: 'Failure', status },
        status,
      ).gateway.command({
        ...scope,
        kind: 'activate',
        revision: 1,
        expected_generation: 0,
      }),
    ).rejects.toMatchObject({ kind });
});

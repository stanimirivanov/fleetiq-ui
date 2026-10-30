import { afterEach, expect, test, vi } from 'vitest';
import { type BrowserApi, createBrowserApi } from '#shared/api';
import {
  createAcknowledgementWriter,
  parseAcknowledgement,
} from './acknowledgement-writer';
import { parseDetail, parseHistory } from './parse-alerts';
import {
  detail,
  detailRequest,
  detailWire,
  historyWire,
} from './tests/alert-fixture';

const request = {
    tenant: 'tenant-a',
    rule: 'voltage-high',
    revision: 1,
    expected_version: '2',
    actor: 'operator-a',
  },
  receipt = {
    version: '2',
    actor_id: 'operator-a',
    recorded_at_ms: '9007199254740993',
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
  return { write: createAcknowledgementWriter(api), fetch };
}
test('writes one observed lifecycle version with CSRF and validates exact actor/time attribution', async () => {
  const { write, fetch } = setup(receipt);
  await expect(write(request)).resolves.toEqual(receipt);
  const [url, init] = fetch.mock.calls[0] ?? [];
  expect(String(url)).toBe(
    'https://fleet.example/api/v1/tenants/tenant-a/alerts/voltage-high/revisions/1/acknowledgement',
  );
  expect(init?.method).toBe('PUT');
  expect(JSON.parse(String(init?.body))).toEqual({ expected_version: '2' });
  expect(new Headers(init?.headers).get('x-fleetiq-csrf')).toBe('1');
  expect(new Headers(init?.headers).has('authorization')).toBe(false);
  for (const r of [
    { ...receipt, version: '3' },
    { ...receipt, actor_id: 'operator-b' },
    { ...receipt, recorded_at_ms: '9223372036854775808' },
    { ...receipt, recorded_at_ms: '-0' },
  ])
    expect(() => parseAcknowledgement(r, '2', 'operator-a')).toThrow(
      'response is invalid',
    );
});
test('validates optional read annotations against each exact transition without changing immutable phase/evidence', () => {
  const wire = {
    ...detailWire,
    alert: {
      ...detailWire.alert,
      latest_transition: {
        ...detailWire.alert.latest_transition,
        acknowledgement: receipt,
      },
    },
  };
  expect(
    parseDetail(wire, detailRequest).alert.latest_transition,
  ).toMatchObject({
    ...detail.alert.latest_transition,
    acknowledgement: receipt,
  });
  expect(() =>
    parseDetail(
      {
        ...wire,
        alert: {
          ...wire.alert,
          latest_transition: {
            ...wire.alert.latest_transition,
            acknowledgement: { ...receipt, version: '3' },
          },
        },
      },
      detailRequest,
    ),
  ).toThrow('response is invalid');
  expect(() =>
    parseHistory(
      {
        ...historyWire,
        transitions: [
          {
            ...detail.alert.latest_transition,
            acknowledgement: { ...receipt, actor_id: '\ud800' },
          },
        ],
      },
      { ...detailRequest, detail },
    ),
  ).toThrow('response is invalid');
});
test('rejects invalid command identity before execution and preserves conflict/denial categories', async () => {
  const { write, fetch } = setup(receipt);
  for (const r of [
    { ...request, expected_version: '0' },
    { ...request, expected_version: '9223372036854775808' },
    { ...request, revision: 0 },
    { ...request, tenant: '..' },
    { ...request, actor: '\ud800' },
  ])
    await expect(write(r)).rejects.toMatchObject({ kind: 'invalid-request' });
  expect(fetch).not.toHaveBeenCalled();
  for (const [status, kind] of [
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [409, 'conflict'],
    [500, 'unavailable'],
  ] as const)
    await expect(
      setup({ type: 'about:blank', title: 'Failure', status }, status).write(
        request,
      ),
    ).rejects.toMatchObject({ kind });
});

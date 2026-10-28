import { expect, test } from 'vitest';
import contract from '../../../../../../contracts/http/fleetiq-v1-ui-baseline.openapi.json';
import { applyPropertyEvent } from '../model/property-live';
import { parsePropertyLive } from './parse-property-live';
import { request, wireCurrent } from './tests/evidence-fixture';

const id = (n: string) => `v1.${'a'.repeat(64)}.1.${n}`;
const snapshot = () =>
  parsePropertyLive(
    { event: 'snapshot', id: id('9'), data: JSON.stringify(wireCurrent()) },
    request,
  );
test('live envelopes retain exact provenance and coalesced replacements', () => {
  const initial = applyPropertyEvent(null, snapshot());
  const next = parsePropertyLive(
    {
      event: 'replace',
      id: id('20'),
      data: JSON.stringify({
        base_revision: '9',
        snapshot: { ...wireCurrent(), revision: '20' },
      }),
    },
    request,
  );
  const held = applyPropertyEvent(initial, next);
  expect(held?.snapshot.item?.change.value).toEqual(
    initial?.snapshot.item?.change.value,
  );
  expect(held?.cursor).toBe(id('20'));
  expect(applyPropertyEvent(held, next)).toBe(held);
});
test('gaps, reset snapshots and wrong heartbeat positions require resnapshot', () => {
  const initial = applyPropertyEvent(null, snapshot());
  expect(
    applyPropertyEvent(initial, {
      kind: 'replace',
      id: id('20'),
      base: '8',
      snapshot: { ...wireCurrentModel(), revision: '20' },
    }),
  ).toBeNull();
  expect(
    applyPropertyEvent(initial, {
      kind: 'heartbeat',
      generation: '2',
      revision: '9',
      evaluatedAt: '40000',
      pending: false,
    }),
  ).toBeNull();
  expect(
    applyPropertyEvent(initial, {
      kind: 'snapshot',
      id: id('10'),
      snapshot: { ...wireCurrentModel(), revision: '10' },
    }),
  ).toBeNull();
});
function wireCurrentModel() {
  const event = snapshot();
  if (event.kind !== 'snapshot') throw new Error('fixture');
  return event.snapshot;
}
test('heartbeat re-evaluates age and pending without changing quality or cursor', () => {
  const initial = applyPropertyEvent(null, snapshot());
  const next = applyPropertyEvent(initial, {
    kind: 'heartbeat',
    generation: '1',
    revision: '9',
    evaluatedAt: '40000',
    pending: true,
  });
  expect(next?.snapshot.item?.freshness).toBe('stale');
  expect(next?.snapshot.item?.change.quality).toBe(
    initial?.snapshot.item?.change.quality,
  );
  expect(next?.cursor).toBe(id('9'));
  expect(next?.snapshot.pending).toBe(true);
});
test.each([
  { event: 'snapshot', id: id('10'), data: JSON.stringify(wireCurrent()) },
  {
    event: 'snapshot',
    id: id('9'),
    data: JSON.stringify({
      ...wireCurrent(),
      items: [
        {
          ...wireCurrent().items[0],
          change: { ...wireCurrent().items[0]?.change, tenant_id: 'other' },
        },
      ],
    }),
  },
  { event: 'heartbeat', id: id('9'), data: '{}' },
  {
    event: 'heartbeat',
    data: '{"generation":"9223372036854775808","revision":"9","pending":false,"evaluated_at_ms":"2000"}',
  },
  { event: 'stream-ended', data: '{"reason":"invented"}' },
  { event: 'unknown', data: '{}' },
])('invalid live payload fails closed %#', (frame) => {
  expect(() => parsePropertyLive(frame, request)).toThrow();
});
test('terminal vocabularies stay aligned with the backend-pinned contract', () => {
  for (const name of ['PropertyLiveEnd', 'PropertyLiveRecovery'] as const) {
    const schema = contract.components.schemas[name];
    for (const reason of schema.properties.reason.enum) {
      const kind =
        name === 'PropertyLiveEnd' ? 'stream-ended' : 'resnapshot-required';
      expect(
        parsePropertyLive(
          { event: kind, data: JSON.stringify({ reason }) },
          request,
        ),
      ).toEqual({ kind, reason });
    }
  }
});

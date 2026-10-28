import { expect, test, vi } from 'vitest';
import { RequestFailure } from '#shared/model';
import type {
  PropertyLiveEvent,
  SubscribeProperty,
} from '../model/property-live';
import { parsePropertyLive } from './parse-property-live';
import {
  type PropertyLiveState,
  runPropertyLive,
} from './property-live-session';
import { request, wireCurrent } from './tests/evidence-fixture';

const id = `v1.${'a'.repeat(64)}.1.9`;
const snapshot = (): PropertyLiveEvent =>
  parsePropertyLive(
    { event: 'snapshot', id, data: JSON.stringify(wireCurrent()) },
    request,
  );
const wait = async () => {};
test('lease reconnect uses the last applied cursor and resnapshot discards it', async () => {
  const cursors: (string | undefined)[] = [],
    states: PropertyLiveState[] = [];
  const subscribe: SubscribeProperty = async (_q, receive, options) => {
    cursors.push(options.cursor);
    if (cursors.length === 1) {
      receive(snapshot());
      receive({ kind: 'stream-ended', reason: 'lease_expired' });
    } else if (cursors.length === 2)
      receive({ kind: 'resnapshot-required', reason: 'projection_reset' });
    else {
      receive(snapshot());
      receive({ kind: 'stream-ended', reason: 'access_denied' });
    }
  };
  await runPropertyLive(
    subscribe,
    request,
    new AbortController().signal,
    (s) => states.push(s),
    wait,
  );
  expect(cursors).toEqual([undefined, id, undefined]);
  expect(states.at(-1)).toEqual({
    kind: 'stopped',
    failure: 'forbidden',
    snapshot: null,
  });
});
test.each([
  'authentication_required',
  'access_denied',
  'scope_missing',
  'payload_limit',
] as const)('terminal %s never retries and clears evidence', async (reason) => {
  const subscribe = vi.fn<SubscribeProperty>(async (_q, receive) => {
    receive(snapshot());
    receive({ kind: 'stream-ended', reason });
  });
  const states: PropertyLiveState[] = [];
  await runPropertyLive(
    subscribe,
    request,
    new AbortController().signal,
    (s) => states.push(s),
    wait,
  );
  expect(subscribe).toHaveBeenCalledTimes(1);
  expect(states.at(-1)?.snapshot).toBeNull();
});
test('transport failure has a finite retry budget and manual recovery state', async () => {
  const subscribe = vi.fn<SubscribeProperty>(async () => {
    throw new RequestFailure('unavailable');
  });
  const states: PropertyLiveState[] = [];
  await runPropertyLive(
    subscribe,
    request,
    new AbortController().signal,
    (s) => states.push(s),
    wait,
  );
  expect(subscribe).toHaveBeenCalledTimes(6);
  expect(states.at(-1)?.kind).toBe('stopped');
});
test('mismatched replacement base requests a new baseline without its cursor', async () => {
  let calls = 0;
  const cursors: (string | undefined)[] = [];
  const subscribe: SubscribeProperty = async (_q, receive, options) => {
    cursors.push(options.cursor);
    calls++;
    if (calls === 1) {
      const event = snapshot();
      receive(event);
      if (event.kind === 'snapshot')
        receive({
          kind: 'replace',
          id: `${id.slice(0, -1)}10`,
          base: '0',
          snapshot: { ...event.snapshot, revision: '10' },
        });
    } else receive({ kind: 'stream-ended', reason: 'payload_limit' });
  };
  await runPropertyLive(
    subscribe,
    request,
    new AbortController().signal,
    () => {},
    wait,
  );
  expect(cursors).toEqual([undefined, undefined]);
});
test('cancellation suppresses late events and prevents reconnect', async () => {
  const controller = new AbortController(),
    states: PropertyLiveState[] = [];
  const subscribe = vi.fn<SubscribeProperty>(async (_q, receive) => {
    controller.abort();
    receive(snapshot());
  });
  await runPropertyLive(
    subscribe,
    request,
    controller.signal,
    (s) => states.push(s),
    wait,
  );
  expect(states.map((s) => s.kind)).toEqual(['connecting']);
  expect(subscribe).toHaveBeenCalledTimes(1);
});

import { afterEach, expect, test } from 'vitest';
import { type BrowserApi, createBrowserApi } from '#shared/api';
import type { PropertyLiveEvent } from '../model/property-live';
import { propertySubscription } from './property-subscription';
import { request, wireCurrent } from './tests/evidence-fixture';

const owned: BrowserApi[] = [];
afterEach(async () => {
  await Promise.all(owned.splice(0).map((a) => a.dispose()));
});
const id = `v1.${'a'.repeat(64)}.1.9`;
function setup(wire: string) {
  let cancelled = false;
  const api = createBrowserApi({
    origin: 'https://fleet.example',
    fetch: async () =>
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(new TextEncoder().encode(wire));
          },
          cancel() {
            cancelled = true;
          },
        }),
        { headers: { 'content-type': 'text/event-stream' } },
      ),
  });
  owned.push(api);
  return { subscribe: propertySubscription(api), cancelled: () => cancelled };
}
test('real managed adapter applies a validated snapshot and closes at terminal before later bytes', async () => {
  const fixture = setup(
    `data: ${JSON.stringify(wireCurrent())}\nid: ${id}\nevent: snapshot\n\nevent: stream-ended\ndata: {"reason":"lease_expired"}\n\nevent: snapshot\nid: poison\ndata: {}\n\n`,
  );
  const events: PropertyLiveEvent[] = [];
  await fixture.subscribe(request, (e) => events.push(e), {
    signal: new AbortController().signal,
  });
  expect(events.map((e) => e.kind)).toEqual(['snapshot', 'stream-ended']);
  expect(fixture.cancelled()).toBe(true);
});
test('real managed adapter rejects a malformed snapshot before delivery and cancels the source', async () => {
  const fixture = setup('event: snapshot\nid: invalid\ndata: {}\n\n');
  const events: PropertyLiveEvent[] = [];
  await expect(
    fixture.subscribe(request, (e) => events.push(e), {
      signal: new AbortController().signal,
    }),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
  expect(events).toEqual([]);
  expect(fixture.cancelled()).toBe(true);
});

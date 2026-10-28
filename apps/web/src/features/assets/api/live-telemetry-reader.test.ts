import { afterEach, expect, test, vi } from 'vitest';
import { type BrowserApi, createBrowserApi } from '#shared/api';
import { createTelemetryReader } from './live-telemetry-reader';
import { request, wireChange, wireCurrent } from './tests/evidence-fixture';

const owned: BrowserApi[] = [];
afterEach(async () => {
  await Promise.all(owned.splice(0).map((x) => x.dispose()));
});
function setup(body: unknown, status = 200) {
  const fetch = vi.fn<typeof globalThis.fetch>(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
  );
  const api = createBrowserApi({ origin: 'https://fleet.example', fetch });
  owned.push(api);
  return { reader: createTelemetryReader(api), fetch };
}
test('uses the managed same-origin session for current/history/exact reads', async () => {
  let s = setup(wireCurrent());
  expect((await s.reader.current(request)).revision).toBe('9');
  expect(String(s.fetch.mock.calls[0]?.[0])).toContain(
    '/electrical.voltage/versions/1/current',
  );
  s = setup({ changes: [wireChange()], next_after: null });
  await s.reader.history({
    ...request,
    start: '0',
    end: '3000',
    limit: 50,
    after: 'v1.aa',
  });
  expect(String(s.fetch.mock.calls[0]?.[0])).toContain('start_at_ms=0');
  expect(String(s.fetch.mock.calls[0]?.[0])).toContain('after=v1.aa');
  s = setup(wireChange());
  expect(
    (
      await s.reader.interpretation({
        ...request,
        interpretation: wireChange().interpretation,
      })
    ).bindingId,
  ).toBe('binding-1');
});
test('preserves denied and invalid categories and does not request invalid contexts', async () => {
  const denied = setup({}, 403);
  await expect(denied.reader.current(request)).rejects.toMatchObject({
    kind: 'forbidden',
  });
  const s = setup(wireChange());
  await expect(
    s.reader.interpretation({ ...request, interpretation: 'v1.aa' }),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
  await expect(
    s.reader.interpretation({ ...request, interpretation: 'bad' }),
  ).rejects.toMatchObject({ kind: 'invalid-request' });
  const before = s.fetch.mock.calls.length;
  await expect(
    s.reader.history({ ...request, start: '0', end: '0', limit: 50 }),
  ).rejects.toMatchObject({ kind: 'invalid-request' });
  expect(s.fetch).toHaveBeenCalledTimes(before);
});
test('aborted requests never start a transport operation', async () => {
  const s = setup(wireCurrent()),
    controller = new AbortController();
  controller.abort();
  await expect(
    s.reader.current(request, { signal: controller.signal }),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(s.fetch).not.toHaveBeenCalled();
});

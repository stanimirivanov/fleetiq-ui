import { expect, test, vi } from 'vitest';
import { consumeSse, SseDecoder, type SseEvent } from './sse';

const bytes = (s: string) => new TextEncoder().encode(s);
test('SSE parses fragmented UTF8, CRLF, multiline data and field order without inherited ids', () => {
  const decoder = new SseDecoder(),
    events: SseEvent[] = [];
  for (const byte of bytes(
    ': keepalive\r\nevent: snapshot\r\ndata: {"value":"é"}\r\nid: opaque\r\n\r\nevent: heartbeat\ndata: first\ndata: second\n\n',
  ))
    decoder.push(Uint8Array.of(byte), (e) => events.push(e));
  expect(events).toEqual([
    { event: 'snapshot', id: 'opaque', data: '{"value":"é"}' },
    { event: 'heartbeat', data: 'first\nsecond' },
  ]);
});
test('SSE never dispatches incomplete frames', () => {
  const decoder = new SseDecoder(),
    events: SseEvent[] = [];
  decoder.push(bytes('event: snapshot\ndata: {}\n'), (e) => events.push(e));
  expect(events).toEqual([]);
});
test.each([`data: ${'x'.repeat(65536)}`, 'id: a\nid: b\n\n', 'id: x\0\n\n'])(
  'SSE rejects oversized or ambiguous frame %#',
  (wire) => {
    expect(() => new SseDecoder().push(bytes(wire), () => {})).toThrow();
  },
);
test('SSE rejects invalid UTF8 and excessive chunks', () => {
  expect(() => new SseDecoder().push(Uint8Array.of(255), () => {})).toThrow();
  expect(() =>
    new SseDecoder().push(new Uint8Array(1048577), () => {}),
  ).toThrow();
});
test('aborting a pending SSE reader cancels its source', async () => {
  const controller = new AbortController();
  let cancelled = false;
  const response = new Response(
    new ReadableStream({
      cancel() {
        cancelled = true;
      },
    }),
    { headers: { 'content-type': 'text/event-stream' } },
  );
  const run = consumeSse(response, controller.signal, () => {});
  controller.abort();
  await expect(run).rejects.toThrow();
  expect(cancelled).toBe(true);
});
test('SSE validates media type and releases an ordinary completed body', async () => {
  await expect(
    consumeSse(
      new Response('data: {}\n\n'),
      new AbortController().signal,
      () => {},
    ),
  ).rejects.toThrow();
  const events: SseEvent[] = [];
  await consumeSse(
    new Response('event: snapshot\ndata: {}\n\n', {
      headers: { 'content-type': 'text/event-stream; charset=utf-8' },
    }),
    new AbortController().signal,
    (e) => events.push(e),
  );
  expect(events).toHaveLength(1);
});

test('idle SSE body has a fixed deadline and cancels its source', async () => {
  vi.useFakeTimers();
  let cancelled = false;
  try {
    const response = new Response(
      new ReadableStream({
        cancel() {
          cancelled = true;
        },
      }),
      { headers: { 'content-type': 'text/event-stream' } },
    );
    const run = consumeSse(response, new AbortController().signal, () => {});
    const rejected = expect(run).rejects.toMatchObject({ kind: 'unavailable' });
    await vi.advanceTimersByTimeAsync(25000);
    await rejected;
    expect(cancelled).toBe(true);
  } finally {
    vi.useRealTimers();
  }
});

test('CR-only delimiters terminate frames at EOF and count actual wire bytes', async () => {
  const events: SseEvent[] = [];
  await consumeSse(
    new Response('event: heartbeat\rdata: {}\r\r', {
      headers: { 'content-type': 'text/event-stream' },
    }),
    new AbortController().signal,
    (event) => events.push(event),
  );
  expect(events).toEqual([{ event: 'heartbeat', data: '{}' }]);
  expect(() =>
    new SseDecoder().push(
      new TextEncoder().encode(':x\r\n'.repeat(18000)),
      () => {},
    ),
  ).toThrow();
});

import { Effect } from 'effect';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { RequestFailure } from '#shared/model';
import { type BrowserApi, createBrowserApi } from './browser-api';

const owned: BrowserApi[] = [];
function api(fetch: typeof globalThis.fetch, timeoutMs?: number): BrowserApi {
  const instance = createBrowserApi({
    origin: 'https://fleet.example',
    fetch,
    timeoutMs,
  });
  owned.push(instance);
  return instance;
}
afterEach(async () => {
  await Promise.all(owned.splice(0).map((instance) => instance.dispose()));
});
const page = { assets: [], next_after: null };
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('managed browser API', () => {
  test('uses the real generated client with encoded paths and cookie-only fetch', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json(page));
    const instance = api(fetch);
    await instance.run((client) =>
      client.listAssets('tenant /?#', {
        params: { limit: 7, after: 'cursor /?#' },
      }),
    );
    const [input, options] = fetch.mock.calls[0] ?? [];
    const url = new URL(String(input));
    expect(url.origin).toBe('https://fleet.example');
    expect(url.pathname).toBe('/api/v1/tenants/tenant%20%2F%3F%23/assets');
    expect(url.searchParams.get('after')).toBe('cursor /?#');
    expect(options).toMatchObject({
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
    });
    expect(new Headers(options?.headers).has('authorization')).toBe(false);
  });

  test('lets the browser supply Origin for the generated logout operation', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () => new Response(null, { status: 204 }),
    );
    const instance = api(fetch);
    await instance.run((client) =>
      client.endOperatorSession({
        params: { Origin: instance.origin, 'X-FleetIQ-CSRF': '1' },
      }),
    );
    const headers = new Headers(fetch.mock.calls[0]?.[1]?.headers);
    expect(headers.get('x-fleetiq-csrf')).toBe('1');
    expect(headers.has('origin')).toBe(false);
  });

  test.each([204, 205])(
    'preserves browser no-content status %s with a non-null empty stream',
    async (status) => {
      const response = new Response(null, { status });
      // Native fetch can expose an empty stream for no-content responses even
      // though constructing Response with a body and these statuses is forbidden.
      Object.defineProperty(response, 'body', {
        value: new ReadableStream<Uint8Array>({
          start(controller) {
            controller.close();
          },
        }),
      });
      const instance = api(async () => response);
      if (status === 204) {
        await expect(
          instance.run((client) =>
            client.endOperatorSession({
              params: { Origin: instance.origin, 'X-FleetIQ-CSRF': '1' },
            }),
          ),
        ).resolves.toBeUndefined();
      } else {
        await expect(
          instance.run((client) =>
            client.httpClient
              .get('/api/v1/auth/session')
              .pipe(Effect.map((result) => result.status)),
          ),
        ).resolves.toBe(205);
      }
    },
  );
  test.each([
    [400, 'invalid-request'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [409, 'conflict'],
    [500, 'unavailable'],
  ] as const)(
    'classifies status %s before untrusted error body decoding',
    async (status, kind) => {
      const instance = api(
        async () =>
          new Response('<html>private-upstream-detail</html>', { status }),
      );
      const failure = await instance
        .run((client) => client.getOperatorSession(undefined))
        .catch((cause: unknown) => cause);
      expect(failure).toBeInstanceOf(RequestFailure);
      expect(failure).toMatchObject({ kind });
      expect(String(failure)).not.toContain('private-upstream-detail');
    },
  );

  test('rejects malformed success JSON without exposing schema input', async () => {
    const instance = api(async () =>
      json({ assets: [{ password: 'private-secret' }], next_after: null }),
    );
    const failure = await instance
      .run((client) => client.listAssets('tenant-a', undefined))
      .catch((cause: unknown) => cause);
    expect(failure).toMatchObject({ kind: 'invalid-response' });
    expect(String(failure)).not.toContain('private-secret');
  });

  test('refuses cross-origin requests and explicit authorization before fetch', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json(page));
    const instance = api(fetch);
    await expect(
      instance.run((client) =>
        client.httpClient.get('https://other.example/api/v1'),
      ),
    ).rejects.toMatchObject({ kind: 'invalid-request' });
    await expect(
      instance.run((client) =>
        client.httpClient.get('/api/v1', {
          headers: { authorization: 'Bearer private-secret' },
        }),
      ),
    ).rejects.toMatchObject({ kind: 'invalid-request' });
    expect(fetch).not.toHaveBeenCalled();
  });

  test('rejects redirect responses instead of decoding a login destination', async () => {
    const instance = api(
      async () =>
        new Response(null, {
          status: 303,
          headers: { location: 'https://provider.example/login' },
        }),
    );
    await expect(
      instance.run((client) => client.getOperatorSession(undefined)),
    ).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  test('bounds successful response bodies even without Content-Length', async () => {
    const instance = api(
      async () => new Response('x'.repeat(2 * 1024 * 1024 + 1)),
    );
    await expect(
      instance.run((client) => client.getOperatorSession(undefined)),
    ).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  test('caller cancellation interrupts the owned HTTP request', async () => {
    let began!: () => void;
    const started = new Promise<void>((resolve) => {
      began = resolve;
    });
    let transportSignal: AbortSignal | null | undefined;
    const instance = api(async (_input, init) => {
      transportSignal = init?.signal;
      began();
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('cancelled', 'AbortError')),
          { once: true },
        );
      });
    });
    const controller = new AbortController();
    const result = instance.run(
      (client) => client.getOperatorSession(undefined),
      { signal: controller.signal },
    );
    const assertion = expect(result).rejects.toMatchObject({
      name: 'AbortError',
    });
    await started;
    controller.abort();
    await assertion;
    expect(transportSignal?.aborted).toBe(true);
  });

  test('disposal interrupts active work and rejects subsequent execution', async () => {
    let began!: () => void;
    const started = new Promise<void>((resolve) => {
      began = resolve;
    });
    let transportSignal: AbortSignal | null | undefined;
    const instance = api(async (_input, init) => {
      transportSignal = init?.signal;
      began();
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('cancelled', 'AbortError')),
          { once: true },
        );
      });
    });
    const pending = instance.run((client) =>
      client.getOperatorSession(undefined),
    );
    const assertion = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await started;
    await instance.dispose();
    await assertion;
    expect(transportSignal?.aborted).toBe(true);
    await expect(instance.run(() => Effect.succeed(1))).rejects.toMatchObject({
      name: 'AbortError',
    });
    await instance.dispose();
  });

  test('deadline failure stays unavailable and interrupts the underlying request', async () => {
    let transportSignal: AbortSignal | null | undefined;
    const instance = api(async (_input, init) => {
      transportSignal = init?.signal;
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('cancelled', 'AbortError')),
          { once: true },
        );
      });
    }, 30);
    await expect(
      instance.run((client) => client.getOperatorSession(undefined)),
    ).rejects.toMatchObject({ kind: 'unavailable' });
    expect(transportSignal?.aborted).toBe(true);
  });
});

test('managed SSE uses same-origin cookies, resumes through a header and disposes its body', async () => {
  let cancelled = false;
  const fetch = vi.fn<typeof globalThis.fetch>(
    async () =>
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(
              new TextEncoder().encode('event: heartbeat\ndata: {}\n\n'),
            );
          },
          cancel() {
            cancelled = true;
          },
        }),
        { headers: { 'content-type': 'text/event-stream' } },
      ),
  );
  const instance = api(fetch),
    controller = new AbortController();
  const run = instance.stream?.('/api/v1/live', () => controller.abort(), {
    signal: controller.signal,
    cursor: 'last-applied',
  });
  await expect(run).rejects.toThrow();
  const headers = new Headers(fetch.mock.calls[0]?.[1]?.headers);
  expect(headers.get('last-event-id')).toBe('last-applied');
  expect(fetch.mock.calls[0]?.[1]?.credentials).toBe('same-origin');
  expect(cancelled).toBe(true);
});
test.each([401, 403, 404, 429, 500])(
  'SSE HTTP %s retains structured failure',
  async (status) => {
    const instance = api(async () => json({}, status));
    await expect(
      instance.stream?.('/api/v1/live', () => {}),
    ).rejects.toBeInstanceOf(RequestFailure);
  },
);
test('SSE rejects URL credentials/query, wrong content and execution after disposal', async () => {
  const instance = api(async () => json({}));
  await expect(
    instance.stream?.('/api/v1/live?token=x', () => {}),
  ).rejects.toMatchObject({ kind: 'invalid-request' });
  await expect(
    instance.stream?.('/api/v1/live', () => {}),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
  await instance.dispose();
  await expect(instance.stream?.('/api/v1/live', () => {})).rejects.toThrow();
});

test('managed SSE completes without a cursor and cancels active work on disposal', async () => {
  const completed = api(
    async () =>
      new Response('event: heartbeat\ndata: {}\n\n', {
        headers: { 'content-type': 'text/event-stream' },
      }),
  );
  const events: string[] = [];
  await completed.stream?.('/api/v1/live', (e) => events.push(e.event));
  expect(events).toEqual(['heartbeat']);
  const aborted = new AbortController();
  aborted.abort();
  await expect(
    completed.stream?.('/api/v1/live', () => {}, { signal: aborted.signal }),
  ).rejects.toThrow();
  let cancelled = false;
  const fetch = vi.fn<typeof globalThis.fetch>(
    async () =>
      new Response(
        new ReadableStream({
          cancel() {
            cancelled = true;
          },
        }),
        { headers: { 'content-type': 'text/event-stream' } },
      ),
  );
  const active = api(fetch),
    started = active.stream?.('/api/v1/live', () => {});
  const rejected = expect(started).rejects.toThrow();
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  await active.dispose();
  await rejected;
  expect(cancelled).toBe(true);
});

import {
  Cause,
  Effect,
  Exit,
  Layer,
  ManagedRuntime,
  Option,
  Schema,
} from 'effect';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientError from 'effect/http/HttpClientError';
import * as HttpClientRequest from 'effect/http/HttpClientRequest';
import { RequestFailure, type RequestFailureKind } from '#shared/model';
import { type FleetIqApi, make } from '../../generated/fleetiq-api';

export interface BrowserApiOptions {
  /** Injection seam for controlled transport tests; production uses window origin. */
  readonly origin?: string;
  readonly fetch?: typeof globalThis.fetch;
  /** Covers transport and response decoding; no retries are implicit. */
  readonly timeoutMs?: number;
}

export interface BrowserApi {
  readonly origin: string;
  run<A, E>(
    operation: (client: FleetIqApi) => Effect.Effect<A, E>,
    options?: { readonly signal?: AbortSignal },
  ): Promise<A>;
  /** Idempotently interrupts owned requests and releases the managed runtime. */
  dispose(): Promise<void>;
}

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

/** One application-owned Effect v4 runtime with same-origin cookie transport. */
export function createBrowserApi(options: BrowserApiOptions = {}): BrowserApi {
  let parsed: URL;
  try {
    parsed = new URL(options.origin ?? globalThis.location.origin);
  } catch {
    throw new RequestFailure('invalid-request');
  }
  if (
    !['https:', 'http:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new RequestFailure('invalid-request');
  }
  const origin = parsed.origin;
  const timeoutMs = options.timeoutMs ?? 10_000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) {
    throw new RequestFailure('invalid-request');
  }
  const nativeFetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  const secureFetch: typeof globalThis.fetch = async (input, init) => {
    const url = new URL(
      input instanceof Request ? input.url : String(input),
      origin,
    );
    const headers = new Headers(init?.headers);
    if (
      url.origin !== origin ||
      url.username ||
      url.password ||
      !(url.pathname === '/api/v1' || url.pathname.startsWith('/api/v1/')) ||
      headers.has('authorization') ||
      headers.has('cookie')
    ) {
      throw new RequestFailure('invalid-request');
    }
    // Origin is a browser-managed forbidden header. The generated logout client
    // requires its contract value, but fetch must let the browser supply it.
    headers.delete('origin');
    const response = await nativeFetch(url, {
      ...init,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
    });
    if (response.redirected) throw new RequestFailure('invalid-response');
    // Native fetch may expose an empty stream for these statuses. Preserve the
    // response: rebuilding it with even an empty byte array violates Response's
    // no-content status invariant and would turn confirmed logout into failure.
    if (response.status === 204 || response.status === 205) return response;
    // Status is classified before error-body decoding, so a broken HTML 401/403
    // cannot erase sign-in or access-denied state with a schema failure.
    if (response.status < 200 || response.status >= 300 || !response.body)
      return response;
    return boundedResponse(response, init?.signal);
  };
  const layer = FetchHttpClient.layer.pipe(
    Layer.provide(Layer.succeed(FetchHttpClient.Fetch, secureFetch)),
  );
  const runtime = ManagedRuntime.make(layer);
  let disposed = false;
  let disposal: Promise<void> | undefined;
  return {
    origin,
    async run<A, E>(
      operation: (client: FleetIqApi) => Effect.Effect<A, E>,
      runOptions?: { readonly signal?: AbortSignal },
    ): Promise<A> {
      if (disposed || runOptions?.signal?.aborted) throw abortError();
      const program = Effect.flatMap(HttpClient.HttpClient, (http) => {
        const client = http.pipe(
          HttpClient.mapRequest((request) =>
            request.pipe(
              HttpClientRequest.removeHeader('origin'),
              HttpClientRequest.prependUrl(origin),
            ),
          ),
          HttpClient.filterStatusOk,
        );
        return Effect.suspend(() => operation(make(client)));
      }).pipe(Effect.scoped, Effect.timeout(timeoutMs));
      const exit = await runtime.runPromiseExit(program, runOptions);
      if (Exit.isSuccess(exit)) return exit.value;
      if (Cause.hasInterruptsOnly(exit.cause)) throw abortError();
      const failure = Cause.findErrorOption(exit.cause);
      throw normalizeRequestFailure(
        Option.isSome(failure) ? failure.value : undefined,
      );
    },
    dispose() {
      disposed = true;
      disposal ??= runtime.dispose();
      return disposal;
    },
  };
}

/** Reduces typed transport failures to categories without retaining input. */
export function normalizeRequestFailure(cause: unknown): RequestFailure {
  if (cause instanceof RequestFailure) return cause;
  if (Schema.isSchemaError(cause))
    return new RequestFailure('invalid-response');
  if (HttpClientError.isHttpClientError(cause)) {
    if (cause.reason._tag === 'StatusCodeError') {
      return new RequestFailure(statusKind(cause.reason.response.status));
    }
    if (cause.reason._tag === 'DecodeError')
      return new RequestFailure('invalid-response');
    if (
      cause.reason._tag === 'InvalidUrlError' ||
      cause.reason._tag === 'EncodeError'
    ) {
      return new RequestFailure('invalid-request');
    }
    if (
      cause.reason._tag === 'TransportError' &&
      cause.reason.cause instanceof RequestFailure
    ) {
      return cause.reason.cause;
    }
  }
  return new RequestFailure('unavailable');
}

function statusKind(status: number): RequestFailureKind {
  switch (status) {
    case 400:
      return 'invalid-request';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not-found';
    case 409:
      return 'conflict';
    default:
      return status >= 500 ? 'unavailable' : 'invalid-response';
  }
}

function abortError(): DOMException {
  return new DOMException('Request cancelled', 'AbortError');
}

async function boundedResponse(
  response: Response,
  signal?: AbortSignal | null,
): Promise<Response> {
  if (
    Number(response.headers.get('content-length') ?? 0) > MAX_RESPONSE_BYTES
  ) {
    void response.body?.cancel().catch(() => undefined);
    throw new RequestFailure('invalid-response');
  }
  const reader = response.body?.getReader();
  if (!reader) return response;
  const cancel = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal?.addEventListener('abort', cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      signal?.throwIfAborted();
      const chunk = await reader.read();
      signal?.throwIfAborted();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > MAX_RESPONSE_BYTES)
        throw new RequestFailure('invalid-response');
      chunks.push(chunk.value);
    }
  } catch (cause) {
    await reader.cancel().catch(() => undefined);
    throw cause;
  } finally {
    signal?.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

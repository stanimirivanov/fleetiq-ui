import { useCallback, useEffect, useRef, useState } from 'react';

export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface ResilientStreamOptions<T> {
  /** Max reconnection attempts. Use Infinity for unlimited. @default Infinity */
  maxRetries?: number;
  /** Delay before first reconnect. @default 1000 */
  baseDelayMs?: number;
  /** Cap on reconnect delay. @default 30000 */
  maxDelayMs?: number;
  /** Add random jitter (50-100% of delay). @default true */
  jitter?: boolean;
  /** Reset backoff to zero after stable connection for this long. @default 10000 */
  resetBackoffAfterMs?: number;
  /** If no message arrives in this window, force a reconnect. @default 35000 */
  heartbeatTimeoutMs?: number;
  /** Reconnect when user returns to the tab. @default true */
  reconnectOnVisible?: boolean;
  /** Reconnect when browser regains network. @default true */
  reconnectOnOnline?: boolean;
  /** Custom retry predicate. Return false to stop retrying this error. */
  shouldRetry?: (error: Error) => boolean;
  /** Called for every successful message. */
  onMessage?: (message: T) => void;
  /** Called when stream first yields data. */
  onConnect?: () => void;
  /** Called when stream drops (before retry). */
  onDisconnect?: (error: Error) => void;
}

interface StreamState<T> {
  state: ConnectionState;
  error: Error | null;
  lastMessage: T | null;
  lastMessageAt: Date | null;
  retryCount: number;
  nextRetryIn: number | null;
}

export function useResilientStream<T>(
  createStream: (signal: AbortSignal) => AsyncIterable<T>,
  options: ResilientStreamOptions<T> = {}
) {
  const {
    maxRetries = Infinity,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    jitter = true,
    resetBackoffAfterMs = 10000,
    heartbeatTimeoutMs = 35000,
    reconnectOnVisible = true,
    reconnectOnOnline = true,
  } = options;

  const [streamState, setStreamState] = useState<StreamState<T>>({
    state: 'idle',
    error: null,
    lastMessage: null,
    lastMessageAt: null,
    retryCount: 0,
    nextRetryIn: null,
  });

  // Use refs for mutable state that must be accessed inside async loops
  // without closing over stale values or triggering effect re-runs.
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectedAtRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const isActiveRef = useRef(false);
  const streamStateRef = useRef(streamState);
  const optionsRef = useRef(options);

  // Keep refs in sync with latest renders
  streamStateRef.current = streamState;
  optionsRef.current = options;

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearTimeout(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  const abortCurrentStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const calculateDelay = useCallback(() => {
    const attempt = retryCountRef.current;
    let delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
    if (jitter) delay *= 0.5 + Math.random() * 0.5; // 50-100% jitter
    return Math.round(delay);
  }, [baseDelayMs, maxDelayMs, jitter]);

  const updateState = useCallback((partial: Partial<StreamState<T>>) => {
    if (!isMountedRef.current) return;
    setStreamState(prev => ({ ...prev, ...partial }));
  }, []);

  const resetHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) clearTimeout(heartbeatTimerRef.current);
    heartbeatTimerRef.current = setTimeout(() => {
      // No data received within heartbeat window — connection may be zombie
      abortCurrentStream();
      // connect() will be invoked by the catch block when the in-flight iterator throws
    }, heartbeatTimeoutMs);
  }, [heartbeatTimeoutMs, abortCurrentStream]);

  const connect = useCallback(async () => {
    if (!isMountedRef.current || !isActiveRef.current) return;

    clearTimers();
    abortCurrentStream();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const isReconnect = retryCountRef.current > 0;
    updateState({
      state: isReconnect ? 'reconnecting' : 'connecting',
      error: null,
      nextRetryIn: null,
    });

    try {
      const stream = createStream(abortController.signal);
      let didYield = false;

      for await (const message of stream) {
        if (!isMountedRef.current || !isActiveRef.current) break;

        const now = Date.now();

        // Reset backoff if we've been stable long enough
        if (connectedAtRef.current && now - connectedAtRef.current > resetBackoffAfterMs) {
          retryCountRef.current = 0;
        }

        if (!connectedAtRef.current) {
          connectedAtRef.current = now;
          optionsRef.current.onConnect?.();
        }

        didYield = true;
        resetHeartbeat();

        updateState({
          state: 'connected',
          lastMessage: message,
          lastMessageAt: new Date(now),
          retryCount: retryCountRef.current,
          error: null,
        });

        optionsRef.current.onMessage?.(message);
      }

      // Loop exited — stream ended
      if (!isMountedRef.current || !isActiveRef.current) return;

      if (!didYield) {
        throw new Error('Stream closed before any data was received');
      }
      throw new Error('Stream ended unexpectedly');
    } catch (err) {
      if (!isMountedRef.current || !isActiveRef.current) return;

      const error = err instanceof Error ? err : new Error(String(err));

      // Ignore intentional cancellations (unmount, manual disconnect, heartbeat reset)
      const isAbort =
        error.name === 'AbortError' ||
        error.message?.includes('aborted') ||
        error.message?.includes('canceled') ||
        error.message?.includes('This operation was aborted');

      if (isAbort) {
        if (!isActiveRef.current) {
          updateState({ state: 'disconnected' });
        }
        return;
      }

      // Real error — notify and decide whether to retry
      optionsRef.current.onDisconnect?.(error);
      connectedAtRef.current = null;
      clearTimers();

      const shouldRetry = optionsRef.current.shouldRetry?.(error) ?? true;
      const currentRetry = retryCountRef.current;

      if (shouldRetry && currentRetry < maxRetries) {
        const delay = calculateDelay();
        retryCountRef.current = currentRetry + 1;

        updateState({
          state: 'reconnecting',
          error,
          retryCount: currentRetry + 1,
          nextRetryIn: delay,
        });

        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          if (isActiveRef.current) connect();
        }, delay);
      } else {
        updateState({
          state: 'error',
          error:
            currentRetry >= maxRetries
              ? new Error(`Max retries (${maxRetries}) exceeded. ${error.message}`)
              : error,
          retryCount: currentRetry,
          nextRetryIn: null,
        });
      }
    }
  }, [createStream, maxRetries, calculateDelay, clearTimers, abortCurrentStream, updateState, resetBackoffAfterMs, resetHeartbeat]);

  const disconnect = useCallback(() => {
    isActiveRef.current = false;
    clearTimers();
    abortCurrentStream();
    connectedAtRef.current = null;
    retryCountRef.current = 0;
    updateState({
      state: 'disconnected',
      error: null,
      nextRetryIn: null,
      retryCount: 0,
    });
  }, [clearTimers, abortCurrentStream, updateState]);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    isActiveRef.current = true;
    connect();
  }, [connect]);

  // ── Lifecycle: mount / unmount ──
  useEffect(() => {
    isMountedRef.current = true;
    isActiveRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      isActiveRef.current = false;
      clearTimers();
      abortCurrentStream();
    };
  }, [connect, clearTimers, abortCurrentStream]);

  // ── Browser tab visibility ──
  useEffect(() => {
    if (!reconnectOnVisible) return;
    const handler = () => {
      if (document.visibilityState !== 'visible' || !isActiveRef.current) return;
      const s = streamStateRef.current.state;
      if (s === 'disconnected' || s === 'error') {
        retryCountRef.current = 0;
        connect();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [connect, reconnectOnVisible]);

  // ── Browser online / offline ──
  useEffect(() => {
    if (!reconnectOnOnline) return;
    const handler = () => {
      if (!isActiveRef.current) return;
      const s = streamStateRef.current.state;
      if (s === 'disconnected' || s === 'error') {
        retryCountRef.current = 0;
        connect();
      }
    };
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }, [connect, reconnectOnOnline]);

  return {
    ...streamState,
    connect: reconnect,
    disconnect,
    reconnect,
    isConnected: streamState.state === 'connected',
    isConnecting: streamState.state === 'connecting' || streamState.state === 'reconnecting',
    hasError: streamState.state === 'error',
  };
}
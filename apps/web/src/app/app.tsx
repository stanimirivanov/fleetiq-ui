import { useCallback } from 'react';
import {
  mapPositionUpdateToVehicle,
  useFleetStore,
} from '@fleetiq-ui/shared-core';
import { apiClient } from '../api/transport';
import { useResilientStream } from '../hooks/useResilientStream';
import { Code, ConnectError } from '@connectrpc/connect';

export function App() {
  const vehicles = useFleetStore((state) => state.vehicles);
  const updatePosition = useFleetStore((state) => state.updateVehiclePosition);

  // Memoize the stream factory so the hook doesn't restart on every render
  const createFleetStream = useCallback(
    (signal: AbortSignal) =>
      apiClient.watchFleet(
        { vins: ['VIN-VARNA-01', 'VIN-SOFIA-02'], minUpdateIntervalSeconds: 2 },
        { signal }
      ),
    []
  );

  const {
    state,
    error,
    retryCount,
    nextRetryIn,
    isConnected,
    isConnecting,
    hasError,
  } = useResilientStream(createFleetStream, {
    // Optional: fine-tune resilience
    baseDelayMs: 500,
    maxDelayMs: 15000,
    heartbeatTimeoutMs: 8000, // Reconnect if silent for 8s (backend ticks every 2s)
    maxRetries: Infinity,

    // Wire each message into your global store
    onMessage: (response) => {
      const vehicleModel = mapPositionUpdateToVehicle(response);
      updatePosition(vehicleModel);
    },

    onConnect: () => console.log('Fleet stream connected'),
    onDisconnect: (err) => console.warn('Fleet stream lost:', err.message),

    shouldRetry: (err) => {
      if (err instanceof ConnectError) {
        // Don't burn retries on auth failures — those need user action
        if (
          err.code === Code.Unauthenticated ||
          err.code === Code.PermissionDenied
        ) {
          return false;
        }
      }
      return true;
    },
  });

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>FleetIQ Web Operator Console</h1>

      <div
        style={{
          marginBottom: '1rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ margin: 0 }}>Active Vehicles Feed</h2>

        {isConnected && (
          <span style={{ color: '#22c55e', fontWeight: 'bold' }}>● LIVE</span>
        )}
        {isConnecting && (
          <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
            ⟳{' '}
            {state === 'reconnecting'
              ? `RECONNECTING #${retryCount}`
              : 'CONNECTING'}
            {nextRetryIn ? ` (in ${Math.ceil(nextRetryIn / 1000)}s)` : ''}
          </span>
        )}
        {hasError && (
          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
            ● ERROR: {error?.message}
          </span>
        )}
      </div>

      <pre
        style={{
          background: '#1e1e1e',
          color: '#00ff00',
          padding: '1rem',
          borderRadius: '8px',
          overflow: 'auto',
          maxHeight: '600px',
        }}
      >
        {JSON.stringify(vehicles, null, 2)}
      </pre>
    </div>
  );
}

export default App;

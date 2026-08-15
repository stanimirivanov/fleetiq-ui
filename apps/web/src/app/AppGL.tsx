import { useCallback } from 'react';
import {
  mapPositionUpdateToVehicle,
  useFleetStore,
} from '@fleetiq-ui/shared-core';
import { apiClient } from '../api/transport';
import { useResilientStream } from '../hooks/useResilientStream';
import { Code, ConnectError } from '@connectrpc/connect';

// Map & WebGL imports
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// A free dark-themed base map from CARTO
const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE = {
  longitude: 27.9147,
  latitude: 43.2141,
  zoom: 12,
  pitch: 45,
  bearing: 0,
};

export function AppGL() {
  const vehicles = useFleetStore((state) => state.vehicles);
  const updatePosition = useFleetStore((state) => state.updateVehiclePosition);

  // Convert the Zustand Record<string, VehiclePosition> into an array for Deck.gl
  const vehicleArray = Object.values(vehicles);

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
    baseDelayMs: 500,
    maxDelayMs: 15000,
    heartbeatTimeoutMs: 8000,
    maxRetries: Infinity,

    onMessage: (response) => {
      const vehicleModel = mapPositionUpdateToVehicle(response);
      updatePosition(vehicleModel);
    },

    onConnect: () => console.log('Fleet stream connected'),
    onDisconnect: (err) => console.warn('Fleet stream lost:', err.message),

    shouldRetry: (err) => {
      if (err instanceof ConnectError) {
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

  // Define the Deck.gl WebGL layer
  const layers = [
    new ScatterplotLayer({
      id: 'fleet-layer',
      data: vehicleArray,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 6,
      radiusMaxPixels: 100,
      lineWidthMinPixels: 2,
      getPosition: (d) => [d.lng, d.lat],
      getFillColor: (d) => {
        if (d.status === 'MOVING') return [34, 197, 94]; // Tailwind green-500
        if (d.status === 'IDLE') return [245, 158, 11]; // Tailwind amber-500
        return [239, 68, 68]; // Tailwind red-500
      },
      getLineColor: () => [0, 0, 0],
      getRadius: 50,

      // Automatically interpolate movement smoothly between 2-second backend ticks
      transitions: {
        getPosition: 2000,
      },
    }),
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* HUD / Overlay UI */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1,
          background: 'rgba(0,0,0,0.85)',
          padding: '1.5rem',
          borderRadius: '12px',
          color: 'white',
          fontFamily: 'sans-serif',
          minWidth: '320px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
          FleetIQ Map Console
        </h1>

        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#a1a1aa' }}>Network Status</span>
            <span>
              {isConnected && (
                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>
                  ● LIVE
                </span>
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
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#a1a1aa' }}>Active Vehicles</span>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              {vehicleArray.length}
            </span>
          </div>
        </div>
      </div>

      {/* The WebGL Map */}
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        getTooltip={({ object }) =>
          object &&
          `VIN: ${object.id}\nSpeed: ${object.speed} km/h\nStatus: ${object.status}`
        }
      >
        <Map mapStyle={MAP_STYLE} />
      </DeckGL>
    </div>
  );
}

export default AppGL;

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
import { IconLayer, ScatterplotLayer } from '@deck.gl/layers';
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
      apiClient.watchFleet({ minUpdateIntervalSeconds: 2 }, { signal }),
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
    new IconLayer({
      id: 'fleet-icons',
      data: vehicleArray,
      pickable: true,
      // Use a simple white navigation arrow (you can replace with a car.png later)
      iconAtlas:
        'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
      iconMapping: {
        marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
      },
      getIcon: () => 'marker',
      getPosition: (d) => [d.lng, d.lat],
      getSize: 30,
      // Map the heading from your simulator to the icon's rotation
      getAngle: (d) => 360 - d.heading,
      getColor: (d) => {
        if (d.status === 'MOVING') return [34, 197, 94];
        if (d.status === 'IDLE') return [245, 158, 11];
        return [239, 68, 68];
      },
      transitions: {
        getPosition: 2000,
        getAngle: 2000, // The icon will smoothly rotate as the vehicle turns!
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

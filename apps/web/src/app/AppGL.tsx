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
import { IconLayer, PathLayer } from '@deck.gl/layers';
import Map, { Layer } from 'react-map-gl/maplibre';
import type { FillExtrusionLayerSpecification } from 'maplibre-gl';
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

// OpenMapTiles (which Carto uses) stores building heights in "render_height"
const buildingLayer = {
  id: '3d-buildings',
  source: 'openmaptiles', // The default source name in Carto's style.json
  'source-layer': 'building',
  type: 'fill-extrusion',
  minzoom: 14, // Buildings only pop up when you zoom in close
  paint: {
    'fill-extrusion-color': '#111116', // Deep cyberpunk gray/black
    'fill-extrusion-height': ['get', 'render_height'],
    'fill-extrusion-base': ['get', 'render_min_height'],
    'fill-extrusion-opacity': 0.8,
  },
} satisfies FillExtrusionLayerSpecification;

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
    new PathLayer({
      id: 'fleet-trails',
      data: vehicleArray,
      pickable: false,
      widthScale: 1,
      widthMinPixels: 3,
      jointRounded: true,
      capRounded: true,
      getPath: (d) => d.pathHistory || [], // Read the history from the store
      getColor: (d) => {
        // Match the line color to the vehicle status, but make it slightly transparent (alpha: 150)
        if (d.status === 'MOVING') return [34, 197, 94, 150];
        if (d.status === 'IDLE') return [245, 158, 11, 150];
        return [239, 68, 68, 150];
      },
    }),
    new IconLayer({
      id: 'fleet-icons',
      data: vehicleArray,
      pickable: true,
      // Deck.gl allows defining icons per-object seamlessly
      getIcon: () => ({
        url: '/car-icon.png', // Path to your white top-down vehicle image
        width: 128,
        height: 128,
        mask: true, // This allows getColor to dynamically tint the image
      }),
      getPosition: (d) => [d.lng, d.lat],
      getSize: 30, // Adjust based on your visual preference
      getAngle: (d) => d.heading, // Deck.gl rotates clockwise, matching standard compass headings
      getColor: (d) => {
        if (d.status === 'MOVING') return [34, 197, 94];
        if (d.status === 'IDLE') return [245, 158, 11];
        return [239, 68, 68];
      },
      transitions: {
        getPosition: 2000,
        getAngle: 2000, // Smoothly animates the vehicle turning
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
        <Map mapStyle={MAP_STYLE}>
          {/* This layer targets building data in standard vector tiles and extrudes them */}
          <Layer {...buildingLayer} />
        </Map>
      </DeckGL>
    </div>
  );
}

export default AppGL;

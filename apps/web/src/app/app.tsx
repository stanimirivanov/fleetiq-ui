import { useEffect, useState } from 'react';
import { mapPositionUpdateToVehicle, useFleetStore } from '@fleetiq-ui/shared-core';
import { apiClient } from '../api/transport';

export function App() {
  const vehicles = useFleetStore((state) => state.vehicles);
  const updatePosition = useFleetStore((state) => state.updateVehiclePosition);
  
  // Track connection status for UI feedback
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // AbortController allows us to gracefully cancel the stream if the component unmounts
    const abortController = new AbortController();

    async function connectToTelemetryStream() {
      setIsConnected(true);
      setError(null);
      
      try {
        const stream = apiClient.watchFleet(
          { vins: ['VIN-VARNA-01', 'VIN-SOFIA-02'], minUpdateIntervalSeconds: 2 }, 
          { signal: abortController.signal }
        );

        // Iterate over the stream as chunks arrive from Fastify
        for await (const response of stream) {
          const vehicleModel = mapPositionUpdateToVehicle(response);
          updatePosition(vehicleModel);
        }
      } catch (err: any) {
        // Ignore abort/cancellation errors caused by component unmounting or React Strict Mode
        const isCanceled = 
          err.name === 'AbortError' || 
          err.code === 'canceled' || 
          err.message?.includes('aborted');

        if (!isCanceled) {
          console.error("Telemetry stream error:", err);
          setError(err.message);
          setIsConnected(false);
        }
      }
    }

    connectToTelemetryStream();

    // Cleanup: cancel the stream when the App component is removed from the DOM
    return () => {
      abortController.abort();
      setIsConnected(false);
    };
  }, [updatePosition]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>FleetIQ Web Operator Console</h1>
      
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <h2>Active Vehicles Feed</h2>
        {isConnected ? (
          <span style={{ color: '#00ff00', fontWeight: 'bold' }}>● LIVE STREAMING</span>
        ) : (
          <span style={{ color: error ? '#ff0000' : '#ffa500', fontWeight: 'bold' }}>
            {error ? `● ERROR: ${error}` : '● DISCONNECTED'}
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
          maxHeight: '600px'
        }}
      >
        {JSON.stringify(vehicles, null, 2)}
      </pre>
    </div>
  );
}

export default App;
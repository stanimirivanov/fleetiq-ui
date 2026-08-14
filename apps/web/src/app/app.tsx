import { useEffect } from 'react';
import { useFleetStore } from '@fleetiq-ui/shared-core';

export function App() {
  const vehicles = useFleetStore((state) => state.vehicles);
  const updatePosition = useFleetStore((state) => state.updateVehiclePosition);

  // Simulate a live telemetry ping from the backend
  useEffect(() => {
    const timer = setInterval(() => {
      updatePosition({
        id: 'VIN-VARNA-01',
        lat: 43.2141,
        lng: 27.9147,
        speed: 60,
        heading: 180,
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [updatePosition]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>FleetIQ Web Operator Console</h1>
      <h2>Active Vehicles Feed</h2>
      <pre
        style={{
          background: '#1e1e1e',
          color: '#00ff00',
          padding: '1rem',
          borderRadius: '8rem',
        }}
      >
        {JSON.stringify(vehicles, null, 2)}
      </pre>
    </div>
  );
}

export default App;
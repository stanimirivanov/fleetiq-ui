// Example location: libs/shared-core/src/store/useFleetStore.ts
import { create } from 'zustand';

export interface VehiclePosition {
  id: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  status: string;
  lastTimestamp: number;
  pathHistory: [number, number][];
}

interface FleetStore {
  vehicles: Record<string, VehiclePosition>;
  updateVehiclePosition: (
    vehicleUpdate: Omit<VehiclePosition, 'pathHistory'>
  ) => void;
}

export const useFleetStore = create<FleetStore>((set) => ({
  vehicles: {},

  updateVehiclePosition: (vehicleUpdate) =>
    set((state) => {
      const existingVehicle = state.vehicles[vehicleUpdate.id];
      const previousHistory = existingVehicle?.pathHistory || [];
      const newPoint: [number, number] = [vehicleUpdate.lng, vehicleUpdate.lat];
      const updatedHistory = [...previousHistory, newPoint].slice(-20);

      return {
        vehicles: {
          ...state.vehicles,
          [vehicleUpdate.id]: {
            ...existingVehicle,
            ...vehicleUpdate,
            pathHistory: updatedHistory,
          },
        },
      };
    }),
}));

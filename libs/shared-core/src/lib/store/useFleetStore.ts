import { create } from 'zustand';

export interface VehiclePosition {
  id: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
}

interface FleetState {
  vehicles: Record<string, VehiclePosition>;
  updateVehiclePosition: (vehicle: VehiclePosition) => void;
}

export const useFleetStore = create<FleetState>((set) => ({
  vehicles: {},
  updateVehiclePosition: (vehicle) =>
    set((state) => ({
      vehicles: {
        ...state.vehicles,
        [vehicle.id]: vehicle,
      },
    })),
}));
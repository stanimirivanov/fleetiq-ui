import { VehicleStatus } from '@fleetiq-ui/shared-core';

interface VehicleState {
  vin: string;
  lat: number;
  lng: number;
  heading: number; // degrees
  speedKmh: number;
}

export class FleetSimulator {
  private activeVehicles = new Map<string, VehicleState>();
  private inactivePool: string[] = [];
  
  // Varna bounding box for the simulation
  private readonly bounds = {
    minLat: 43.150, maxLat: 43.280,
    minLng: 27.850, maxLng: 28.000,
  };

  constructor(poolSize: number = 30) {
    for (let i = 1; i <= poolSize; i++) {
      this.inactivePool.push(`VIN-VARNA-${i.toString().padStart(3, '0')}`);
    }
    // Start with 5 active vehicles
    for (let i = 0; i < 5; i++) this.activateRandomVehicle();

    // Run the physics/simulation loop every second
    setInterval(() => this.tick(), 1000);
  }

  public getActiveFleet() {
    return Array.from(this.activeVehicles.values()).map(v => ({
      vin: v.vin,
      timestamp: { epochMillis: BigInt(Date.now()) },
      position: { latitude: v.lat, longitude: v.lng, altitude: 35.5 },
      speedKmh: v.speedKmh,
      status: VehicleStatus.MOVING,
    }));
  }

  public getVehicle(vin: string) {
    const v = this.activeVehicles.get(vin);
    if (!v) return null;
    return {
      vin: v.vin,
      timestamp: { epochMillis: BigInt(Date.now()) },
      position: { latitude: v.lat, longitude: v.lng, altitude: 35.5 },
      speedKmh: v.speedKmh,
      status: VehicleStatus.MOVING,
    };
  }

  private tick() {
    // 1. Randomly add or remove vehicles (Dynamic Fleet)
    if (Math.random() < 0.05 && this.activeVehicles.size > 3) {
      this.deactivateRandomVehicle();
    } else if (Math.random() < 0.05 && this.inactivePool.length > 0) {
      this.activateRandomVehicle();
    }

    // 2. Move active vehicles
    for (const vehicle of this.activeVehicles.values()) {
      // Very rough conversion: 1 km/h is ~0.000009 degrees/sec
      const speedDegrees = (vehicle.speedKmh * 0.000009);
      const rad = vehicle.heading * (Math.PI / 180);
      
      vehicle.lat += Math.cos(rad) * speedDegrees;
      vehicle.lng += Math.sin(rad) * speedDegrees;

      // Add a slight turn to make paths look natural
      vehicle.heading += (Math.random() - 0.5) * 10;

      // Bounce off borders
      if (vehicle.lat < this.bounds.minLat || vehicle.lat > this.bounds.maxLat) {
        vehicle.heading = 180 - vehicle.heading;
        vehicle.lat = Math.max(this.bounds.minLat, Math.min(vehicle.lat, this.bounds.maxLat));
      }
      if (vehicle.lng < this.bounds.minLng || vehicle.lng > this.bounds.maxLng) {
        vehicle.heading = 360 - vehicle.heading;
        vehicle.lng = Math.max(this.bounds.minLng, Math.min(vehicle.lng, this.bounds.maxLng));
      }
    }
  }

  private activateRandomVehicle() {
    if (this.inactivePool.length === 0) return;
    
    // Spawn location ensuring spacing
    let lat = 0, lng = 0;
    let attempts = 0;
    let tooClose = true;

    // Minimum distance ~ 1.5km (0.015 degrees)
    while (tooClose && attempts < 50) {
      lat = this.bounds.minLat + Math.random() * (this.bounds.maxLat - this.bounds.minLat);
      lng = this.bounds.minLng + Math.random() * (this.bounds.maxLng - this.bounds.minLng);
      
      tooClose = Array.from(this.activeVehicles.values()).some(
        v => Math.hypot(v.lat - lat, v.lng - lng) < 0.015
      );
      attempts++;
    }

    const vin = this.inactivePool.pop()!;
    this.activeVehicles.set(vin, {
      vin,
      lat,
      lng,
      heading: Math.random() * 360,
      speedKmh: 30 + Math.random() * 40, // 30-70 km/h
    });
    
    console.log(`[SIM] Vehicle joined: ${vin} (Active: ${this.activeVehicles.size})`);
  }

  private deactivateRandomVehicle() {
    const keys = Array.from(this.activeVehicles.keys());
    const randomVin = keys[Math.floor(Math.random() * keys.length)];
    this.activeVehicles.delete(randomVin);
    this.inactivePool.push(randomVin);
    
    console.log(`[SIM] Vehicle left: ${randomVin} (Active: ${this.activeVehicles.size})`);
  }
}

// Export a singleton instance to be shared across all gRPC streams
export const globalSimulator = new FleetSimulator();
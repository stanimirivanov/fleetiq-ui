import { VehicleStatus } from '../gen/fleetiq/common/v1/types_pb';
import { PositionUpdate } from '../gen/fleetiq/streaming/v1/fleet_streaming_pb';
import { VehiclePosition } from '../store/useFleetStore';

// TODO: heading is hardcoded to 0; implement it correctly in the backend

export function mapPositionUpdateToVehicle(
  update: PositionUpdate
): Omit<VehiclePosition, 'pathHistory'> {
  return {
    id: update.vin,
    lat: update.position?.latitude ?? 0,
    lng: update.position?.longitude ?? 0,
    speed: update.speedKmh,
    heading: 0,
    status: VehicleStatus[update.status] ?? 'UNSPECIFIED',
    // Safely convert Protobuf bigint timestamp to a standard JS timestamp number
    lastTimestamp: update.timestamp
      ? Number(update.timestamp.epochMillis)
      : Date.now(),
  };
}

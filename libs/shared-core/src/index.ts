export * from './lib/store/useFleetStore';

// 1. Explicitly export the Connect Service Definition
export { FleetStreaming } from './lib/gen/fleetiq/streaming/v1/fleet_streaming_connect';

// 2. Export all the generated TypeScript interfaces/types
export * from './lib/gen/fleetiq/streaming/v1/fleet_streaming_pb';
export * from './lib/gen/fleetiq/common/v1/types_pb';
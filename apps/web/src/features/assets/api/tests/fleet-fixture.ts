import contract from '../../../../../../../contracts/http/fleetiq-v1-ui-baseline.openapi.json';
import type { FleetRequest } from '../../model/fleet';
import { wireChange } from './evidence-fixture';
export const fleetRequest: FleetRequest = {
  tenantId: 'tenant-a',
  mapping: {
    latitude: { id: 'position.latitude', version: 1 },
    longitude: { id: 'position.longitude', version: 1 },
    encoding: 'e7',
  },
  limit: 50,
};
export function fleetWire() {
  return structuredClone(
    contract.components.responses.FleetSnapshotSucceeded.content[
      'application/json'
    ].example,
  );
}
export function observedFleetWire() {
  const w = fleetWire(),
    base = wireChange();
  const change = (
    axis: 'latitude' | 'longitude',
    index: number,
    value: string,
  ) => ({
    ...base,
    property_id: `position.${axis}`,
    property_version: 1,
    source_unit: null,
    event_time_basis: 'device_recorded' as const,
    event_at_ms: '1000',
    value: { kind: 'integer' as const, value },
    quality: 'good' as const,
    source: {
      ...base.source,
      message_id: 'position-message',
      output_index: index,
      signal_id: `position.${axis}`,
      device_recorded_at_ms: '1000',
      received_at_ms: '1500',
    },
  });
  return {
    ...w,
    revision: '1',
    pending: false,
    summary: { ...w.summary, assets_with_current_properties: '1' },
    assets: [
      {
        ...firstFleetAsset(w.assets),
        location: {
          status: 'observed' as const,
          point: {
            latitude: '51.5',
            longitude: '-0.12',
            quality: 'good' as const,
            freshness: 'fresh' as const,
            latitude_change: change('latitude', 0, '515000000'),
            longitude_change: change('longitude', 1, '-1200000'),
          },
        },
      },
    ],
  };
}

export function firstFleetAsset<T>(assets: readonly T[]): T {
  const a = assets[0];
  if (!a) throw new Error('Fleet fixture must contain an asset');
  return a;
}

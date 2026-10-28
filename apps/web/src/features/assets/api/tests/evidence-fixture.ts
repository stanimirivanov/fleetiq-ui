import contract from '../../../../../../../contracts/http/fleetiq-v1-ui-baseline.openapi.json';
import type { PropertyRequest } from '../../model/property-evidence';
export const request: PropertyRequest = {
  tenantId: 'tenant-a',
  assetId: 'asset-a',
  property: {
    id: 'electrical.voltage',
    version: 1,
    name: 'Voltage',
    valueKind: 'integer',
    canonicalUnit: 'volt',
  },
};
export function wireChange() {
  const value =
    contract.components.responses.PropertyHistorySucceeded.content[
      'application/json'
    ].example.changes[0];
  if (!value) throw new Error('Published history example is absent');
  return structuredClone(value);
}
export function wireCurrent() {
  return {
    generation: '1',
    revision: '9',
    processed_count: '12',
    pending: false,
    evaluated_at_ms: '2000',
    stale_after_ms: 30000,
    items: [{ freshness: 'fresh', change: wireChange() }],
  };
}

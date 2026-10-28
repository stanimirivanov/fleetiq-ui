import type { AssetReadOptions } from './asset-catalogue';
import type { DefinitionRef } from './metadata';
import type { PropertyEvidence } from './property-evidence';
export interface FleetMapping {
  readonly latitude: DefinitionRef;
  readonly longitude: DefinitionRef;
  readonly encoding: 'degrees' | 'e7';
}
export interface FleetRequest {
  readonly tenantId: string;
  readonly mapping: FleetMapping;
  readonly limit: number;
  readonly after?: string;
}
export type LocationStatus =
  | 'unmapped'
  | 'incompatible_mapping'
  | 'missing'
  | 'incoherent'
  | 'invalid_coordinates'
  | 'invalid_quality';
export interface FleetPoint {
  readonly latitude: string;
  readonly longitude: string;
  readonly quality: 'good' | 'uncertain';
  readonly freshness: 'fresh' | 'stale' | 'future';
  readonly latitudeChange: PropertyEvidence;
  readonly longitudeChange: PropertyEvidence;
}
export interface FleetAsset {
  readonly id: string;
  readonly name: string;
  readonly type: DefinitionRef;
  readonly location:
    | { readonly status: LocationStatus }
    | { readonly status: 'observed'; readonly point: FleetPoint };
}
export interface FleetPage {
  readonly generation: string;
  readonly revision: string;
  readonly pending: boolean;
  readonly evaluatedAt: string;
  readonly mappingSupported: boolean;
  readonly summary: {
    readonly assets: string;
    readonly devices: string;
    readonly mapped: string;
    readonly withProperties: string;
  };
  readonly assets: readonly FleetAsset[];
  readonly nextAfter: string | null;
}
export interface FleetReader {
  snapshot(
    request: FleetRequest,
    options?: AssetReadOptions,
  ): Promise<FleetPage>;
}
/** Filters operate on this page only, never on an invented accumulated fleet. */
export function filterFleet(
  assets: readonly FleetAsset[],
  query: string,
  state: string,
): readonly FleetAsset[] {
  const q = query.trim().toLocaleLowerCase();
  return assets.filter(
    (a) =>
      (!q || `${a.id} ${a.name}`.toLocaleLowerCase().includes(q)) &&
      (state === 'all' ||
        (state === 'located'
          ? a.location.status === 'observed'
          : a.location.status !== 'observed')),
  );
}

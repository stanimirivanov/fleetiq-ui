import { Result, Schema } from 'effect';
import { RequestFailure } from '#shared/model';
import { FleetSnapshot } from '../../../generated/fleetiq-api';
import { isValidAssetIdentifier } from '../model/asset-catalogue';
import type { FleetPage, FleetRequest } from '../model/fleet';
import { sameCoordinate } from '../model/geodetic';
import { isMillis } from '../model/property-evidence';
import { parseFleetPoint } from './parse-fleet-point';

const invalid = (): never => {
  throw new RequestFailure('invalid-response');
};
const counter = (s: string) => /^(0|[1-9][0-9]*)$/.test(s) && isMillis(s);
/** Validate scope, precision and page invariants beyond generated wire shape checks. */
export function parseFleet(input: unknown, request: FleetRequest): FleetPage {
  const d = Schema.decodeUnknownResult(FleetSnapshot)(input);
  if (Result.isFailure(d)) return invalid();
  const w = d.success,
    m = w.mapping,
    r = request.mapping;
  if (
    m.encoding !== r.encoding ||
    m.latitude.id !== r.latitude.id ||
    m.latitude.version !== r.latitude.version ||
    m.longitude.id !== r.longitude.id ||
    m.longitude.version !== r.longitude.version ||
    !isMillis(w.evaluated_at_ms) ||
    ![w.generation, w.revision, ...Object.values(w.summary)].every(counter) ||
    w.assets.length > request.limit ||
    BigInt(w.summary.assets) < BigInt(w.assets.length) ||
    BigInt(w.summary.communication_devices) > BigInt(w.summary.assets) ||
    BigInt(w.summary.mapped_assets) > BigInt(w.summary.assets) ||
    BigInt(w.summary.assets_with_current_properties) >
      BigInt(w.summary.assets) ||
    (w.generation === '0' && (w.revision !== '0' || w.pending))
  )
    invalid();
  let previous = request.after;
  const assets = w.assets.map((a) => {
    if (
      !isValidAssetIdentifier(a.asset_id) ||
      !isValidAssetIdentifier(a.asset_type.id) ||
      !a.display_name.trim() ||
      (previous !== undefined && compare(previous, a.asset_id) >= 0)
    )
      invalid();
    previous = a.asset_id;
    const loc = a.location;
    if (
      (!w.mapping_supported &&
        !['unmapped', 'incompatible_mapping'].includes(loc.status)) ||
      (w.mapping_supported && loc.status === 'incompatible_mapping')
    )
      invalid();
    if (loc.status !== 'observed')
      return {
        id: a.asset_id,
        name: a.display_name,
        type: a.asset_type,
        location: loc,
      };
    const point = parseFleetPoint(
      loc.point,
      request,
      a.asset_id,
      w.evaluated_at_ms,
    );
    if (
      !sameCoordinate(
        point.latitude,
        String(point.latitudeChange.value.value),
        m.encoding,
        90,
      ) ||
      !sameCoordinate(
        point.longitude,
        String(point.longitudeChange.value.value),
        m.encoding,
        180,
      ) ||
      w.generation === '0' ||
      w.revision === '0'
    )
      invalid();
    return {
      id: a.asset_id,
      name: a.display_name,
      type: a.asset_type,
      location: { status: 'observed' as const, point },
    };
  });
  if (
    BigInt(w.summary.mapped_assets) <
      BigInt(assets.filter((a) => a.location.status !== 'unmapped').length) ||
    BigInt(w.summary.assets_with_current_properties) <
      BigInt(assets.filter((a) => a.location.status === 'observed').length)
  )
    invalid();
  if (
    w.next_after !== null &&
    (assets.length !== request.limit ||
      w.next_after !== assets.at(-1)?.id ||
      !isValidAssetIdentifier(w.next_after))
  )
    invalid();
  return {
    generation: w.generation,
    revision: w.revision,
    pending: w.pending,
    evaluatedAt: w.evaluated_at_ms,
    mappingSupported: w.mapping_supported,
    summary: {
      assets: w.summary.assets,
      devices: w.summary.communication_devices,
      mapped: w.summary.mapped_assets,
      withProperties: w.summary.assets_with_current_properties,
    },
    assets,
    nextAfter: w.next_after,
  };
}
/** PostgreSQL C collation compares UTF-8 bytes, not UTF-16 code units. */
function compare(a: string, b: string): number {
  const e = new TextEncoder(),
    x = e.encode(a),
    y = e.encode(b);
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    if (x[i] !== y[i]) return (x[i] ?? 0) - (y[i] ?? 0);
  }
  return x.length - y.length;
}

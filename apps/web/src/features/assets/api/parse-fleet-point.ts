import { RequestFailure } from '#shared/model';
import type { FleetPoint as WirePoint } from '../../../generated/fleetiq-api';
import type { FleetPoint, FleetRequest } from '../model/fleet';
import { parsePropertyEvidence } from './parse-property-evidence';
/** A coordinate pair is a coherent observation, never a join of unrelated last values. */
export function parseFleetPoint(
  w: WirePoint,
  r: FleetRequest,
  assetId: string,
  evaluated: string,
): FleetPoint {
  const invalid = (): never => {
    throw new RequestFailure('invalid-response');
  };
  const evidence = (axis: 'latitude' | 'longitude') => {
    const raw = axis === 'latitude' ? w.latitude_change : w.longitude_change;
    if (
      (r.mapping.encoding === 'e7' && raw.value.kind !== 'integer') ||
      (r.mapping.encoding === 'degrees' &&
        !['integer', 'decimal'].includes(raw.value.kind))
    )
      invalid();
    return parsePropertyEvidence(raw, {
      tenantId: r.tenantId,
      assetId,
      property: {
        ...r.mapping[axis],
        name: axis,
        valueKind: raw.value.kind,
        canonicalUnit: r.mapping.encoding === 'degrees' ? 'deg' : null,
      },
    });
  };
  const a = evidence('latitude'),
    b = evidence('longitude'),
    s = a.source,
    t = b.source;
  if (
    a.eventTimeBasis !== 'device_recorded' ||
    b.eventTimeBasis !== 'device_recorded' ||
    a.eventAt !== b.eventAt ||
    a.quality === 'invalid' ||
    b.quality === 'invalid' ||
    s.recordedAt === null ||
    [
      'messageId',
      'packageId',
      'packageVersion',
      'deviceId',
      'endpointId',
      'recordedAt',
      'receivedAt',
    ].some((k) => s[k as keyof typeof s] !== t[k as keyof typeof t]) ||
    s.outputIndex === t.outputIndex ||
    s.signalId === t.signalId
  )
    invalid();
  const age = BigInt(evaluated) - BigInt(a.eventAt),
    fresh = age < 0n ? 'future' : age <= 30000n ? 'fresh' : 'stale';
  if (
    w.freshness !== fresh ||
    w.quality !==
      (a.quality === 'uncertain' || b.quality === 'uncertain'
        ? 'uncertain'
        : 'good')
  )
    invalid();
  return {
    latitude: w.latitude,
    longitude: w.longitude,
    quality: w.quality,
    freshness: w.freshness,
    latitudeChange: a,
    longitudeChange: b,
  };
}

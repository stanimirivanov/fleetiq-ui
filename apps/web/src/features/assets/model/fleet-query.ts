import { isValidAssetIdentifier } from './asset-catalogue';
import type { FleetRequest } from './fleet';
import { isDefinitionVersion } from './metadata';
export const fleetKeys = [
  'latitude_property',
  'latitude_version',
  'longitude_property',
  'longitude_version',
  'encoding',
  'fleet_after',
  'map_q',
  'map_state',
] as const;
export type FleetQuery =
  | { readonly kind: 'invalid'; readonly message: string }
  | {
      readonly kind: 'ready';
      readonly tenantId: string;
      readonly request: FleetRequest | null;
      readonly selected: string | null;
      readonly q: string;
      readonly state: string;
    };
export function readFleetQuery(search: string): FleetQuery {
  const p = new URLSearchParams(search);
  const bad = (): FleetQuery => ({
    kind: 'invalid',
    message:
      'Use one tenant, an exact coordinate-property mapping, and a valid page/filter scope.',
  });
  if (['tenant', 'asset', ...fleetKeys].some((k) => p.getAll(k).length > 1))
    return bad();
  const tenantId = p.get('tenant') ?? '',
    selected = p.get('asset'),
    after = p.get('fleet_after');
  if (
    [tenantId, selected, after].some(
      (v) => v !== null && v !== '' && !isValidAssetIdentifier(v),
    )
  )
    return bad();
  if ((p.has('tenant') && !tenantId) || selected === '' || after === '')
    return bad();
  const q = p.get('map_q') ?? '',
    state = p.get('map_state') ?? 'all';
  if (
    [...q].length > 200 ||
    /\p{Cc}/u.test(q) ||
    !['all', 'located', 'unlocated'].includes(state)
  )
    return bad();
  const fields = [
    'latitude_property',
    'latitude_version',
    'longitude_property',
    'longitude_version',
    'encoding',
  ];
  if (!fields.some((k) => p.has(k)))
    return { kind: 'ready', tenantId, selected, q, state, request: null };
  const lat = p.get('latitude_property') ?? '',
    lon = p.get('longitude_property') ?? '';
  const version = (s: string | null) =>
    s !== null && /^[1-9][0-9]*$/.test(s) && isDefinitionVersion(Number(s));
  const lv = p.get('latitude_version'),
    ov = p.get('longitude_version'),
    encoding = p.get('encoding');
  if (
    !tenantId ||
    !isValidAssetIdentifier(lat) ||
    !isValidAssetIdentifier(lon) ||
    !version(lv) ||
    !version(ov) ||
    (lat === lon && lv === ov) ||
    (encoding !== 'degrees' && encoding !== 'e7')
  )
    return bad();
  return {
    kind: 'ready',
    tenantId,
    selected,
    q,
    state,
    request: {
      tenantId,
      mapping: {
        latitude: { id: lat, version: Number(lv) },
        longitude: { id: lon, version: Number(ov) },
        encoding,
      },
      limit: 50,
      ...(after ? { after } : {}),
    },
  };
}

/** Safe public navigation projection: no tokens, arbitrary params or preview opt-in. */
export function fleetWorkspaceHref(path: '/' | '/map', search: string): string {
  const source = new URLSearchParams(search),
    target = new URLSearchParams();
  for (const key of ['tenant', 'tenant_after', 'asset', ...fleetKeys])
    for (const value of source.getAll(key)) target.append(key, value);
  return `${path}${target.size ? `?${target}` : ''}`;
}

import { expect, test } from 'vitest';
import { readFleetQuery } from './fleet-query';
import { sameCoordinate } from './geodetic';
import { ownedMapResource, validateMapStyle } from './map-resource';

const mapping =
  'tenant=tenant-a&latitude_property=lat&latitude_version=1&longitude_property=lon&longitude_version=1&encoding=e7';
test('URL mapping is explicit, bounded and unambiguous', () => {
  expect(readFleetQuery('')).toMatchObject({ kind: 'ready', request: null });
  expect(readFleetQuery(mapping)).toMatchObject({
    kind: 'ready',
    request: { limit: 50 },
  });
  for (const s of [
    `${mapping}&tenant=other`,
    mapping.replace('longitude_version=1', 'longitude_version=0'),
    mapping.replace('encoding=e7', 'encoding=guess'),
    mapping.replace('latitude_property=lat', 'latitude_property=lon'),
    `${mapping}&map_state=online`,
    `${mapping}&fleet_after=`,
    'latitude_property=lat',
  ])
    expect(readFleetQuery(s).kind).toBe('invalid');
});
test('coordinate precision and exact pole/antimeridian boundaries are preserved', () => {
  expect(sameCoordinate('-90', '-900000000', 'e7', 90)).toBe(true);
  expect(sameCoordinate('180.000', '180', 'degrees', 180)).toBe(true);
  expect(
    sameCoordinate(
      '90.000000000000000001',
      '90.000000000000000001',
      'degrees',
      90,
    ),
  ).toBe(false);
  expect(sameCoordinate('51.5', '515000000', 'e7', 90)).toBe(true);
  expect(sameCoordinate('1E-8', '0.00000001', 'degrees', 90)).toBe(true);
  expect(sameCoordinate('9E1', '90.00', 'degrees', 90)).toBe(true);
  expect(
    sameCoordinate(
      '1E9999999999999999999',
      '1E9999999999999999999',
      'degrees',
      90,
    ),
  ).toBe(false);
  for (const raw of ['NaN', '1e2', 'Infinity', '1.0'])
    expect(sameCoordinate('1', raw, 'e7', 90)).toBe(false);
});
test('only deployment-owned same-origin map resources can be requested', () => {
  const origin = 'https://fleet.test';
  expect(ownedMapResource('/maps/light/style.json', origin)).toBe(
    `${origin}/maps/light/style.json`,
  );
  for (const v of [
    'https://tiles.other/a',
    '//other/maps/a',
    '/api/v1/auth/session',
    '/maps/../api',
    '/maps/%2e%2e/a',
    '/maps/%252e/a',
    '/maps/a?token=x',
    'data:text/plain,a',
    'blob:https://fleet.test/x',
    '/maps/a#x',
  ])
    expect(() => ownedMapResource(v, origin)).toThrow();
});

test('styles cannot introduce alternate video, image, GeoJSON, imported or credentialed transports', () => {
  const origin = 'https://fleet.test',
    style = {
      version: 8,
      sources: {
        base: { type: 'raster', tiles: ['/maps/tiles/{z}/{x}/{y}.png'] },
      },
      layers: [],
    };
  expect(validateMapStyle(style, origin)).toBe(style);
  for (const bad of [
    {
      ...style,
      sources: { base: { type: 'raster', url: '/maps/source.json' } },
    },
    { ...style, imports: [{ url: 'https://other/a' }] },
    { ...style, sprite: 'https://other/sprite' },
    ...['video', 'image', 'geojson'].map((type) => ({
      ...style,
      sources: { bad: { type, urls: ['https://other/a'] } },
    })),
    {
      ...style,
      sources: { bad: { type: 'raster', tiles: ['/maps/a?token=x'] } },
    },
  ])
    expect(() => validateMapStyle(bad, origin)).toThrow();
});

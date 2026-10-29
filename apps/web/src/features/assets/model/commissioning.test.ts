import { expect, test } from 'vitest';
import {
  exactMillis,
  validAssetDraft,
  validRelationship,
} from './commissioning';

const type = { id: 'equipment', version: 1 };
const asset = {
  id: 'asset-a',
  name: 'Equipment',
  asset_type: type,
  external_identifiers: [],
};
const edge = {
  relationship_type: type,
  source_asset_id: 'asset-a',
  target_asset_id: 'asset-b',
  effective_interval: { start_ms: -1, end_ms: null },
};
test('commissioning keeps exact revision and bounded temporal inputs without rounding', () => {
  expect(validRelationship('edge', '18446744073709551615', edge)).toBe(true);
  for (const revision of ['0', '01', '18446744073709551616', '1.5'])
    expect(validRelationship('edge', revision, edge)).toBe(false);
  expect(exactMillis('9007199254740993')).toBeNull();
  expect(exactMillis('1e3')).toBeNull();
  expect(exactMillis('-1')).toBe(-1);
  expect(
    validRelationship('edge', '1', {
      ...edge,
      effective_interval: { start_ms: 1, end_ms: 1 },
    }),
  ).toBe(false);
  expect(
    validRelationship('edge', '1', {
      ...edge,
      effective_interval: { start_ms: 1, end_ms: 2 },
    }),
  ).toBe(true);
});
test('asset validation rejects duplicate normalized namespaces and invalid exact versions', () => {
  expect(validAssetDraft(asset)).toBe(true);
  expect(
    validAssetDraft({
      ...asset,
      external_identifiers: Array.from({ length: 100 }, (_, i) => ({
        kind: 'k'.repeat(128),
        authority: 'a'.repeat(128),
        value: String(i).padStart(128, 'v'),
      })),
    }),
  ).toBe(false);
  const id = { kind: 'serial', authority: null, value: 'serial-1' };
  expect(validAssetDraft({ ...asset, external_identifiers: [id, id] })).toBe(
    false,
  );
  expect(
    validAssetDraft({ ...asset, asset_type: { ...type, version: 0 } }),
  ).toBe(false);
  expect(validAssetDraft({ ...asset, name: ' ' })).toBe(false);
  expect(
    validAssetDraft({
      ...asset,
      external_identifiers: [{ ...id, authority: 'vendor' }],
    }),
  ).toBe(true);
});

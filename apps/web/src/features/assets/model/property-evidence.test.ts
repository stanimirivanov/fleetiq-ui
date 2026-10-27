import { expect, test } from 'vitest';
import { evidenceChart } from './evidence-chart';
import { readEvidenceQuery } from './evidence-query';
import {
  clearSnapshotSelection,
  metadataHref,
  tenantContextChanges,
} from './metadata-query';
import type { PropertyEvidence } from './property-evidence';
import { evidenceTime, isMillis, validHistory } from './property-evidence';

// Model tests use synthetic validated values; production models never import adapters.
const request = {
  tenantId: 'tenant-a',
  assetId: 'asset-a',
  property: {
    id: 'electrical.voltage',
    version: 1,
    name: 'Voltage',
    valueKind: 'integer' as const,
    canonicalUnit: 'volt',
  },
};
const evidence: PropertyEvidence = {
  interpretation: 'v1.aa',
  tenantId: 'tenant-a',
  assetId: 'asset-a',
  propertyId: 'electrical.voltage',
  propertyVersion: 1,
  bindingId: 'binding-1',
  bindingRevision: '1',
  eventTimeBasis: 'device_recorded',
  eventAt: '1000',
  effectiveAt: '1000',
  knownAt: '150',
  value: { kind: 'integer', value: '9' },
  unit: 'volt',
  quality: 'good',
  source: {
    messageId: 'm',
    packageId: 'p',
    packageVersion: '1',
    outputIndex: 0,
    deviceId: 'gateway',
    endpointId: 'can',
    signalId: 'voltage',
    recordedAt: '1000',
    receivedAt: '2000',
  },
};
test('URL property/version/window/cursors reject duplicate and partial context', () => {
  const refs = [request.property];
  expect(readEvidenceQuery('', refs, 2000)).toMatchObject({
    kind: 'ready',
    property: request.property,
    end: '2000',
  });
  for (const search of [
    '?property=x',
    '?property=missing&property_version=1',
    '?history_start=0',
    '?history_start=0&history_end=0',
    '?history_after=bad',
    '?property=x&property=x',
    '?history_start=0&history_end=604800001',
  ])
    expect(readEvidenceQuery(search, refs, 2000).kind).toBe('invalid');
  expect(readEvidenceQuery('', [], 2000)).toMatchObject({
    kind: 'ready',
    property: null,
  });
});
test('signed milliseconds preserve full range; history windows stay bounded', () => {
  expect(isMillis('-9223372036854775808')).toBe(true);
  expect(isMillis('9223372036854775808')).toBe(false);
  expect(isMillis('1.1')).toBe(false);
  expect(evidenceTime('9223372036854775807')).toContain('ms since Unix epoch');
  expect(() =>
    validHistory({ ...request, start: '0', end: '1', limit: 50 }),
  ).not.toThrow();
  for (const patch of [
    { start: 'bad' },
    { end: '0' },
    { limit: 101 },
    { after: 'bad' },
    { end: '604800001' },
  ])
    expect(() =>
      validHistory({ ...request, start: '0', end: '1', limit: 50, ...patch }),
    ).toThrow();
});
test('chart normalizes exact decimal values and times without losing large-value differences', () => {
  const base = evidence;
  const a = {
    ...base,
    value: { kind: 'decimal' as const, value: '9007199254740993.000000001' },
  };
  const b = {
    ...base,
    eventAt: '1001',
    value: { kind: 'decimal' as const, value: '9007199254740993.000000002' },
  };
  expect(evidenceChart([a, b])).toBe('0,180 1000,20');
  expect(evidenceChart([a])).toBeNull();
  expect(
    evidenceChart([a, { ...b, value: { kind: 'decimal', value: '1e99999' } }]),
  ).toBeNull();
  expect(
    evidenceChart([a, { ...b, value: { kind: 'text', value: 'ready' } }]),
  ).toBeNull();
});

test('asset and tenant navigation discard property provenance and history cursors while retaining explicit review times', () => {
  const original =
    '?tenant=tenant-a&effective_at_ms=3000&known_at_ms=4000&property=voltage&property_version=1&history_start=0&history_end=3000&history_after=v1.aa&interpretation=v1.bb';
  for (const changes of [
    clearSnapshotSelection(),
    tenantContextChanges('tenant-b'),
  ]) {
    const url = new URL(
      metadataHref('/assets/other', original, changes),
      'https://fleet.example',
    );
    for (const key of [
      'property',
      'property_version',
      'history_start',
      'history_end',
      'history_after',
      'interpretation',
    ])
      expect(url.searchParams.has(key)).toBe(false);
    expect(url.searchParams.get('effective_at_ms')).toBe('3000');
    expect(url.searchParams.get('known_at_ms')).toBe('4000');
  }
});

import { expect, test } from 'vitest';
import {
  assetSelectionChanges,
  metadataHref,
  readMetadataQuery,
  tenantContextChanges,
} from './metadata-query';

const context = '?tenant=tenant-a&effective_at_ms=1500&known_at_ms=2500';

test('requires explicit tenant and a complete unambiguous safe cutoff pair', () => {
  expect(readMetadataQuery('')).toEqual({ kind: 'missing-tenant' });
  expect(readMetadataQuery('?tenant=tenant-a')).toEqual({
    kind: 'missing-cutoffs',
  });
  for (const search of [
    '?tenant=tenant-a&effective_at_ms=1500',
    `${context}&known_at_ms=3000`,
    `${context}&tenant=tenant-b`,
    '?tenant=tenant-a&effective_at_ms=9007199254740992&known_at_ms=1',
    '?tenant=%20&effective_at_ms=1&known_at_ms=2',
  ]) {
    expect(readMetadataQuery(search).kind).toBe('invalid');
  }
  expect(
    readMetadataQuery('?tenant=tenant-a&effective_at_ms=-1500&known_at_ms=0'),
  ).toMatchObject({
    kind: 'ready',
    query: { effectiveAtMs: -1500, knownAtMs: 0 },
  });
});

test('reads exact source context and independent cursors without losing millisecond precision', () => {
  expect(
    readMetadataQuery(
      `${context}&asset=asset-1&after=asset-2&relationship_after=rel-1&target_after=binding-1&source_after=binding-2&device_asset_id=gateway-1&endpoint_id=can-primary&signal_id=bus.voltage`,
    ),
  ).toMatchObject({
    kind: 'ready',
    query: {
      tenantId: 'tenant-a',
      effectiveAtMs: 1500,
      knownAtMs: 2500,
      assetId: 'asset-1',
      after: 'asset-2',
      relationshipAfter: 'rel-1',
      targetAfter: 'binding-1',
      sourceAfter: 'binding-2',
      source: {
        deviceAssetId: 'gateway-1',
        endpointId: 'can-primary',
        signalId: 'bus.voltage',
      },
    },
  });
  expect(readMetadataQuery(`${context}&device_asset_id=gateway-1`).kind).toBe(
    'invalid',
  );
});

test('moving a single cursor preserves siblings, tenant, cutoffs and URL filters', () => {
  const href = metadataHref(
    '/assets/registry/review',
    `${context}&q=Main&type=generic.machine&relationship_after=rel-1&target_after=binding-1`,
    { source_after: 'binding-2' },
  );
  const params = new URLSearchParams(href.split('?')[1]);
  expect(Object.fromEntries(params)).toMatchObject({
    tenant: 'tenant-a',
    effective_at_ms: '1500',
    known_at_ms: '2500',
    q: 'Main',
    type: 'generic.machine',
    relationship_after: 'rel-1',
    target_after: 'binding-1',
    source_after: 'binding-2',
  });
});

test('tenant and asset changes clear foreign selection and snapshot pagination', () => {
  const search = `${context}&asset=asset-1&binding=binding-1&after=asset-2&relationship_after=rel-1&target_after=binding-1&source_after=binding-2&device_asset_id=gateway-1&endpoint_id=can&signal_id=voltage`;
  const newTenant = metadataHref(
    '/assets/registry/review',
    search,
    tenantContextChanges('tenant-b'),
  );
  expect(
    Object.fromEntries(new URLSearchParams(newTenant.split('?')[1])),
  ).toEqual({
    tenant: 'tenant-b',
    effective_at_ms: '1500',
    known_at_ms: '2500',
  });
  const newAsset = metadataHref(
    '/assets/registry/review',
    search,
    assetSelectionChanges('asset-3'),
  );
  expect(
    Object.fromEntries(new URLSearchParams(newAsset.split('?')[1])),
  ).toEqual({
    tenant: 'tenant-a',
    effective_at_ms: '1500',
    known_at_ms: '2500',
    asset: 'asset-3',
    after: 'asset-2',
  });
});

test('route links remove preview opt-in and encode identities without changing cutoff values', () => {
  expect(metadataHref('/assets/asset%201', `${context}&preview=sample`)).toBe(
    `/assets/asset%201${context}`,
  );
});

test('exact binding revision context is explicit, unambiguous and cleared on selection changes', () => {
  expect(
    readMetadataQuery(
      `${context}&binding=binding-a&binding_revision=18446744073709551615`,
    ).kind,
  ).toBe('ready');
  for (const suffix of [
    '&binding_revision=1',
    '&binding=b&binding_revision=0',
    '&binding=b&binding_revision=1&binding_revision=2',
  ])
    expect(readMetadataQuery(context + suffix).kind).toBe('invalid');
  expect(
    metadataHref(
      '/assets/registry/review',
      `${context}&binding=old&binding_revision=2`,
      { binding: 'new' },
    ),
  ).not.toContain('binding_revision');
  expect(tenantContextChanges('tenant-b').binding_revision).toBeNull();
});

test('filter boundaries reject oversized input, control characters and invalid type scope', () => {
  const accepted = new URLSearchParams({
    q: '🛠'.repeat(200),
    type: 'generic.machine',
  });
  expect(readMetadataQuery(`${context}&${accepted}`)).toMatchObject({
    kind: 'ready',
    query: { q: '🛠'.repeat(200), type: 'generic.machine' },
  });
  for (const [key, value] of [
    ['q', '🛠'.repeat(201)],
    ['q', 'machine\nother'],
    ['q', 'machine\u0000other'],
    ['type', ' generic.machine'],
  ] as const) {
    expect(
      readMetadataQuery(`${context}&${new URLSearchParams([[key, value]])}`)
        .kind,
    ).toBe('invalid');
  }
});

test('navigation removes an empty query and preserves only explicitly paired revision changes', () => {
  expect(
    metadataHref('/assets', '?preview=sample&tenant=tenant-a', {
      tenant: null,
    }),
  ).toBe('/assets');
  expect(metadataHref('/assets', '?q=machine', { q: '' })).toBe('/assets');
  const next = metadataHref(
    '/assets/registry/review',
    `${context}&binding=old&binding_revision=2`,
    {
      binding: 'new',
      binding_revision: '7',
    },
  );
  const params = new URLSearchParams(next.split('?')[1]);
  expect(params.get('binding')).toBe('new');
  expect(params.get('binding_revision')).toBe('7');
  expect(readMetadataQuery(`?${params}`).kind).toBe('ready');
});

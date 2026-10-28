import { afterEach, describe, expect, test, vi } from 'vitest';
import { type BrowserApi, createBrowserApi } from '#shared/api';
import contract from '../../../../../../contracts/http/fleetiq-v1-ui-baseline.openapi.json';
import type {
  AssetSnapshotRequest,
  SourceSnapshotRequest,
} from '../model/metadata';
import { createLiveMetadataReader } from './live-metadata-reader';
import { fleetRequest, observedFleetWire } from './tests/fleet-fixture';

const owned: BrowserApi[] = [];
afterEach(async () => {
  await Promise.all(owned.splice(0).map((api) => api.dispose()));
});
function setup(body: unknown) {
  const fetch = vi.fn<typeof globalThis.fetch>(
    async () =>
      new Response(JSON.stringify(body), {
        headers: { 'content-type': 'application/json' },
      }),
  );
  const api = createBrowserApi({ origin: 'https://fleet.example', fetch });
  owned.push(api);
  return { reader: createLiveMetadataReader(api), fetch };
}
const asset =
  contract.components.responses['getAsset-200'].content['application/json']
    .example;
const assetType =
  contract.components.responses['getAssetTypeDefinition-200'].content[
    'application/json'
  ].example;
const property =
  contract.components.responses['getPropertyDefinition-200'].content[
    'application/json'
  ].example;
const relationshipType =
  contract.components.responses['getRelationshipTypeDefinition-200'].content[
    'application/json'
  ].example;
const relationships =
  contract.components.responses['listAssetRelationships-200'].content[
    'application/json'
  ].example;
const targetBindings =
  contract.components.responses['listAssetSignalBindings-200'].content[
    'application/json'
  ].example;
const sourceBindings =
  contract.components.responses['listSourceSignalBindings-200'].content[
    'application/json'
  ].example;
const snapshot: AssetSnapshotRequest = {
  tenantId: 'tenant-a',
  assetId: 'assembly-a',
  effectiveAtMs: 1500,
  knownAtMs: 2500,
  limit: 10,
};
const sourceRequest: SourceSnapshotRequest = {
  ...snapshot,
  source: {
    deviceAssetId: 'gateway-1',
    endpointId: 'can-primary',
    signalId: 'bus.voltage',
  },
};

describe('live semantic metadata boundary', () => {
  test('projects exact asset details and pinned definitions from backend examples', async () => {
    expect(
      await setup(asset).reader.getAsset({
        tenantId: 'tenant-a',
        assetId: 'asset-1',
      }),
    ).toMatchObject({
      tenantId: 'tenant-a',
      assetType: { id: 'generic.machine', version: 1 },
      externalIdentifiers: [
        {
          kind: 'manufacturer.serial-number',
          authority: 'maker-a',
          value: 'SN-100',
        },
      ],
    });
    expect(
      await setup(assetType).reader.getAssetType({
        tenantId: 'tenant-a',
        id: 'generic.power-system',
        version: 2,
      }),
    ).toMatchObject({
      supportedProperties: [
        { id: 'thermal.temperature', version: 1 },
        { id: 'electrical.voltage', version: 3 },
      ],
    });
    expect(
      await setup(property).reader.getProperty({
        tenantId: 'tenant-a',
        id: 'thermal.temperature',
        version: 1,
      }),
    ).toMatchObject({ valueKind: 'decimal', canonicalUnit: 'Cel' });
    expect(
      await setup(relationshipType).reader.getRelationshipType({
        tenantId: 'tenant-a',
        id: 'generic.tows',
        version: 2,
      }),
    ).toMatchObject({ name: 'Tows' });
  });

  test('keeps relationship scope, both clocks, revisions and exclusive intervals distinct', async () => {
    const { reader, fetch } = setup(relationships);
    const result = await reader.listRelationships(snapshot);
    expect(result).toMatchObject({
      assetId: 'assembly-a',
      effectiveAtMs: 1500,
      knownAtMs: 2500,
      nextAfter: null,
      relationships: [
        {
          revision: '1',
          recordedAtMs: 2000,
          effectiveInterval: { startMs: 1000, endMs: 3000 },
        },
      ],
    });
    const url = new URL(String(fetch.mock.calls[0]?.[0]));
    expect(url.searchParams.get('effective_at_ms')).toBe('1500');
    expect(url.searchParams.get('known_at_ms')).toBe('2500');
    expect(url.searchParams.get('limit')).toBe('10');
  });

  test('projects target and exact-source binding pages without inventing an inventory', async () => {
    expect(
      await setup(targetBindings).reader.listTargetBindings({
        ...snapshot,
        assetId: 'power-system-1',
      }),
    ).toMatchObject({
      assetId: 'power-system-1',
      bindings: [
        {
          source: sourceRequest.source,
          target: {
            assetId: 'power-system-1',
            property: { id: 'electrical.voltage', version: 1 },
          },
        },
      ],
    });
    const { reader, fetch } = setup(sourceBindings);
    expect(await reader.listSourceBindings(sourceRequest)).toMatchObject({
      source: sourceRequest.source,
      bindings: [{ revision: '1' }],
    });
    const url = new URL(String(fetch.mock.calls[0]?.[0]));
    expect(url.searchParams.get('device_asset_id')).toBe('gateway-1');
    expect(url.searchParams.get('endpoint_id')).toBe('can-primary');
    expect(url.searchParams.get('signal_id')).toBe('bus.voltage');
  });

  test('rejects tenant substitution and mismatched exact definition versions', async () => {
    await expect(
      setup({ ...asset, tenant_id: 'tenant-b' }).reader.getAsset({
        tenantId: 'tenant-a',
        assetId: 'asset-1',
      }),
    ).rejects.toMatchObject({ kind: 'invalid-response' });
    await expect(
      setup({ ...property, version: 2 }).reader.getProperty({
        tenantId: 'tenant-a',
        id: 'thermal.temperature',
        version: 1,
      }),
    ).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  test.each([
    { ...relationships, effective_at_ms: 1600 },
    { ...relationships, known_at_ms: Number.MAX_SAFE_INTEGER + 1 },
    { ...relationships, asset_id: 'different-asset' },
    { ...relationships, next_after: 'missing-row' },
    { ...relationships, relationships: [], next_after: 'relationship-1' },
  ])(
    'rejects inconsistent returned scope, clocks, and cursors',
    async (body) => {
      await expect(
        setup(body).reader.listRelationships(snapshot),
      ).rejects.toMatchObject({ kind: 'invalid-response' });
    },
  );

  test('preserves a maximum u64 revision and rejects precision or revision overflow', async () => {
    const first = relationships.relationships[0];
    if (!first) throw new Error('contract requires a relationship example');
    const body = {
      ...relationships,
      relationships: [{ ...first, revision: '18446744073709551615' }],
    };
    expect(
      (await setup(body).reader.listRelationships(snapshot)).relationships[0]
        ?.revision,
    ).toBe('18446744073709551615');
    for (const revision of ['18446744073709551616', '0', '01']) {
      await expect(
        setup({
          ...relationships,
          relationships: [{ ...first, revision }],
        }).reader.listRelationships(snapshot),
      ).rejects.toMatchObject({ kind: 'invalid-response' });
    }
    await expect(
      setup({
        ...relationships,
        relationships: [
          { ...first, recorded_at_ms: Number.MAX_SAFE_INTEGER + 1 },
        ],
      }).reader.listRelationships(snapshot),
    ).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  test('rejects rows outside the requested temporal and membership scope', async () => {
    const first = relationships.relationships[0];
    if (!first) throw new Error('contract requires a relationship example');
    for (const row of [
      { ...first, tenant_id: 'tenant-b' },
      { ...first, recorded_at_ms: 2600 },
      {
        ...first,
        source_asset_id: 'other-source',
        target_asset_id: 'other-target',
      },
      { ...first, effective_interval: { start_ms: 1000, end_ms: 1500 } },
    ]) {
      await expect(
        setup({
          ...relationships,
          relationships: [row],
        }).reader.listRelationships(snapshot),
      ).rejects.toMatchObject({ kind: 'invalid-response' });
    }
  });

  test('rejects changed target and exact source tuples even when schemas match', async () => {
    await expect(
      setup(targetBindings).reader.listTargetBindings({
        ...snapshot,
        assetId: 'another-target',
      }),
    ).rejects.toMatchObject({ kind: 'invalid-response' });
    await expect(
      setup(sourceBindings).reader.listSourceBindings({
        ...sourceRequest,
        source: { ...sourceRequest.source, endpointId: 'different-endpoint' },
      }),
    ).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  test('validates unsafe clocks, invalid limits and versions before network access', async () => {
    const { reader, fetch } = setup(relationships);
    await expect(
      reader.listRelationships({
        ...snapshot,
        knownAtMs: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).rejects.toMatchObject({ kind: 'invalid-request' });
    await expect(
      reader.listRelationships({ ...snapshot, limit: 101 }),
    ).rejects.toMatchObject({ kind: 'invalid-request' });
    await expect(
      reader.getProperty({
        tenantId: 'tenant-a',
        id: 'thermal.temperature',
        version: 0,
      }),
    ).rejects.toMatchObject({ kind: 'invalid-request' });
    expect(fetch).not.toHaveBeenCalled();
  });

  test('rejects duplicate or non-advancing page identities without imposing JS collation', async () => {
    const first = relationships.relationships[0];
    if (!first) throw new Error('contract requires a relationship example');
    await expect(
      setup({
        ...relationships,
        relationships: [first, first],
      }).reader.listRelationships(snapshot),
    ).rejects.toMatchObject({ kind: 'invalid-response' });
    await expect(
      setup(relationships).reader.listRelationships({
        ...snapshot,
        after: first.id,
      }),
    ).rejects.toMatchObject({ kind: 'invalid-response' });
  });
});

test('keeps catalogue semantic validation failures in the invalid-response category', async () => {
  const summary = {
    id: 'asset-1',
    tenant_id: 'tenant-b',
    name: 'Other tenant asset',
    asset_type: { id: 'generic.machine', version: 1 },
  };
  await expect(
    setup({ assets: [summary], next_after: null }).reader.listPage({
      tenantId: 'tenant-a',
      limit: 10,
    }),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
  await expect(
    setup({
      assets: [{ ...summary, tenant_id: 'tenant-a' }],
      next_after: 'missing-row',
    }).reader.listPage({ tenantId: 'tenant-a', limit: 10 }),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
});

test('checks every binding against the returned target or exact source scope', async () => {
  const target = targetBindings.bindings[0];
  const source = sourceBindings.bindings[0];
  if (!target || !source) throw new Error('contract requires binding examples');
  await expect(
    setup({
      ...targetBindings,
      bindings: [
        { ...target, target: { ...target.target, asset_id: 'other-target' } },
      ],
    }).reader.listTargetBindings({ ...snapshot, assetId: 'power-system-1' }),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
  await expect(
    setup({
      ...sourceBindings,
      bindings: [
        {
          ...source,
          source: { ...source.source, endpoint_id: 'other-endpoint' },
        },
      ],
    }).reader.listSourceBindings(sourceRequest),
  ).rejects.toMatchObject({ kind: 'invalid-response' });
});

test('lazy fleet composition uses the managed same-origin reader and validates the complete mapping', async () => {
  const { reader, fetch } = setup(observedFleetWire());
  const fleet = reader.fleet;
  if (!fleet) throw new Error('Fleet port missing');
  expect((await fleet.snapshot(fleetRequest)).assets[0]?.location.status).toBe(
    'observed',
  );
  const first = fetch.mock.calls[0];
  if (!first) throw new Error('Expected one request');
  const url = new URL(String(first[0]));
  expect(url.pathname).toBe('/api/v1/tenants/tenant-a/fleet');
  expect(url.searchParams.get('latitude_property')).toBe('position.latitude');
  expect(url.searchParams.get('encoding')).toBe('e7');
  await expect(
    fleet.snapshot({ ...fleetRequest, limit: 100 }),
  ).rejects.toMatchObject({ kind: 'invalid-request' });
  expect(fetch).toHaveBeenCalledTimes(1);
});

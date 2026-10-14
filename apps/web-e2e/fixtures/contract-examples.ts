import { readFileSync } from 'node:fs';
import { Schema } from 'effect';
import * as Wire from '../../web/src/generated/fleetiq-api';

type JsonObject = Record<string, unknown>;
const contract = JSON.parse(
  readFileSync(
    new URL(
      '../../../contracts/http/fleetiq-v1-ui-baseline.openapi.json',
      import.meta.url,
    ),
    'utf8',
  ),
) as JsonObject;

function object(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected a published OpenAPI object');
  }
  return value as JsonObject;
}

/** Resolve only local bundled references; browser fixtures never fetch a spec. */
function resolve(value: unknown): JsonObject {
  const entry = object(value);
  if (typeof entry.$ref !== 'string') return entry;
  if (!entry.$ref.startsWith('#/'))
    throw new Error('Unbundled contract reference');
  let current: unknown = contract;
  for (const part of entry.$ref.slice(2).split('/')) {
    current = object(current)[part.replaceAll('~1', '/').replaceAll('~0', '~')];
  }
  return resolve(current);
}

function example(path: string): unknown {
  const operation = resolve(object(contract.paths)[path]);
  const response = resolve(object(resolve(operation.get).responses)['200']);
  return resolve(object(response.content)['application/json']).example;
}

/** Published examples seed test data; maintained schemas validate every success. */
export const publishedAsset = Schema.decodeUnknownSync(Wire.Asset)(
  example('/api/v1/tenants/{tenant_id}/assets/{asset_id}'),
);
export const publishedType = Schema.decodeUnknownSync(Wire.AssetTypeDefinition)(
  example(
    '/api/v1/tenants/{tenant_id}/asset-types/{type_id}/versions/{version}',
  ),
);
export const publishedProperty = Schema.decodeUnknownSync(
  Wire.PropertyDefinition,
)(
  example(
    '/api/v1/tenants/{tenant_id}/properties/{property_id}/versions/{version}',
  ),
);
export const publishedRelationship = Schema.decodeUnknownSync(
  Wire.RelationshipSnapshot,
)(example('/api/v1/tenants/{tenant_id}/assets/{asset_id}/relationships'))
  .relationships[0];
export const publishedBinding = Schema.decodeUnknownSync(
  Wire.AssetBindingSnapshot,
)(example('/api/v1/tenants/{tenant_id}/assets/{asset_id}/signal-bindings'))
  .bindings[0];
export const publishedRelationshipType = Schema.decodeUnknownSync(
  Wire.RelationshipTypeDefinition,
)(
  example(
    '/api/v1/tenants/{tenant_id}/relationship-types/{type_id}/versions/{version}',
  ),
);

if (!publishedRelationship || !publishedBinding) {
  throw new Error(
    'Published metadata examples must include relationship and binding evidence',
  );
}

export const catalogueRecords = [
  { ...publishedAsset, id: 'asset-1', name: 'Primary machine' },
  { ...publishedAsset, id: 'assembly-a', name: 'Main assembly' },
  {
    ...publishedAsset,
    id: 'gateway-1',
    name: 'Monitoring gateway',
    asset_type: { id: 'generic.gateway', version: 1 },
  },
  {
    ...publishedAsset,
    id: 'power-system-1',
    name: 'Power system',
    asset_type: { id: 'generic.power-system', version: 2 },
  },
] as const;

export const schemas = {
  session: Wire.OperatorSession,
  tenants: Wire.OperatorTenantPage,
  catalogue: Wire.AssetPage,
  asset: Wire.Asset,
  relationships: Wire.RelationshipSnapshot,
  target: Wire.AssetBindingSnapshot,
  source: Wire.SourceBindingSnapshot,
  assetType: Wire.AssetTypeDefinition,
  property: Wire.PropertyDefinition,
  relationshipType: Wire.RelationshipTypeDefinition,
  problem: Wire.Problem,
} as const;
export type ResponseKind = keyof typeof schemas;

export function validatedPayload(kind: ResponseKind, value: unknown): unknown {
  return Schema.decodeUnknownSync(schemas[kind] as Schema.Decoder<unknown>)(
    value,
  );
}

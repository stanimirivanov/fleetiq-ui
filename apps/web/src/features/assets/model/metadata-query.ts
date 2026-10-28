import { isValidAssetIdentifier } from './asset-catalogue';
import { evidenceKeys } from './evidence-query';
import { fleetKeys } from './fleet-query';
import type { SignalSource } from './metadata';

export const snapshotCursorKeys = [
  'relationship_after',
  'target_after',
  'source_after',
] as const;
export const sourceQueryKeys = [
  'device_asset_id',
  'endpoint_id',
  'signal_id',
] as const;

export interface MetadataQuery {
  readonly tenantId: string;
  readonly effectiveAtMs: number;
  readonly knownAtMs: number;
  readonly q: string;
  readonly type: string;
  readonly after?: string;
  readonly assetId?: string;
  readonly bindingId?: string;
  readonly relationshipAfter?: string;
  readonly targetAfter?: string;
  readonly sourceAfter?: string;
  readonly source: SignalSource | null;
}

export type MetadataQueryResult =
  | { readonly kind: 'missing-tenant' }
  | { readonly kind: 'missing-cutoffs' }
  | { readonly kind: 'invalid'; readonly message: string }
  | { readonly kind: 'ready'; readonly query: MetadataQuery };

const identifierKeys = [
  'tenant',
  'after',
  'asset',
  'binding',
  ...snapshotCursorKeys,
  ...sourceQueryKeys,
] as const;
const knownKeys = [
  ...identifierKeys,
  'q',
  'type',
  'effective_at_ms',
  'known_at_ms',
] as const;

/** Reject ambiguous or partial context before any tenant-scoped read starts. */
export function readMetadataQuery(search: string): MetadataQueryResult {
  const params = new URLSearchParams(search);
  if (knownKeys.some((key) => params.getAll(key).length > 1))
    return invalid('URL context contains duplicate parameters.');
  if (
    identifierKeys.some(
      (key) =>
        params.has(key) && !isValidAssetIdentifier(params.get(key) ?? ''),
    )
  )
    return invalid('Tenant, asset, source, or cursor context is invalid.');
  const tenantId = params.get('tenant');
  if (!tenantId) return { kind: 'missing-tenant' };
  const effective = params.get('effective_at_ms');
  const known = params.get('known_at_ms');
  if (effective === null && known === null) return { kind: 'missing-cutoffs' };
  if (!isMilliseconds(effective) || !isMilliseconds(known))
    return invalid('Set both review times to safe integer Unix milliseconds.');
  const q = params.get('q') ?? '';
  const type = params.get('type') ?? '';
  if (
    [...q].length > 200 ||
    /\p{Cc}/u.test(q) ||
    (type !== '' && !isValidAssetIdentifier(type))
  )
    return invalid('Asset filters are invalid.');
  const sourceValues = sourceQueryKeys.map((key) => params.get(key));
  if (
    sourceValues.some((value) => value !== null) &&
    sourceValues.some((value) => value === null)
  )
    return invalid(
      'An exact source requires device, endpoint, and signal identifiers.',
    );
  const source = sourceValues.every((value) => value !== null)
    ? {
        deviceAssetId: sourceValues[0] as string,
        endpointId: sourceValues[1] as string,
        signalId: sourceValues[2] as string,
      }
    : null;
  return {
    kind: 'ready',
    query: {
      tenantId,
      effectiveAtMs: Number(effective),
      knownAtMs: Number(known),
      q,
      type,
      source,
      ...optional('after', params.get('after')),
      ...optional('assetId', params.get('asset')),
      ...optional('bindingId', params.get('binding')),
      ...optional('relationshipAfter', params.get('relationship_after')),
      ...optional('targetAfter', params.get('target_after')),
      ...optional('sourceAfter', params.get('source_after')),
    },
  };
}

/** Preserve review context across routes; only explicit changes alter cursor scopes. */
export function metadataHref(
  path: string,
  search: string,
  changes: Readonly<Record<string, string | null>> = {},
): string {
  const params = new URLSearchParams(search);
  params.delete('preview');
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === '') params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** Changing tenant cannot carry another tenant's selection or pagination evidence. */
export function tenantContextChanges(
  tenantId: string,
): Record<string, string | null> {
  return {
    ...Object.fromEntries(fleetKeys.map((key) => [key, null])),
    tenant: tenantId,
    after: null,
    asset: null,
    binding: null,
    type: null,
    q: null,
    ...clearSnapshotSelection(),
  };
}

export function clearSnapshotSelection(): Record<string, null> {
  return Object.fromEntries(
    [...snapshotCursorKeys, ...sourceQueryKeys, ...evidenceKeys].map((key) => [
      key,
      null,
    ]),
  );
}

export function assetSelectionChanges(
  assetId: string,
): Record<string, string | null> {
  return { asset: assetId, binding: null, ...clearSnapshotSelection() };
}

function invalid(message: string): MetadataQueryResult {
  return { kind: 'invalid', message };
}
function optional<K extends string>(
  key: K,
  value: string | null,
): Partial<Record<K, string>> {
  return value === null ? {} : ({ [key]: value } as Record<K, string>);
}
function isMilliseconds(value: string | null): boolean {
  return (
    value !== null &&
    /^-?(0|[1-9][0-9]*)$/.test(value) &&
    Number.isSafeInteger(Number(value))
  );
}

import { RequestFailure } from '#shared/model';
import {
  type AssetReadOptions,
  isValidAssetIdentifier,
} from './asset-catalogue';
import {
  type AssetRequest,
  isDefinitionVersion,
  type PropertyDefinition,
} from './metadata';

export type EvidenceValue =
  | { readonly kind: 'boolean'; readonly value: boolean }
  | { readonly kind: 'integer' | 'decimal' | 'text'; readonly value: string };
export interface PropertyRequest extends AssetRequest {
  readonly property: PropertyDefinition;
}
export interface HistoryRequest extends PropertyRequest {
  readonly start: string;
  readonly end: string;
  readonly limit: number;
  readonly after?: string;
}
/** Exact strings retain signed i64 times and arbitrary-precision numeric values. */
export interface PropertyEvidence {
  readonly interpretation: string;
  readonly tenantId: string;
  readonly assetId: string;
  readonly propertyId: string;
  readonly propertyVersion: number;
  readonly bindingId: string;
  readonly bindingRevision: string;
  readonly eventTimeBasis: 'device_recorded' | 'received_at';
  readonly eventAt: string;
  readonly effectiveAt: string;
  readonly knownAt: string;
  readonly value: EvidenceValue;
  readonly unit: string | null;
  readonly quality: 'good' | 'uncertain' | 'invalid';
  readonly source: {
    readonly messageId: string;
    readonly packageId: string;
    readonly packageVersion: string;
    readonly outputIndex: number;
    readonly deviceId: string;
    readonly endpointId: string;
    readonly signalId: string;
    readonly recordedAt: string | null;
    readonly receivedAt: string;
  };
}
export interface CurrentProperty {
  readonly generation: string;
  readonly revision: string;
  readonly processedCount: string;
  readonly pending: boolean;
  readonly evaluatedAt: string;
  readonly item: {
    readonly freshness: 'fresh' | 'stale' | 'future';
    readonly change: PropertyEvidence;
  } | null;
}
export interface PropertyHistory {
  readonly changes: readonly PropertyEvidence[];
  readonly nextAfter: string | null;
}
/** Telemetry is independently authorized; metadata success cannot imply value access. */
export interface TelemetryReader {
  current(
    request: PropertyRequest,
    options?: AssetReadOptions,
  ): Promise<CurrentProperty>;
  history(
    request: HistoryRequest,
    options?: AssetReadOptions,
  ): Promise<PropertyHistory>;
  interpretation(
    request: PropertyRequest & { readonly interpretation: string },
    options?: AssetReadOptions,
  ): Promise<PropertyEvidence>;
}
export function isMillis(value: string): boolean {
  return (
    /^-?(0|[1-9][0-9]*)$/.test(value) &&
    value.length <= 20 &&
    BigInt(value) >= -(1n << 63n) &&
    BigInt(value) < 1n << 63n
  );
}
export function isToken(value: string): boolean {
  return value.length <= 8192 && /^v1\.[0-9a-f]+$/.test(value);
}
export function validProperty(request: PropertyRequest): void {
  if (
    ![request.tenantId, request.assetId, request.property.id].every(
      isValidAssetIdentifier,
    ) ||
    !isDefinitionVersion(request.property.version)
  )
    throw new RequestFailure('invalid-request');
}
export function validHistory(request: HistoryRequest): void {
  validProperty(request);
  if (
    !isMillis(request.start) ||
    !isMillis(request.end) ||
    BigInt(request.end) <= BigInt(request.start) ||
    BigInt(request.end) - BigInt(request.start) > 604800000n ||
    !Number.isInteger(request.limit) ||
    request.limit < 1 ||
    request.limit > 100 ||
    (request.after !== undefined && !isToken(request.after))
  )
    throw new RequestFailure('invalid-request');
}
/** Display ISO only inside Date's exact supported range; otherwise retain epoch text. */
export function evidenceTime(value: string): string {
  const n = BigInt(value);
  return n >= -8640000000000000n && n <= 8640000000000000n
    ? new Date(Number(n)).toISOString()
    : `${value} ms since Unix epoch`;
}
export function evidenceValue(value: EvidenceValue): string {
  return String(value.value);
}

import { RequestFailure } from '#shared/model';
import {
  type AssetReadOptions,
  isValidAssetIdentifier,
} from './asset-catalogue';
import { isDefinitionVersion } from './metadata';
import type { SubscribeProperty } from './property-live';

export type {
  CurrentProperty,
  EvidenceValue,
  HistoryRequest,
  PropertyEvidence,
  PropertyHistory,
  PropertyRequest,
} from './property-values';

import type {
  CurrentProperty,
  EvidenceValue,
  HistoryRequest,
  PropertyEvidence,
  PropertyHistory,
  PropertyRequest,
} from './property-values';
/** Telemetry is independently authorized; metadata success cannot imply value access. */
export interface TelemetryReader {
  readonly subscribe?: SubscribeProperty;
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

import type { AssetRequest, PropertyDefinition } from './metadata';
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

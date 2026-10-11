/**
 * Structural, transport-neutral contracts for reviewing a modeled asset graph.
 *
 * A registry scene is a bounded set of recorded facts and a separately declared
 * source inventory. It is not a tree: directed edges, multiple parents, cycles,
 * and missing references remain visible in the snapshot.
 */
export interface RegistryReviewCutoffs {
  /** Physical time at which relationships and bindings are evaluated. */
  readonly effectiveAtMs: number;
  /** Inclusive cutoff for revisions recorded by FleetIQ. */
  readonly knownAtMs: number;
}

export interface RegistryNode {
  readonly id: string;
  readonly label: string;
  readonly kind: 'asset' | 'component' | 'device';
  readonly typeLabel: string;
}

export interface RegistryEffectiveInterval {
  readonly startMs: number;
  /** Exclusive end; null leaves the interval open. */
  readonly endMs: number | null;
}

export interface RegistryRelationshipRevision {
  readonly id: string;
  /** Decimal text preserves the backend's unsigned revision range. */
  readonly revision: string;
  readonly recordedAtMs: number;
  readonly relationshipType: {
    readonly id: string;
    readonly version: number;
  };
  readonly sourceAssetId: string;
  readonly targetAssetId: string;
  readonly effectiveInterval: RegistryEffectiveInterval;
}

export interface RegistrySourceIdentity {
  readonly deviceAssetId: string;
  readonly endpointId: string;
  readonly signalId: string;
}

export interface RegistryBindingRevision {
  readonly id: string;
  /** Decimal text preserves the backend's unsigned revision range. */
  readonly revision: string;
  readonly recordedAtMs: number;
  readonly source: RegistrySourceIdentity;
  readonly target: {
    readonly assetId: string;
    readonly property: {
      readonly id: string;
      readonly version: number;
    };
  };
  readonly effectiveInterval: RegistryEffectiveInterval;
}

export interface RegistryDeviceEndpoint {
  readonly deviceAssetId: string;
  readonly id: string;
  readonly kind: string;
  readonly name: string;
}

export interface RegistryObservation {
  readonly eventAtMs: number;
  readonly receivedAtMs: number;
}

/**
 * A source inventory is independent of its bindings. A declared source with no
 * observation is not an unassigned observed signal.
 */
export interface RegistrySourceInventoryItem {
  readonly id: string;
  readonly label: string;
  readonly source: RegistrySourceIdentity;
  readonly observation: RegistryObservation | null;
}

/**
 * "Complete" is scoped only to this modeled sample scene. It never establishes
 * that the production platform has enumerated every decoder source.
 */
export type RegistryInventoryCoverage = 'complete' | 'partial';

export interface RegistryReviewScene {
  readonly source: 'sample';
  readonly tenantId: string;
  readonly rootAssetId: string;
  readonly asOfMs: number;
  readonly defaultCutoffs: RegistryReviewCutoffs;
  readonly nodes: readonly RegistryNode[];
  readonly relationshipRevisions: readonly RegistryRelationshipRevision[];
  readonly bindingRevisions: readonly RegistryBindingRevision[];
  readonly sourceInventory: readonly RegistrySourceInventoryItem[];
  readonly deviceEndpoints: readonly RegistryDeviceEndpoint[];
  readonly inventoryCoverage: RegistryInventoryCoverage;
}

export type RegistrySourceState =
  | 'mapped'
  | 'unassigned'
  | 'ambiguous'
  | 'not-assessed';

export type RegistryEndpointState =
  | 'registered'
  | 'missing-device'
  | 'undeclared-endpoint';

export interface RegistrySourceReview {
  readonly id: string;
  readonly label: string;
  /** URL-safe stable key for the complete device/endpoint/signal tuple. */
  readonly key: string;
  readonly source: RegistrySourceIdentity;
  /** Whether this source is present in the modeled decoder inventory. */
  readonly inventoried: boolean;
  /** Observation visible at both cutoffs, or null. */
  readonly observation: RegistryObservation | null;
  readonly state: RegistrySourceState;
  readonly endpointState: RegistryEndpointState;
  /** Every effective candidate; ambiguity is never resolved by row order. */
  readonly candidateBindings: readonly RegistryBindingRevision[];
}

export interface RegistryReviewSnapshot {
  readonly effectiveAtMs: number;
  readonly knownAtMs: number;
  readonly nodes: readonly RegistryNode[];
  /** Current effective revisions, preserving direction and every edge. */
  readonly relationships: readonly RegistryRelationshipRevision[];
  readonly bindings: readonly RegistryBindingRevision[];
  readonly sourceReviews: readonly RegistrySourceReview[];
  /** References absent from the bounded modeled node set. */
  readonly missingNodeIds: readonly string[];
  readonly inventoryCoverage: RegistryInventoryCoverage;
}

export type RegistryCutoffRead =
  | { readonly status: 'valid'; readonly cutoffs: RegistryReviewCutoffs }
  | { readonly status: 'missing' }
  | { readonly status: 'invalid'; readonly reason: string };

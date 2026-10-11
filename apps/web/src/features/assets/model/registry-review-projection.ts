import type {
  RegistryBindingRevision,
  RegistryEffectiveInterval,
  RegistryEndpointState,
  RegistryRelationshipRevision,
  RegistryReviewCutoffs,
  RegistryReviewScene,
  RegistryReviewSnapshot,
  RegistrySourceIdentity,
  RegistrySourceInventoryItem,
  RegistrySourceReview,
  RegistrySourceState,
} from './registry-review-types';

/** Preserves the complete source tuple in a URL-safe, collision-free key. */
export function registrySourceKey(source: RegistrySourceIdentity): string {
  return [source.deviceAssetId, source.endpointId, source.signalId]
    .map(encodeURIComponent)
    .join('|');
}

interface RecordedRevision {
  readonly id: string;
  readonly revision: string;
  readonly recordedAtMs: number;
  readonly effectiveInterval: RegistryEffectiveInterval;
}

/**
 * Choose the latest revision known for every stable identity before applying
 * effective-time, source, target, or graph filters. A correction may move a
 * binding or edge away from its previous source or target.
 */
function latestEffectiveRevisions<T extends RecordedRevision>(
  facts: readonly T[],
  cutoffs: RegistryReviewCutoffs,
): T[] {
  const latest = new Map<string, T>();
  for (const fact of facts) {
    if (fact.recordedAtMs > cutoffs.knownAtMs) continue;
    const prior = latest.get(fact.id);
    if (!prior || BigInt(fact.revision) > BigInt(prior.revision)) {
      latest.set(fact.id, fact);
    }
  }
  return [...latest.values()]
    .filter(
      (fact) =>
        fact.effectiveInterval.startMs <= cutoffs.effectiveAtMs &&
        (fact.effectiveInterval.endMs === null ||
          cutoffs.effectiveAtMs < fact.effectiveInterval.endMs),
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

function endpointState(
  scene: RegistryReviewScene,
  source: RegistrySourceIdentity,
): RegistryEndpointState {
  const device = scene.nodes.find(
    (node) => node.id === source.deviceAssetId && node.kind === 'device',
  );
  if (!device) return 'missing-device';
  return scene.deviceEndpoints.some(
    (endpoint) =>
      endpoint.deviceAssetId === source.deviceAssetId &&
      endpoint.id === source.endpointId,
  )
    ? 'registered'
    : 'undeclared-endpoint';
}

function visibleObservation(
  item: RegistrySourceInventoryItem | undefined,
  cutoffs: RegistryReviewCutoffs,
) {
  const observation = item?.observation;
  if (
    !observation ||
    observation.eventAtMs > cutoffs.effectiveAtMs ||
    observation.receivedAtMs > cutoffs.knownAtMs
  ) {
    return null;
  }
  return observation;
}

function sourceState(
  observed: boolean,
  candidateCount: number,
  coverage: RegistryReviewScene['inventoryCoverage'],
): RegistrySourceState {
  if (candidateCount > 1) return 'ambiguous';
  if (candidateCount === 1) return 'mapped';
  if (observed && coverage === 'complete') return 'unassigned';
  return 'not-assessed';
}

function reviewSources(
  scene: RegistryReviewScene,
  cutoffs: RegistryReviewCutoffs,
  bindings: readonly RegistryBindingRevision[],
): RegistrySourceReview[] {
  const inventoried = new Map<string, RegistrySourceInventoryItem>();
  for (const item of scene.sourceInventory) {
    const key = registrySourceKey(item.source);
    if (inventoried.has(key)) {
      throw new Error('duplicate source inventory identity');
    }
    inventoried.set(key, item);
  }

  const candidatesBySource = new Map<string, RegistryBindingRevision[]>();
  const sources = new Map<string, RegistrySourceIdentity>();
  for (const item of scene.sourceInventory) {
    sources.set(registrySourceKey(item.source), item.source);
  }
  for (const binding of bindings) {
    const key = registrySourceKey(binding.source);
    sources.set(key, binding.source);
    const candidates = candidatesBySource.get(key) ?? [];
    candidates.push(binding);
    candidatesBySource.set(key, candidates);
  }

  return [...sources]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, source]) => {
      const item = inventoried.get(key);
      const observation = visibleObservation(item, cutoffs);
      const candidateBindings = candidatesBySource.get(key) ?? [];
      return {
        id: item?.id ?? key,
        label: item?.label ?? source.signalId,
        key,
        source,
        inventoried: item !== undefined,
        observation,
        state: sourceState(
          observation !== null,
          candidateBindings.length,
          scene.inventoryCoverage,
        ),
        endpointState: endpointState(scene, source),
        candidateBindings,
      };
    });
}

function missingNodeIds(
  scene: RegistryReviewScene,
  relationships: readonly RegistryRelationshipRevision[],
  bindings: readonly RegistryBindingRevision[],
): string[] {
  const known = new Set(scene.nodes.map((node) => node.id));
  const referenced = new Set<string>();
  for (const relation of relationships) {
    referenced.add(relation.sourceAssetId);
    referenced.add(relation.targetAssetId);
  }
  for (const binding of bindings) {
    referenced.add(binding.source.deviceAssetId);
    referenced.add(binding.target.assetId);
  }
  for (const item of scene.sourceInventory) {
    referenced.add(item.source.deviceAssetId);
  }
  return [...referenced].filter((id) => !known.has(id)).sort();
}

/**
 * Builds a bitemporal, read-only review from recorded metadata and a separately
 * declared source inventory. Empty collections mean empty within this modeled
 * scene and cutoff, never an asserted fleet-wide absence.
 */
export function projectRegistrySnapshot(
  scene: RegistryReviewScene,
  cutoffs: RegistryReviewCutoffs,
): RegistryReviewSnapshot {
  if (
    !Number.isSafeInteger(cutoffs.effectiveAtMs) ||
    !Number.isSafeInteger(cutoffs.knownAtMs)
  ) {
    throw new RangeError('registry cutoffs must be safe integer milliseconds');
  }
  const relationships = latestEffectiveRevisions(
    scene.relationshipRevisions,
    cutoffs,
  );
  const bindings = latestEffectiveRevisions(scene.bindingRevisions, cutoffs);
  return {
    effectiveAtMs: cutoffs.effectiveAtMs,
    knownAtMs: cutoffs.knownAtMs,
    nodes: scene.nodes,
    relationships,
    bindings,
    sourceReviews: reviewSources(scene, cutoffs, bindings),
    missingNodeIds: missingNodeIds(scene, relationships, bindings),
    inventoryCoverage: scene.inventoryCoverage,
  };
}

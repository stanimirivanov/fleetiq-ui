/** Existing production owners; register a real new owner before it can bypass scanning. */
export const PRODUCTION_OWNERS = Object.freeze(['apps/web/src']);
export const REQUIRED_BOUNDARY_RULES = Object.freeze([
  'model-browser-global',
  'raw-browser-transport',
  'network-client-import',
  'unmanaged-effect-execution',
]);
/**
 * Exact-file privileges. An execution allowance never grants transport permission.
 * Generated clients are separately checked by the contract/provenance sensor.
 */
export const BOUNDARY_POLICY = Object.freeze({
  owners: PRODUCTION_OWNERS,
  rules: REQUIRED_BOUNDARY_RULES,
  adapters: Object.freeze([
    Object.freeze({
      file: 'apps/web/src/features/assets/api/maplibre-adapter.ts',
      owner: 'assets geographic renderer lifecycle',
      rationale:
        'Owns one local worker, a bounded public style read and same-origin deployment map resources with cancellable SDK lifecycle.',
      allows: Object.freeze(['network-client-import', 'raw-browser-transport']),
    }),
    Object.freeze({
      file: 'apps/web/src/shared/api/browser-api.ts',
      owner: 'shared managed HTTP runtime',
      rationale:
        'Owns same-origin requests, bounded decoding and runtime disposal.',
      allows: Object.freeze([
        'raw-browser-transport',
        'network-client-import',
        'unmanaged-effect-execution',
      ]),
    }),
    Object.freeze({
      file: 'apps/web/src/features/assets/api/sample-live-signal-service.ts',
      owner: 'assets synthetic playback lifecycle',
      rationale:
        'Owns a finite joined fiber with AbortController cancellation; no network.',
      allows: Object.freeze(['unmanaged-effect-execution']),
    }),
    Object.freeze({
      file: 'apps/web/src/generated/fleetiq-api.ts',
      owner: 'backend-pinned generated client',
      rationale:
        'Exact generated output verified by contract and generation checks.',
      allows: Object.freeze(['network-client-import']),
    }),
  ]),
});

/** Test-only paths must never supply a production dependency, even only a type. */
export function isTestSource(file) {
  return /(?:^|\/)(?:__tests__|tests?|fixtures|test-results)(?:\/|$)|(?:^|\/)apps\/web-e2e(?:\/|$)|[.](?:test|spec)[.][cm]?[jt]sx?$/u.test(
    file,
  );
}

export function isModelSource(file) {
  return (
    /(?:^|\/)features\/[^/]+\/model\/|(?:^|\/)shared\/model\//u.test(file) &&
    !isTestSource(file)
  );
}

/** Refuse policy omissions instead of treating disabled checks as clean evidence. */
export function assertBoundaryPolicy(policy) {
  if (
    !policy ||
    !Array.isArray(policy.owners) ||
    !policy.owners.length ||
    !Array.isArray(policy.rules) ||
    REQUIRED_BOUNDARY_RULES.some((rule) => !policy.rules.includes(rule)) ||
    policy.rules.some((rule) => !REQUIRED_BOUNDARY_RULES.includes(rule)) ||
    !Array.isArray(policy.adapters)
  ) {
    throw new Error(
      'Browser boundary policy is incomplete; every mandatory rule must remain enabled.',
    );
  }
  const seen = new Set();
  for (const entry of policy.adapters) {
    if (
      !entry ||
      typeof entry.file !== 'string' ||
      !policy.owners.some((owner) => entry.file.startsWith(`${owner}/`)) ||
      !entry.owner?.trim() ||
      !entry.rationale?.trim() ||
      !Array.isArray(entry.allows) ||
      !entry.allows.length ||
      entry.allows.some((rule) => !REQUIRED_BOUNDARY_RULES.includes(rule)) ||
      seen.has(entry.file) ||
      isModelSource(entry.file) ||
      isTestSource(entry.file)
    ) {
      throw new Error(
        'Browser adapter privileges require one exact production file, owner and rationale.',
      );
    }
    seen.add(entry.file);
  }
}

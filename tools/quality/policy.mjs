import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export const qualityPolicy = JSON.parse(
  readFileSync(new URL('./policy.json', import.meta.url), 'utf8'),
);
export const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
/** Small seeded rendering envelope; never a live-fleet capacity claim. */
export function assessPerformance(
  samples,
  resources,
  limits = qualityPolicy.performance,
) {
  if (
    ![
      'navigationMs',
      'filterMs',
      'heapGrowthBytes',
      'nodeGrowth',
      'samples',
    ].every((key) => Number.isSafeInteger(limits[key]) && limits[key] > 0)
  )
    throw new Error('Performance limits are incomplete.');
  if (
    !Array.isArray(samples) ||
    samples.length !== limits.samples ||
    Array.from(samples).some(
      (s) =>
        !s ||
        !Number.isFinite(s.navigationMs) ||
        s.navigationMs < 0 ||
        !Number.isFinite(s.filterMs) ||
        s.filterMs < 0,
    )
  )
    throw new Error('Performance samples are incomplete or malformed.');
  if (
    !resources ||
    !['heapBefore', 'heapAfter', 'nodesBefore', 'nodesAfter'].every(
      (key) => Number.isFinite(resources[key]) && resources[key] > 0,
    )
  )
    throw new Error('Resource measurements are unavailable.');
  if (
    samples.some(
      (s) =>
        s.navigationMs > limits.navigationMs || s.filterMs > limits.filterMs,
    )
  )
    throw new Error(
      'Measured browser interaction exceeds the calibrated limit.',
    );
  if (
    resources.heapAfter - resources.heapBefore > limits.heapGrowthBytes ||
    resources.nodesAfter - resources.nodesBefore > limits.nodeGrowth
  )
    throw new Error(
      'Post-GC browser resource growth exceeds the calibrated limit.',
    );
  return {
    passed: true,
    maxNavigationMs: Math.max(...samples.map((s) => s.navigationMs)),
    maxFilterMs: Math.max(...samples.map((s) => s.filterMs)),
  };
}
export function requireNoPageErrors(count) {
  if (!Number.isSafeInteger(count) || count !== 0)
    throw new Error('Unexpected browser page error (details redacted).');
}

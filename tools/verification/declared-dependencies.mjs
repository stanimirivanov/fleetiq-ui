import { fileURLToPath } from 'node:url';
import {
  readReviewedDependencies,
  validateReviewedDependencies,
} from './reviewed-dependencies.mjs';
import { reviewUpgrades } from './upgrades.mjs';

/** Only coordinated npm patch/minor upgrades bypass the separate version-review step. */
export function isMaintenanceInventory(inventory, baseline) {
  const version = (value) =>
    typeof value === 'string' &&
    value.length <= 64 &&
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(value);
  return Boolean(
    inventory?.status === 'review-required' &&
      Array.isArray(inventory.issues) &&
      inventory.issues.length === 0 &&
      Array.isArray(inventory.changes) &&
      inventory.changes.length > 0 &&
      inventory.changes.length <= 64 &&
      new Set(inventory.changes.map((change) => change?.role)).size ===
        inventory.changes.length &&
      inventory.changes.every((change) => {
        if (
          !Object.hasOwn(baseline.tools, change?.role) ||
          change.reviewed !== baseline.tools[change.role] ||
          !version(change.proposed)
        )
          return false;
        const before = change.reviewed.split('.').map(Number);
        const after = change.proposed.split('.').map(Number);
        return (
          after[0] === before[0] &&
          (after[1] > before[1] ||
            (after[1] === before[1] && after[2] > before[2]))
        );
      }),
  );
}

/** Exact package declarations own executable maintenance versions; major changes keep review. */
export function deriveDeclaredDependencies(baseline, inventory) {
  if (
    !inventory ||
    !['current', 'review-required'].includes(inventory.status) ||
    !Array.isArray(inventory.issues) ||
    inventory.issues.length !== 0 ||
    !Array.isArray(inventory.changes) ||
    inventory.changes.length > 64
  )
    throw new Error('Dependency declarations are inconsistent or unavailable.');
  const declared = structuredClone(validateReviewedDependencies(baseline));
  if (inventory.status === 'current') {
    if (inventory.changes.length !== 0)
      throw new Error('Inconsistent dependency inventory.');
    return validateReviewedDependencies(declared);
  }
  if (!isMaintenanceInventory(inventory, declared))
    return validateReviewedDependencies(declared);
  for (const change of inventory.changes) {
    declared.tools[change.role] = change.proposed;
  }
  return validateReviewedDependencies(declared);
}

export function declaredDependencies(
  root = fileURLToPath(new URL('../../', import.meta.url)),
) {
  return deriveDeclaredDependencies(
    readReviewedDependencies(root),
    reviewUpgrades(root),
  );
}

export const DECLARED = declaredDependencies();

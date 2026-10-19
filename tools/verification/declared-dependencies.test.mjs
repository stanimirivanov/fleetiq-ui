import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deriveDeclaredDependencies,
  isMaintenanceInventory,
} from './declared-dependencies.mjs';
import {
  qualifiedDependencyInventory,
  REVIEWED,
} from './reviewed-dependencies.mjs';

const proposal = (proposed, role = 'vite') => ({
  status: 'review-required',
  issues: [],
  changes: [{ role, reviewed: REVIEWED.tools[role], proposed }],
});

test('exact coordinated patch/minor tools execute without changing the review baseline', () => {
  const [major, minor, patch] = REVIEWED.tools.vite.split('.').map(Number);
  for (const next of [
    `${major}.${minor}.${patch + 1}`,
    `${major}.${minor + 1}.0`,
  ]) {
    const inventory = proposal(next);
    assert.equal(isMaintenanceInventory(inventory, REVIEWED), true);
    assert.equal(
      deriveDeclaredDependencies(REVIEWED, inventory).tools.vite,
      next,
    );
    assert.notEqual(REVIEWED.tools.vite, next);
  }
});

test('major, downgraded, floating, action and runtime proposals retain explicit review', () => {
  const [major] = REVIEWED.tools.vite.split('.').map(Number);
  for (const inventory of [
    proposal(`${major + 1}.0.0`),
    proposal('0.0.0'),
    proposal('^8.0.0'),
    proposal('v8', 'action:checkout'),
    proposal(25, 'nodeMajor'),
  ]) {
    assert.equal(isMaintenanceInventory(inventory, REVIEWED), false);
    assert.deepEqual(deriveDeclaredDependencies(REVIEWED, inventory), REVIEWED);
  }
  assert.throws(() =>
    deriveDeclaredDependencies(REVIEWED, {
      status: 'blocked',
      changes: [],
      issues: [{}],
    }),
  );
});

test('publication accepts only complete deterministic maintenance inventories', () => {
  assert.equal(
    qualifiedDependencyInventory({ status: 'declared', changes: 2, issues: 0 }),
    true,
  );
  for (const value of [
    null,
    { status: 'declared', changes: 0, issues: 0 },
    { status: 'declared', changes: 1, issues: 1 },
    { status: 'review-required', changes: 1, issues: 0 },
  ])
    assert.equal(qualifiedDependencyInventory(value), false);
});

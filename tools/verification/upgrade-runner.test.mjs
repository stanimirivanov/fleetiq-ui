import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { temporary } from '../security/owned.mjs';
import { GROUPS, REQUIRED_SCRIPTS } from './catalogue.mjs';
import { DECLARED } from './declared-dependencies.mjs';
import {
  qualifiedDependencyInventory,
  REVIEWED,
} from './reviewed-dependencies.mjs';
import { verify } from './runner.mjs';
import { reviewUpgrades } from './upgrades.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const source = {
  revision: 'a'.repeat(40),
  dirty: true,
  digest: 'b'.repeat(64),
  files: 7,
};
const ready = () => ({
  tools: {
    node: `v${REVIEWED.nodeMajor}.0.0`,
    pnpm: REVIEWED.pnpm,
    git: 'fixture',
  },
  blocker: null,
  launcher: { command: 'fixture', args: [] },
});
const base = {
  snapshot: () => source,
  qualify: ready,
  review: () => ({ status: 'current', changes: [], issues: [] }),
  installed: () => [],
  persist: () => 'fixture-evidence.json',
  execute: async () => ({ status: 'passed', reason: null, exitCode: 0 }),
};
const manifest = { scripts: REQUIRED_SCRIPTS };

test('major upgrades retain review and actual failures still reject maintenance upgrades', async () => {
  const [major, minor, patch] = REVIEWED.tools.vite.split('.').map(Number);
  const inventory = (proposed) => ({
    status: 'review-required',
    issues: [],
    changes: [{ role: 'vite', reviewed: REVIEWED.tools.vite, proposed }],
  });
  const majorResult = await verify('fixture', manifest, 'product', {
    ...base,
    review: () => inventory(`${major + 1}.0.0`),
    execute: () => assert.fail('Major upgrades must retain explicit review.'),
  });
  assert.equal(majorResult.report.blocker, 'dependency-review-required');
  const failed = await verify('fixture', manifest, 'product', {
    ...base,
    review: () => inventory(`${major}.${minor}.${patch + 1}`),
    execute: async () => ({
      status: 'failed',
      reason: 'command-failed',
      exitCode: 1,
    }),
  });
  assert.equal(failed.report.completePass, false);
  assert.equal(failed.report.checks[0].status, 'failed');
});

function candidate(context) {
  const owned = temporary('fleetiq-upgrade-runner-');
  context.after(() => owned.dispose());
  for (const file of [
    'package.json',
    'apps/web/package.json',
    'apps/web-e2e/package.json',
    'pnpm-workspace.yaml',
    '.github/workflows/quality.yml',
    '.github/workflows/user-guide.yml',
    'tools/verification/reviewed-dependencies.json',
  ]) {
    const target = path.join(owned.root, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(path.join(repository, file)));
  }
  const [major, minor, patch] = DECLARED.tools.vite.split('.');
  const next = `${major}.${minor}.${BigInt(patch) + 1n}`;
  for (const file of ['package.json', 'apps/web/package.json']) {
    const target = path.join(owned.root, file);
    const value = JSON.parse(readFileSync(target, 'utf8'));
    value.devDependencies.vite = next;
    writeFileSync(target, JSON.stringify(value));
  }
  return owned.root;
}
test('every canonical group executes a real coordinated maintenance upgrade', async (context) => {
  const root = candidate(context);
  const proposed = JSON.parse(
    readFileSync(path.join(root, 'package.json'), 'utf8'),
  );
  for (const group of Object.keys(GROUPS)) {
    const { report } = await verify(root, proposed, group, {
      snapshot: base.snapshot,
      persist: base.persist,
      qualify: base.qualify,
      installed: base.installed,
      execute: base.execute,
    });
    assert.equal(report.blocker, null);
    assert.deepEqual(report.dependencyReview, {
      status: 'declared',
      changes: reviewUpgrades(root).changes.length,
      issues: 0,
    });
    assert.equal(report.completePass, true);
    assert.ok(
      report.checks.every(
        (entry) => entry.status === 'passed' && entry.reason === null,
      ),
    );
    assert.equal(
      JSON.stringify(report).includes(proposed.devDependencies.vite),
      false,
    );
  }
});
for (const inventory of [
  null,
  { status: 'current', changes: [{}], issues: [] },
  { status: 'current', changes: [], issues: [{}] },
  { status: 'review-required', changes: [], issues: [] },
  { status: 'unknown', changes: [], issues: [] },
  { status: 'blocked', changes: [], issues: [] },
  {
    status: 'blocked',
    changes: [],
    issues: Array.from({ length: 65 }, () => ({})),
  },
]) {
  test('malformed or contradictory preflight cannot create acceptance', async () => {
    const { report } = await verify('fixture', manifest, 'product', {
      ...base,
      review: () => inventory,
      qualify: () => assert.fail('Malformed review cannot launch tools.'),
      execute: () => assert.fail('Malformed review cannot run tests.'),
    });
    assert.equal(report.blocker, 'dependency-inventory-invalid');
    assert.equal(report.completePass, false);
  });
}
for (const installed of [
  () => [{ role: 'vite', code: 'installed-pin-mismatch' }],
  () => null,
  () => {
    throw new Error('private-value');
  },
]) {
  test('stale or unavailable installed tools stop checks without exposing source payload', async () => {
    const { report } = await verify('fixture', manifest, 'browser', {
      ...base,
      installed,
      execute: () => assert.fail('Unqualified installs cannot run checks.'),
    });
    assert.equal(report.blocker, 'reviewed-tools-unavailable');
    assert.equal(report.completePass, false);
    assert.equal(report.installedTools.status, 'blocked');
    assert.equal(JSON.stringify(report).includes('private-value'), false);
    assert.ok(
      report.checks.every(
        (entry) => entry.reason === 'reviewed-tools-unavailable',
      ),
    );
  });
}
test('the actual current inventory and install unlock normal canonical execution', async () => {
  const current = JSON.parse(
    readFileSync(path.join(repository, 'package.json'), 'utf8'),
  );
  const { report } = await verify(repository, current, 'product', {
    snapshot: base.snapshot,
    qualify: ready,
    persist: base.persist,
    execute: base.execute,
  });
  assert.equal(report.completePass, true);
  assert.equal(qualifiedDependencyInventory(report.dependencyReview), true);
  assert.deepEqual(report.installedTools, { status: 'current', issues: 0 });
});

test('installed tool drift after execution cannot be recorded as group acceptance', async () => {
  let snapshots = 0;
  const { report } = await verify('fixture', manifest, 'product', {
    ...base,
    installed: () =>
      snapshots++ === 0
        ? []
        : [{ role: 'vite', code: 'installed-pin-mismatch' }],
  });
  assert.equal(snapshots, 2);
  assert.equal(report.blocker, 'reviewed-tools-changed');
  assert.equal(report.installedTools.status, 'blocked');
  assert.equal(report.completePass, false);
  assert.ok(report.checks.every((entry) => entry.status === 'passed'));
});

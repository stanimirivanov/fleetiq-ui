import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { ownedFixture } from '../sensors/fixtures.mjs';
import { auditSnapshot, evaluateAudit } from './advisories.mjs';
import { DEFAULT_POLICY } from './policy.mjs';

const clean = () => ({
  advisories: {},
  metadata: {
    vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 },
  },
});
const advisory = () => {
  const report = clean();
  report.advisories['1'] = {
    github_advisory_id: 'GHSA-aaaa-bbbb-cccc',
    module_name: 'example',
    severity: 'high',
    findings: [{ version: '1.0.0', paths: ['app>example'] }],
  };
  report.metadata.vulnerabilities.high = 1;
  return report;
};
test('complete clean registry response qualifies', () =>
  assert.deepEqual(evaluateAudit(clean(), DEFAULT_POLICY), {
    advisories: 0,
    excepted: 0,
  }));
test('new advisory is rejected, with bounded identity only', () => {
  const report = advisory();
  report.advisories['1'].title = 'private payload';
  report.advisories['1'].url = 'https://private.invalid';
  assert.throws(
    () => evaluateAudit(report, DEFAULT_POLICY, 1),
    (error) =>
      !error.message.includes('private') &&
      error.message.includes('GHSA-aaaa-bbbb-cccc'),
  );
});
test('one exact exception does not cover another path or version', () => {
  const policy = structuredClone(DEFAULT_POLICY);
  policy.advisoryExceptions = [
    {
      advisory: 'GHSA-aaaa-bbbb-cccc',
      package: 'example',
      version: '1.0.0',
      paths: ['app>example'],
      owner: 'maintainer',
      reason: 'synthetic review',
      expires: '2099-01-01',
    },
  ];
  assert.equal(evaluateAudit(advisory(), policy, 1).excepted, 1);
  const report = advisory();
  report.advisories['1'].findings[0].paths.push('other>example');
  assert.throws(() => evaluateAudit(report, policy, 1));
  report.advisories['1'].findings[0].version = '1.0.1';
  assert.throws(() => evaluateAudit(report, policy, 1));
});
for (const mutate of [
  (report) => {
    delete report.metadata;
  },
  (report) => {
    report.metadata.vulnerabilities.high = 1;
  },
  (report) => {
    report.advisories = [];
  },
])
  test('missing or contradictory response cannot pass', () => {
    const report = clean();
    mutate(report);
    assert.throws(() => evaluateAudit(report, DEFAULT_POLICY));
  });
test('exit status must agree with registry findings', () => {
  assert.throws(() => evaluateAudit(clean(), DEFAULT_POLICY, 1));
  assert.throws(() => evaluateAudit(advisory(), DEFAULT_POLICY, 0));
  assert.throws(() => evaluateAudit(clean(), DEFAULT_POLICY, 127));
});
test('audit snapshot strips broad ignore lists/registry settings and preserves both pnpm12 lock documents', async (context) => {
  const root = await ownedFixture(context);
  const destination = await ownedFixture(context);
  mkdirSync(path.join(root, 'apps/web'), { recursive: true });
  writeFileSync(
    path.join(root, 'package.json'),
    '{"packageManager":"pnpm@12.5.1","pnpm":{"auditConfig":{"ignoreGhsas":["GHSA-aaaa-bbbb-cccc"]}},"publishConfig":{"registry":"https://evil.invalid"},"scripts":{"preaudit":"unsafe"}}',
  );
  writeFileSync(path.join(root, 'apps/web/package.json'), '{"name":"web"}');
  writeFileSync(
    path.join(root, 'pnpm-workspace.yaml'),
    'audit:\n  ignore: [GHSA-aaaa-bbbb-cccc]\nregistry: https://evil.invalid\n',
  );
  const lock =
    "---\nlockfileVersion: '9.0'\nimporters:\n  .: {}\n---\nlockfileVersion: '9.0'\nimporters:\n  .: {}\n  apps/web: {}\n";
  writeFileSync(path.join(root, 'pnpm-lock.yaml'), lock);
  assert.equal(auditSnapshot(root, destination).importers, 2);
  const manifest = JSON.parse(
    readFileSync(path.join(destination, 'package.json'), 'utf8'),
  );
  for (const key of ['pnpm', 'publishConfig', 'scripts'])
    assert.equal(manifest[key], undefined);

  assert.equal(
    readFileSync(path.join(destination, 'pnpm-lock.yaml'), 'utf8'),
    lock,
  );
  const workspace = readFileSync(
    path.join(destination, 'pnpm-workspace.yaml'),
    'utf8',
  );
  assert.ok(!workspace.includes('ignore'));
  assert.ok(!workspace.includes('evil'));
  writeFileSync(
    path.join(root, 'pnpm-lock.yaml'),
    `${lock}\n---\nmalformed: [`,
  );
  assert.throws(() => auditSnapshot(root, destination));
});

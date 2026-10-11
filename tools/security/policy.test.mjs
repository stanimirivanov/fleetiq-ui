import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ownedFixture } from '../sensors/fixtures.mjs';
import {
  DEFAULT_POLICY,
  eventScope,
  policies,
  scanScope,
  validatePolicy,
} from './policy.mjs';
import { git, securityEnvironment } from './process.mjs';

const base = 'a'.repeat(40);
const head = 'b'.repeat(40);
const clone = () => structuredClone(DEFAULT_POLICY);
test('default security policy accepts no silent exception', () =>
  assert.deepEqual(validatePolicy(clone()), DEFAULT_POLICY));
for (const mutate of [
  (policy) => {
    policy.registry = 'http://evil.invalid';
  },
  (policy) => {
    policy.secretExceptions = ['*'];
  },
  (policy) => {
    policy.unknown = true;
  },
])
  test('policy rejects weakened detector/registry/unreviewed shape', () => {
    const policy = clone();
    mutate(policy);
    assert.throws(() => validatePolicy(policy));
  });
test('advisory exceptions are exact owned expiring dependency paths', () => {
  const policy = clone();
  policy.advisoryExceptions.push({
    advisory: 'GHSA-aaaa-bbbb-cccc',
    package: 'example',
    version: '1.0.0',
    paths: ['app>example'],
    owner: 'maintainer',
    reason: 'synthetic reviewed fixture',
    expires: '2099-01-01',
  });
  assert.equal(validatePolicy(policy).advisoryExceptions.length, 1);
  for (const mutate of [
    (value) => {
      value.expires = '2000-01-01';
    },
    (value) => {
      value.paths = ['*'];
    },
    (value) => {
      value.owner = '';
    },
    (value) => {
      value.version = '*';
    },
  ]) {
    const bad = structuredClone(policy);
    mutate(bad.advisoryExceptions[0]);
    assert.throws(() => validatePolicy(bad));
  }
});
test('fork PR event takes base/head revisions, never repository names or shell text', () => {
  assert.deepEqual(
    eventScope(
      'pull_request',
      {
        pull_request: {
          base: { sha: base, repo: { full_name: 'trusted/base' } },
          head: { sha: head, repo: { full_name: 'fork/change' } },
        },
      },
      head,
    ),
    { base, incoming: head, range: `${base}..${head}` },
  );
  assert.throws(() =>
    eventScope(
      'pull_request',
      {
        pull_request: {
          base: { sha: 'HEAD;echo unsafe' },
          head: { sha: head },
        },
      },
      head,
    ),
  );
  assert.throws(() => eventScope('pull_request', {}, head));
});
test('push requires exact publication revision and initial push scans all history', () => {
  assert.equal(
    eventScope('push', { before: base, after: head }, head).range,
    `${base}..${head}`,
  );
  assert.equal(
    eventScope('push', { before: '0'.repeat(40), after: head }, head).range,
    '--all',
  );
  assert.throws(() => eventScope('push', { before: base, after: base }, head));
});
test('manual/local verification includes history and unsupported CI cannot pass', () => {
  assert.equal(eventScope(undefined, undefined, head).range, '--all');
  assert.equal(
    eventScope(
      'workflow_dispatch',
      { ref: 'refs/heads/main', repository: { full_name: 'owner/repo' } },
      head,
      { repository: 'owner/repo' },
    ).range,
    '--all',
  );
  assert.throws(() => eventScope('pull_request_target', {}, head));
});
test('private tool and Git redirection environment is excluded', () => {
  const env = securityEnvironment({
    PATH: 'safe',
    GITLEAKS_CONFIG: 'evil',
    npm_config_registry: 'evil',
    PNPM_HOME: 'evil',
    GIT_DIR: 'evil',
  });
  assert.equal(env.PATH, 'safe');
  for (const name of [
    'GITLEAKS_CONFIG',
    'npm_config_registry',
    'PNPM_HOME',
    'GIT_DIR',
  ])
    assert.equal(env[name], undefined);
});
test('trusted base policy cannot be replaced by incoming exact exceptions', async (context) => {
  const root = await ownedFixture(context);
  git(root, ['init', '--quiet']);
  git(root, ['config', 'user.email', 'fixture@example.invalid']);
  git(root, ['config', 'user.name', 'Fixture']);
  const { mkdirSync } = await import('node:fs');
  mkdirSync(path.join(root, 'tools/security'), { recursive: true });
  writeFileSync(
    path.join(root, 'tools/security/policy.json'),
    JSON.stringify(clone()),
  );
  git(root, ['add', '.']);
  git(root, ['commit', '--quiet', '-m', 'base']);
  const baseCommit = git(root, ['rev-parse', 'HEAD']).trim();
  const changed = clone();
  changed.advisoryExceptions = [
    {
      advisory: 'GHSA-aaaa-bbbb-cccc',
      package: 'example',
      version: '1.0.0',
      paths: ['app>example'],
      owner: 'maintainer',
      reason: 'incoming fixture',
      expires: '2099-01-01',
    },
  ];
  writeFileSync(
    path.join(root, 'tools/security/policy.json'),
    JSON.stringify(changed),
  );
  git(root, ['add', '.']);
  git(root, ['commit', '--quiet', '-m', 'incoming']);
  const incoming = git(root, ['rev-parse', 'HEAD']).trim();
  const scope = scanScope(root, {
    environment: { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'pull_request' },
    event: {
      pull_request: { base: { sha: baseCommit }, head: { sha: incoming } },
    },
  });
  const selected = policies(root, scope);
  assert.equal(selected[0].advisoryExceptions.length, 1);
  assert.equal(selected[1].advisoryExceptions.length, 0);
  assert.throws(() =>
    scanScope(root, {
      environment: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'pull_request',
      },
      event: {
        pull_request: {
          base: { sha: 'f'.repeat(40) },
          head: { sha: incoming },
        },
      },
    }),
  );
});

test('public identifier review cannot broaden a file/rule allowance or survive expiry', () => {
  const policy = clone();
  assert.equal(policy.secretExceptions.length, 1);
  for (const mutate of [
    (entry) => {
      entry.path = '*';
    },
    (entry) => {
      entry.rule = '*';
    },
    (entry) => {
      entry.value = '';
    },
    (entry) => {
      entry.owner = '';
    },
    (entry) => {
      entry.expires = '2000-01-01';
    },
  ]) {
    const changed = clone();
    mutate(changed.secretExceptions[0]);
    assert.throws(() => validatePolicy(changed));
  }
  assert.throws(() => validatePolicy(policy, '2027-01-12'));
});
test('automatic guide event must be successful same-repo main push at exact SHA', () => {
  const event = {
    repository: { full_name: 'owner/repo' },
    workflow_run: {
      conclusion: 'success',
      event: 'push',
      head_branch: 'main',
      head_repository: { full_name: 'owner/repo' },
      head_sha: head,
    },
  };
  assert.equal(
    eventScope('workflow_run', event, head, { repository: 'owner/repo' }).range,
    '--all',
  );
  for (const mutate of [
    (run) => {
      run.conclusion = 'failure';
    },
    (run) => {
      run.head_repository.full_name = 'fork/repo';
    },
    (run) => {
      run.head_sha = base;
    },
    (run) => {
      run.head_branch = 'feature';
    },
    (run) => {
      run.event = 'pull_request';
    },
  ]) {
    const changed = structuredClone(event);
    mutate(changed.workflow_run);
    assert.throws(() =>
      eventScope('workflow_run', changed, head, { repository: 'owner/repo' }),
    );
  }
});

test('missing CI event metadata cannot silently drop the trusted-base policy', () => {
  const root = fileURLToPath(new URL('../..', import.meta.url));
  assert.throws(
    () => scanScope(root, { environment: { GITHUB_ACTIONS: 'true' } }),
    /event name is missing/u,
  );
  assert.throws(
    () =>
      scanScope(root, {
        environment: { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: '' },
      }),
    /event name is missing/u,
  );
});

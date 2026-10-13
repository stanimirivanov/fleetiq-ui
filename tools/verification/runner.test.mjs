import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { REQUIRED_SCRIPTS } from './catalogue.mjs';
import { executeCheck, qualifyTools } from './execution.mjs';
import { REVIEWED } from './reviewed-dependencies.mjs';
import { verify } from './runner.mjs';
import { sourceState, unchangedSource } from './source-state.mjs';

const manifest = { scripts: REQUIRED_SCRIPTS };
const state = {
  revision: 'a'.repeat(40),
  digest: 'b'.repeat(64),
  dirty: true,
  files: 2,
};
const ready = () => ({
  tools: { node: process.version, pnpm: REVIEWED.pnpm, git: 'test' },
  launcher: { command: 'fixture', args: [] },
  blocker: null,
});
const pass = async () => ({ status: 'passed', reason: null, exitCode: 0 });
const options = {
  installed: () => [],
  review: () => ({ status: 'current', changes: [], issues: [] }),
  snapshot: () => state,
  qualify: ready,
  execute: pass,
  persist: () => 'fixture-evidence.json',
};
test('a complete selected group records canonical commands and bounded outcomes', async () => {
  const { report } = await verify('fixture', manifest, 'product', options);
  assert.equal(report.completePass, true);
  assert.equal(report.sourceStable, true);
  assert.equal(report.checks.length, 4);
  assert.ok(
    report.checks.every(
      ({ command, status }) =>
        command.startsWith('pnpm run ') && status === 'passed',
    ),
  );
});
for (const status of ['failed', 'not-run']) {
  test(`${status} never becomes acceptance; subsequent checks remain not-run`, async () => {
    let calls = 0;
    const { report } = await verify('fixture', manifest, 'product', {
      ...options,
      execute: async () => {
        calls++;
        return { status, reason: 'launch-failed', exitCode: null };
      },
    });
    assert.equal(report.completePass, false);
    assert.equal(calls, 1);
    assert.equal(report.checks[0].status, status);
    assert.ok(
      report.checks.slice(1).every((entry) => entry.status === 'not-run'),
    );
  });
}
test('missing prerequisite records evidence without executing any check', async () => {
  let wrote = false;
  const { report } = await verify('fixture', manifest, 'product', {
    ...options,
    qualify: () => ({ tools: {}, blocker: 'pinned-pnpm-unavailable' }),
    execute: async () => {
      assert.fail('must not execute');
    },
    persist: (_root, evidence) => {
      wrote = true;
      return evidence.group;
    },
  });
  assert.equal(wrote, true);
  assert.equal(report.completePass, false);
  assert.ok(report.checks.every(({ status }) => status === 'not-run'));
});
test('source drift, discovery failure and runner exception have no complete pass', async () => {
  let samples = 0;
  const changed = await verify('fixture', manifest, 'product', {
    ...options,
    snapshot: () => (samples++ ? { ...state, digest: 'c'.repeat(64) } : state),
  });
  assert.equal(changed.report.blocker, 'sources-changed');
  for (const replacement of [
    {
      snapshot: () => {
        throw new Error('secret payload');
      },
    },
    {
      execute: async () => {
        throw new Error('secret payload');
      },
    },
  ]) {
    const { report } = await verify('fixture', manifest, 'product', {
      ...options,
      ...replacement,
    });
    assert.equal(report.completePass, false);
    assert.equal(JSON.stringify(report).includes('secret payload'), false);
  }
});
test('aborted check is explicitly not run', async () => {
  const controller = new AbortController();
  controller.abort();
  assert.equal(
    (
      await executeCheck('fixture', { command: 'fixture', args: [] }, 'check', {
        signal: controller.signal,
      })
    ).status,
    'not-run',
  );
});
test('Git tool failure and malformed package pin fail prerequisite qualification', () => {
  assert.equal(
    qualifyTools('.', {}, () => ({ status: 1, stdout: 'private data' }))
      .blocker,
    'git-unavailable',
  );
  assert.equal(
    qualifyTools('.', {}, () => ({ status: 0, stdout: 'git version 2.50.0\n' }))
      .blocker,
    'package-manager-pin-invalid',
  );
});
test('actual temporary Git sources bind content, ignore generated evidence, and include untracked files', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'fleetiq-verification-'));
  const git = (args) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  };
  try {
    git(['init', '--quiet']);
    writeFileSync(path.join(root, '.gitignore'), '.verification/\nignored/\n');
    writeFileSync(path.join(root, 'source.txt'), 'original\n');
    git(['add', '.']);
    git([
      '-c',
      'user.name=Harness fixture',
      '-c',
      'user.email=fixture@example.invalid',
      '-c',
      'commit.gpgsign=false',
      'commit',
      '--quiet',
      '-m',
      'fixture',
    ]);
    const before = sourceState(root);
    assert.equal(before.dirty, false);
    writeFileSync(path.join(root, 'source.txt'), 'changed\n');
    const firstDirty = sourceState(root);
    writeFileSync(path.join(root, 'source.txt'), 'changed again\n');
    const secondDirty = sourceState(root);
    assert.equal(firstDirty.dirty, secondDirty.dirty);
    assert.equal(unchangedSource(firstDirty, secondDirty), false);
    writeFileSync(path.join(root, 'new.txt'), 'new source\n');
    assert.notEqual(sourceState(root).digest, secondDirty.digest);
    const { report, evidencePath } = await verify(root, manifest, 'product', {
      review: options.review,
      installed: options.installed,
      qualify: ready,
      execute: pass,
    });
    assert.equal(report.completePass, true);
    const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));
    assert.equal(evidence.source.digest, sourceState(root).digest);
    assert.equal(JSON.stringify(evidence).includes('changed again'), false);
    rmSync(path.join(root, 'source.txt'));
    assert.notEqual(sourceState(root).digest, evidence.source.digest);
  } finally {
    const target = path.resolve(root);
    assert.equal(path.dirname(target), path.resolve(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('fleetiq-verification-'));
    rmSync(target, { recursive: true, force: true });
  }
});

test('every subgroup rejects a replaced canonical command before execution', async () => {
  for (const [group, script] of [
    ['product', 'test:component'],
    ['browser', 'e2e:production'],
    ['structural', 'docs:check'],
  ]) {
    const altered = {
      scripts: { ...REQUIRED_SCRIPTS, [script]: 'node -e ""' },
    };
    const { report } = await verify('fixture', altered, group, {
      ...options,
      execute: async () => assert.fail('altered command must never execute'),
    });
    assert.equal(report.blocker, 'canonical-command-changed');
    assert.equal(report.completePass, false);
    assert.ok(report.checks.every(({ status }) => status === 'not-run'));
  }
});
test('all Git source-state calls clear hostile redirection variables', () => {
  const seen = [];
  const runGit = (_command, args, config) => {
    seen.push(config.env);
    if (args[0] === 'rev-parse')
      return { status: 0, stdout: `${'a'.repeat(40)}\n` };
    return { status: 0, stdout: '' };
  };
  const original = process.env.GIT_DIR;
  process.env.GIT_DIR = 'elsewhere';
  try {
    sourceState('.', runGit);
    assert.equal(seen.length, 3);
    for (const env of seen) assert.equal(env.GIT_DIR, undefined);
  } finally {
    if (original === undefined) delete process.env.GIT_DIR;
    else process.env.GIT_DIR = original;
  }
});
test('a running interrupted child closes before execution returns', async () => {
  const root = mkdtempSync(
    path.join(os.tmpdir(), 'fleetiq-verification-cancel-'),
  );
  const launcher = path.join(root, 'launcher.cjs');
  const pidPath = path.join(root, 'pid');
  const controller = new AbortController();
  try {
    writeFileSync(
      launcher,
      "require('node:fs').writeFileSync('pid', String(process.pid)); setInterval(() => {}, 1000);\n",
    );
    const running = executeCheck(
      root,
      { command: process.execPath, args: [launcher] },
      'fixture',
      {
        signal: controller.signal,
      },
    );
    const deadline = Date.now() + 10_000;
    let pid;
    while (Date.now() < deadline) {
      try {
        pid = Number(readFileSync(pidPath, 'utf8'));
        break;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.ok(pid, 'child must actually start');
    controller.abort();
    const result = await running;
    assert.equal(result.status, 'failed');
    assert.equal(result.reason, 'interrupted');
    assert.throws(() => process.kill(pid, 0));
  } finally {
    controller.abort();
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('fleetiq-verification-cancel-'));
    rmSync(root, { recursive: true, force: true });
  }
});

test('a late interruption cannot certify an otherwise completed group', async () => {
  const controller = new AbortController();
  const { report } = await verify('fixture', manifest, 'product', {
    ...options,
    signal: controller.signal,
    execute: async () => {
      controller.abort();
      return pass();
    },
  });
  assert.equal(report.completePass, false);
  assert.equal(report.blocker, 'interrupted');
});

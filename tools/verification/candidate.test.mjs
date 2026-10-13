import assert from 'node:assert/strict';
import test from 'node:test';
import { candidatePassed, qualifyCandidate } from './candidate.mjs';
import { GROUPS, REQUIRED_SCRIPTS, selectedChecks } from './catalogue.mjs';
import { REVIEWED } from './reviewed-dependencies.mjs';

const originalRoot = 'original-checkout';
const candidateRoot = 'isolated-candidate';
const original = Object.freeze({
  revision: 'a'.repeat(40),
  digest: 'b'.repeat(64),
  dirty: true,
  files: 23,
});
const exercised = Object.freeze({ ...original, digest: 'c'.repeat(64) });
const tools = Object.freeze({
  node: `v${REVIEWED.nodeMajor}.0.0`,
  pnpm: REVIEWED.pnpm,
  git: '2.50.0',
});
const next = (value) => {
  const [major, minor, patch] = value.split('.');
  return `${major}.${minor}.${BigInt(patch) + 1n}`;
};
const proposal = Object.freeze({
  role: 'vite',
  reviewed: REVIEWED.tools.vite,
  proposed: next(REVIEWED.tools.vite),
});
const pass = () => ({ status: 'passed', reason: null, exitCode: 0 });
const fail = () => ({
  status: 'failed',
  reason: 'command-failed',
  exitCode: 1,
});
const manifest = {
  packageManager: `pnpm@${REVIEWED.pnpm}`,
  scripts: REQUIRED_SCRIPTS,
};
const privatePayload = 'private-response-body-do-not-retain';

function receipt(group = 'product') {
  return {
    schemaVersion: 1,
    group,
    completePass: true,
    blocker: null,
    sourceStable: true,
    source: { ...exercised },
    tools: { ...tools },
    dependencyReview: { status: 'current', changes: 0, issues: 0 },
    installedTools: { status: 'current', issues: 0 },
    checks: selectedChecks(group).map(({ id, script }) => ({
      id,
      command: `pnpm run ${script}`,
      ...pass(),
    })),
  };
}

function fixture(group = 'product', overrides = {}) {
  const calls = [];
  let preparations = 0;
  let cleanups = 0;
  let sourceChecks = 0;
  let retained = 0;
  const options = {
    prepare: (root) => {
      assert.equal(root, originalRoot);
      preparations++;
      return {
        directory: candidateRoot,
        source: { ...original },
        expectedCandidateSource: { ...exercised },
        assertCandidateStable() {},
        effectiveRegistry: {
          ...structuredClone(REVIEWED),
          tools: { ...REVIEWED.tools, vite: proposal.proposed },
        },
        changes: [{ ...proposal }],
        assertSourceStable() {
          sourceChecks++;
        },
        cleanup() {
          cleanups++;
        },
      };
    },
    qualify: (root, value) => {
      assert.equal(root, originalRoot);
      assert.equal(value, manifest);
      return {
        tools: { ...tools },
        launcher: { command: 'qualified-pnpm', args: [] },
        blocker: null,
      };
    },
    snapshot: (root) => {
      assert.ok([originalRoot, candidateRoot].includes(root));
      return { ...(root === originalRoot ? original : exercised) };
    },
    execute: async (root, launcher, args, context) => {
      assert.equal(root, candidateRoot);
      assert.equal(launcher.command, 'qualified-pnpm');
      calls.push({ args, signal: context.signal });
      return pass();
    },
    readEvidence: (root, selectedGroup) => {
      assert.equal(root, candidateRoot);
      assert.equal(selectedGroup, group);
      return receipt(group);
    },
    retain: async () => {
      retained++;
      return undefined;
    },
    persist: (root, value) => {
      assert.equal(root, originalRoot);
      assert.equal(value.kind, 'dependency-candidate');
      return 'candidate-evidence.json';
    },
    ...overrides,
  };
  return {
    options,
    calls,
    preparations: () => preparations,
    cleanups: () => cleanups,
    sourceChecks: () => sourceChecks,
    retained: () => retained,
    run: () => qualifyCandidate(originalRoot, manifest, group, options),
  };
}

for (const group of Object.keys(GROUPS)) {
  test(`the exact ${group} receipt qualifies only the isolated source`, () => {
    const child = receipt(group);
    assert.equal(candidatePassed(child, group, exercised), true);
    assert.equal(candidatePassed(child, group, original), false);
  });

  test(`${group} candidate success preserves the pending-review acceptance barrier`, async () => {
    const context = fixture(group);
    const { report, evidencePath } = await context.run();
    assert.equal(evidencePath, 'candidate-evidence.json');
    assert.equal(report.kind, 'dependency-candidate');
    assert.equal(report.qualificationPass, true);
    assert.equal(report.completePass, false);
    assert.equal(report.sourceStable, true);
    assert.deepEqual(report.source, original);
    assert.deepEqual(report.candidateSource, exercised);
    assert.deepEqual(report.changes, [proposal]);
    assert.deepEqual(
      context.calls.map(({ args }) => args),
      [
        ['install', '--frozen-lockfile'],
        ['run', 'security:install'],
        ['run', 'harness:check'],
        ['run', 'verify', '--group', group],
        ['run', 'security:artifacts'],
      ],
    );
    assert.ok(report.checks.every(({ status }) => status === 'passed'));
    assert.equal(context.preparations(), 1);
    assert.equal(context.sourceChecks(), 1);
    assert.equal(context.retained(), 1);
    assert.equal(context.cleanups(), 1);
  });
}

for (const [label, mutate] of [
  [
    'wrong schema version',
    (child) => {
      child.schemaVersion = 2;
    },
  ],
  [
    'wrong group',
    (child) => {
      child.group = 'browser';
    },
  ],
  [
    'candidate receipt masquerading as acceptance',
    (child) => {
      child.kind = 'dependency-candidate';
    },
  ],
  [
    'incomplete group',
    (child) => {
      child.completePass = false;
    },
  ],
  [
    'blocked group',
    (child) => {
      child.blocker = 'sources-changed';
    },
  ],
  [
    'unstable source',
    (child) => {
      child.sourceStable = false;
    },
  ],
  [
    'missing source',
    (child) => {
      delete child.source;
    },
  ],
  [
    'other source bytes',
    (child) => {
      child.source.digest = 'd'.repeat(64);
    },
  ],
  [
    'other source revision',
    (child) => {
      child.source.revision = 'e'.repeat(40);
    },
  ],
  [
    'other source inventory',
    (child) => {
      child.source.files++;
    },
  ],
  [
    'pending review',
    (child) => {
      child.dependencyReview.status = 'review-required';
    },
  ],
  [
    'pending inventory changes',
    (child) => {
      child.dependencyReview.changes = 1;
    },
  ],
  [
    'inventory errors',
    (child) => {
      child.dependencyReview.issues = 1;
    },
  ],
  [
    'missing review state',
    (child) => {
      delete child.dependencyReview;
    },
  ],
  [
    'unqualified installed tools',
    (child) => {
      child.installedTools.status = 'blocked';
    },
  ],
  [
    'installed tool errors',
    (child) => {
      child.installedTools.issues = 1;
    },
  ],
  [
    'missing installed state',
    (child) => {
      delete child.installedTools;
    },
  ],
  [
    'missing runtime evidence',
    (child) => {
      delete child.tools;
    },
  ],
  [
    'wrong runtime major',
    (child) => {
      child.tools.node = `v${REVIEWED.nodeMajor + 1}.0.0`;
    },
  ],
  [
    'wrong package manager',
    (child) => {
      child.tools.pnpm = next(REVIEWED.pnpm);
    },
  ],
  [
    'malformed Git identity',
    (child) => {
      child.tools.git = privatePayload;
    },
  ],
  [
    'missing checks',
    (child) => {
      delete child.checks;
    },
  ],
  [
    'omitted check',
    (child) => {
      child.checks.pop();
    },
  ],
  [
    'extra check',
    (child) => {
      child.checks.push({ ...child.checks[0] });
    },
  ],
  [
    'reordered checks',
    (child) => {
      child.checks.reverse();
    },
  ],
  [
    'changed check identity',
    (child) => {
      child.checks[0].id = 'unknown-check';
    },
  ],
  [
    'noncanonical command',
    (child) => {
      child.checks[0].command = 'node unrelated-command.mjs';
    },
  ],
  [
    'failed check',
    (child) => {
      child.checks[0].status = 'failed';
    },
  ],
  [
    'skipped check',
    (child) => {
      child.checks[0].status = 'not-run';
    },
  ],
  [
    'hidden check reason',
    (child) => {
      child.checks[0].reason = 'prerequisites-unavailable';
    },
  ],
  [
    'nonzero check exit',
    (child) => {
      child.checks[0].exitCode = 1;
    },
  ],
  [
    'missing check exit',
    (child) => {
      delete child.checks[0].exitCode;
    },
  ],
]) {
  test(`child evidence rejects ${label}`, () => {
    const child = receipt();
    mutate(child);
    assert.equal(candidatePassed(child, 'product', exercised), false);
  });
}

for (const source of [
  { ...exercised, revision: 'not-a-revision' },
  { ...exercised, digest: 'not-a-digest' },
  { ...exercised, dirty: 'true' },
  { ...exercised, files: -1 },
  { ...exercised, files: 1.5 },
  { ...exercised, files: Number.MAX_SAFE_INTEGER + 1 },
  { ...exercised, files: undefined },
]) {
  test('matching malformed source metadata cannot qualify a child receipt', () => {
    const child = receipt();
    child.source = source;
    assert.equal(candidatePassed(child, 'product', source), false);
  });
}

for (const status of ['failed', 'not-run']) {
  test(`a ${status} candidate group still inspects artifacts and never qualifies`, async () => {
    const context = fixture();
    context.options.execute = async (_root, _launcher, args) => {
      context.calls.push({ args });
      if (args[1] === 'verify') {
        return {
          status,
          reason: status === 'failed' ? 'command-failed' : 'launch-failed',
          exitCode: status === 'failed' ? 1 : null,
        };
      }
      return pass();
    };
    context.options.readEvidence = () =>
      assert.fail('Incomplete groups have no qualifying receipt.');
    const { report } = await context.run();
    assert.equal(report.qualificationPass, false);
    assert.equal(report.completePass, false);
    assert.equal(report.blocker, 'candidate-group-failed');
    assert.deepEqual(context.calls.at(-1).args, ['run', 'security:artifacts']);
    assert.equal(context.cleanups(), 1);
  });
}

test('a rejected child receipt still receives final artifact inspection', async () => {
  const context = fixture('product', {
    readEvidence: () => {
      const child = receipt();
      child.checks.pop();
      return child;
    },
  });
  const { report } = await context.run();
  assert.equal(report.qualificationPass, false);
  assert.equal(report.completePass, false);
  assert.deepEqual(context.calls.at(-1).args, ['run', 'security:artifacts']);
  assert.equal(context.cleanups(), 1);
});

for (const script of ['harness:check', 'verify']) {
  test(`a thrown ${script} execution still inspects artifacts without retaining private errors`, async () => {
    const context = fixture();
    context.options.execute = async (_root, _launcher, args) => {
      context.calls.push({ args });
      if (args[1] === script) throw new Error(privatePayload);
      return pass();
    };
    const { report } = await context.run();
    assert.equal(report.qualificationPass, false);
    assert.equal(report.completePass, false);
    assert.deepEqual(context.calls.at(-1).args, ['run', 'security:artifacts']);
    assert.equal(JSON.stringify(report).includes(privatePayload), false);
    assert.equal(context.cleanups(), 1);
  });
}

test('artifact inspection failure defeats an otherwise successful candidate', async () => {
  const context = fixture();
  context.options.execute = async (_root, _launcher, args) => {
    context.calls.push({ args });
    return args[1] === 'security:artifacts' ? fail() : pass();
  };
  const { report } = await context.run();
  assert.equal(report.blocker, 'artifact-inspection-failed');
  assert.equal(report.qualificationPass, false);
  assert.equal(report.completePass, false);
  assert.equal(context.cleanups(), 1);
});

for (const stage of ['install', 'security:install']) {
  test(`${stage} failure prevents candidate execution`, async () => {
    const context = fixture();
    context.options.execute = async (_root, _launcher, args) => {
      context.calls.push({ args });
      return args.includes(stage) ? fail() : pass();
    };
    const { report } = await context.run();
    assert.equal(report.qualificationPass, false);
    assert.equal(report.completePass, false);
    assert.ok(context.calls.every(({ args }) => args[1] !== 'verify'));
    assert.equal(context.cleanups(), 1);
  });
}

test('missing runtime prerequisites cannot prepare or execute a snapshot', async () => {
  const context = fixture('product', {
    qualify: () => ({ tools: {}, blocker: 'pinned-pnpm-unavailable' }),
  });
  const { report } = await context.run();
  assert.equal(report.qualificationPass, false);
  assert.equal(context.preparations(), 0);
  assert.equal(context.calls.length, 0);
  assert.equal(context.cleanups(), 0);
});

test('preparation failure is bounded and cannot become qualification', async () => {
  const context = fixture('product', {
    prepare: () => {
      throw new Error(privatePayload);
    },
  });
  const { report } = await context.run();
  assert.equal(report.qualificationPass, false);
  assert.equal(report.completePass, false);
  assert.equal(context.calls.length, 0);
  assert.equal(JSON.stringify(report).includes(privatePayload), false);
});

test('a snapshot prepared from different source bytes never executes', async () => {
  const context = fixture();
  const prepare = context.options.prepare;
  context.options.prepare = (root) => ({
    ...prepare(root),
    source: { ...original, digest: 'f'.repeat(64) },
  });
  const { report } = await context.run();
  assert.equal(report.qualificationPass, false);
  assert.equal(context.calls.length, 0);
  assert.equal(context.cleanups(), 1);
});

test('working source drift after qualification invalidates the candidate', async () => {
  let samples = 0;
  const context = fixture('product', {
    snapshot: (root) =>
      root === candidateRoot
        ? { ...exercised }
        : {
            ...original,
            digest: samples++ === 0 ? original.digest : 'f'.repeat(64),
          },
  });
  const { report } = await context.run();
  assert.equal(report.blocker, 'sources-changed');
  assert.equal(report.sourceStable, false);
  assert.equal(report.qualificationPass, false);
  assert.equal(context.cleanups(), 1);
});

test('staged index or reference drift invalidates unchanged working source bytes', async () => {
  const context = fixture();
  const prepare = context.options.prepare;
  context.options.prepare = (root) => ({
    ...prepare(root),
    assertSourceStable: () => {
      throw new Error(privatePayload);
    },
  });
  const { report } = await context.run();
  assert.equal(report.qualificationPass, false);
  assert.equal(report.completePass, false);
  assert.equal(JSON.stringify(report).includes(privatePayload), false);
  assert.equal(context.cleanups(), 1);
});

test('cleanup failure invalidates successful candidate evidence', async () => {
  const context = fixture();
  const prepare = context.options.prepare;
  context.options.prepare = (root) => ({
    ...prepare(root),
    cleanup: () => {
      throw new Error(privatePayload);
    },
  });
  const { report } = await context.run();
  assert.equal(report.blocker, 'candidate-cleanup-failed');
  assert.equal(report.qualificationPass, false);
  assert.equal(report.completePass, false);
  assert.equal(JSON.stringify(report).includes(privatePayload), false);
});

test('cancellation is forwarded and cannot leave successful qualification', async () => {
  const controller = new AbortController();
  const context = fixture('product', { signal: controller.signal });
  context.options.execute = async (_root, _launcher, args, options) => {
    context.calls.push({ args, signal: options.signal });
    if (args[1] === 'verify') controller.abort();
    return pass();
  };
  const { report } = await context.run();
  assert.equal(report.blocker, 'interrupted');
  assert.equal(report.qualificationPass, false);
  assert.equal(report.completePass, false);
  assert.ok(context.calls.every(({ signal }) => signal === controller.signal));
  assert.equal(context.cleanups(), 1);
});

test('receipt extraction errors never retain private payloads', async () => {
  const context = fixture('product', {
    readEvidence: () => {
      throw new Error(privatePayload);
    },
  });
  const { report } = await context.run();
  assert.equal(report.qualificationPass, false);
  assert.equal(report.completePass, false);
  assert.equal(JSON.stringify(report).includes(privatePayload), false);
  assert.deepEqual(context.calls.at(-1).args, ['run', 'security:artifacts']);
  assert.equal(context.cleanups(), 1);
});

for (const malformed of [
  null,
  { status: 'passed', reason: null, exitCode: 1 },
  { status: 'passed', reason: 'command-failed', exitCode: 0 },
  { status: 'passed', reason: null },
  { status: 'unknown', reason: null, exitCode: 0 },
  { status: 'failed', reason: privatePayload, exitCode: 1 },
  { status: 'failed', reason: 'command-failed', exitCode: -1 },
  { status: 'failed', reason: 'command-failed', exitCode: 256 },
]) {
  test('contradictory or malformed stage outcomes never qualify or retain payloads', async () => {
    const context = fixture();
    context.options.execute = async (_root, _launcher, args) => {
      context.calls.push({ args });
      return args[1] === 'verify' ? malformed : pass();
    };
    const { report } = await context.run();
    assert.equal(report.qualificationPass, false);
    assert.equal(report.completePass, false);
    assert.equal(JSON.stringify(report).includes(privatePayload), false);
    assert.deepEqual(context.calls.at(-1).args, ['run', 'security:artifacts']);
    assert.equal(context.cleanups(), 1);
  });
}

test('stage evidence retains only the closed outcome fields', async () => {
  const context = fixture();
  context.options.execute = async (_root, _launcher, args) => {
    context.calls.push({ args });
    return { ...pass(), stdout: privatePayload, stderr: privatePayload };
  };
  const { report } = await context.run();
  assert.equal(report.qualificationPass, true);
  assert.equal(report.completePass, false);
  assert.equal(JSON.stringify(report).includes(privatePayload), false);
});

test('successful artifact inspection is required before retaining candidate output', async () => {
  const context = fixture();
  context.options.execute = async (_root, _launcher, args) => {
    context.calls.push({ args });
    return args[1] === 'security:artifacts' ? fail() : pass();
  };
  const { report } = await context.run();
  assert.equal(report.qualificationPass, false);
  assert.equal(context.retained(), 0);
  assert.equal(context.cleanups(), 1);
});

test('candidate output retention failure prevents qualification and still cleans up', async () => {
  const context = fixture('product', {
    retain: async () => {
      throw new Error(privatePayload);
    },
  });
  const { report } = await context.run();
  assert.equal(report.qualificationPass, false);
  assert.equal(report.completePass, false);
  assert.equal(JSON.stringify(report).includes(privatePayload), false);
  assert.deepEqual(context.calls.at(-1).args, ['run', 'security:artifacts']);
  assert.equal(context.cleanups(), 1);
});

for (const changes of [
  [],
  [null],
  [{ ...proposal, role: 'action:checkout' }],
  [{ ...proposal, role: 'unknown-tool' }],
  [{ ...proposal, proposed: '^9.0.0' }],
  [{ ...proposal, reviewed: '9.0' }],
  [{ ...proposal, proposed: proposal.reviewed }],
  [{ ...proposal }, { ...proposal }],
]) {
  test('malformed or non-npm prepared proposals cannot execute candidate commands', async () => {
    const context = fixture();
    const prepare = context.options.prepare;
    context.options.prepare = (root) => ({ ...prepare(root), changes });
    const { report } = await context.run();
    assert.equal(report.qualificationPass, false);
    assert.equal(report.completePass, false);
    assert.equal(context.calls.length, 0);
    assert.equal(context.cleanups(), 1);
  });
}

test('a newly sampled child baseline cannot replace the prepared candidate identity', async () => {
  const changed = { ...exercised, digest: 'd'.repeat(64) };
  const context = fixture('product', {
    snapshot: (root) => ({ ...(root === originalRoot ? original : changed) }),
    readEvidence: () => ({ ...receipt(), source: changed }),
  });
  const { report } = await context.run();
  assert.equal(report.qualificationPass, false);
  assert.equal(report.completePass, false);
  assert.deepEqual(report.candidateSource, exercised);
  assert.equal(context.cleanups(), 1);
});

for (const command of ['install', 'harness:check']) {
  test(`source changes during ${command} prevent execution of the candidate group`, async () => {
    let current = { ...exercised };
    const context = fixture();
    const prepare = context.options.prepare;
    context.options.prepare = (root) => ({
      ...prepare(root),
      assertCandidateStable() {
        assert.deepEqual(current, exercised);
      },
    });
    context.options.snapshot = (root) => ({
      ...(root === originalRoot ? original : current),
    });
    context.options.execute = async (_root, _launcher, args) => {
      context.calls.push({ args });
      if (args.includes(command))
        current = { ...exercised, digest: 'd'.repeat(64) };
      return pass();
    };
    context.options.readEvidence = () => ({ ...receipt(), source: current });
    const { report } = await context.run();
    assert.equal(report.qualificationPass, false);
    assert.equal(report.completePass, false);
    assert.ok(context.calls.every(({ args }) => args[1] !== 'verify'));
    assert.equal(context.retained(), 0);
    assert.equal(context.cleanups(), 1);
  });
}

test('snapshot source drift from artifact inspection prevents output retention', async () => {
  let current = { ...exercised };
  const context = fixture();
  const prepare = context.options.prepare;
  context.options.prepare = (root) => ({
    ...prepare(root),
    assertCandidateStable() {
      assert.deepEqual(current, exercised);
    },
  });
  context.options.execute = async (_root, _launcher, args) => {
    context.calls.push({ args });
    if (args[1] === 'security:artifacts')
      current = { ...exercised, digest: 'd'.repeat(64) };
    return pass();
  };
  const { report } = await context.run();
  assert.equal(report.qualificationPass, false);
  assert.equal(report.completePass, false);
  assert.equal(context.retained(), 0);
  assert.equal(context.cleanups(), 1);
});

test('snapshot source changes after retention defeat otherwise complete qualification', async () => {
  let stable = true;
  const context = fixture('product', {
    retain: async () => {
      stable = false;
    },
  });
  const prepare = context.options.prepare;
  context.options.prepare = (root) => ({
    ...prepare(root),
    assertCandidateStable() {
      assert.equal(stable, true);
    },
  });
  const { report } = await context.run();
  assert.equal(report.qualificationPass, false);
  assert.equal(report.completePass, false);
  assert.equal(report.sourceStable, false);
  assert.equal(context.cleanups(), 1);
});

for (const expected of [
  undefined,
  { ...exercised, revision: 'not-a-revision' },
  { ...exercised, digest: 'not-a-digest' },
]) {
  test('missing or malformed prepared candidate identity cannot execute commands', async () => {
    const context = fixture();
    const prepare = context.options.prepare;
    context.options.prepare = (root) => ({
      ...prepare(root),
      expectedCandidateSource: expected,
    });
    const { report } = await context.run();
    assert.equal(report.qualificationPass, false);
    assert.equal(report.completePass, false);
    assert.equal(context.calls.length, 0);
    assert.equal(context.cleanups(), 1);
  });
}

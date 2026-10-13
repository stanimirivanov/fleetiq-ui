import assert from 'node:assert/strict';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse, stringify } from 'yaml';
import { temporary } from '../security/owned.mjs';
import { git } from '../security/process.mjs';
import { prepareCandidateWorkspace } from './candidate-workspace.mjs';
import {
  REVIEWED_PATH,
  readReviewedDependencies,
} from './reviewed-dependencies.mjs';
import { sourceState } from './source-state.mjs';
import { reviewUpgrades } from './upgrades.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const registry = readReviewedDependencies(repository);
const next = (value) => {
  const [major, minor, patch] = value.split('.');
  return `${major}.${minor}.${BigInt(patch) + 1n}`;
};
const write = (root, name, content) => {
  const target = path.join(root, name);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
};
const json = (root, name, mutate) => {
  const value = JSON.parse(readFileSync(path.join(root, name), 'utf8'));
  mutate(value);
  write(root, name, `${JSON.stringify(value)}\n`);
};
const fixtureGit = (root, args, options = {}) =>
  git(
    root,
    [
      '-c',
      'user.name=Candidate fixture',
      '-c',
      'user.email=candidate@example.invalid',
      ...args,
    ],
    options,
  );
const critical = {
  typescript: registry.tools.compiler,
  'typescript-parser': `npm:typescript@${registry.tools.astParser}`,
  'dependency-cruiser': registry.tools.dependencyCruiser,
  vite: registry.tools.vite,
  '@axe-core/playwright': registry.tools.axe,
  yauzl: registry.tools.archive,
  vitest: registry.tools.vitest,
  '@vitest/coverage-v8': registry.tools.vitest,
  '@playwright/test': registry.tools.playwright,
};

function fixture(t, { candidate = true } = {}) {
  const owned = temporary('fleetiq-candidate-test-');
  t.after(() => owned.dispose());
  const root = owned.root;
  write(root, REVIEWED_PATH, `${JSON.stringify(registry)}\n`);
  for (const name of [
    'package.json',
    'apps/web/package.json',
    'apps/web-e2e/package.json',
  ]) {
    const manifest = JSON.parse(
      readFileSync(path.join(repository, name), 'utf8'),
    );
    for (const key of Object.keys(manifest.devDependencies))
      if (critical[key]) manifest.devDependencies[key] = critical[key];
    if (name === 'package.json') {
      manifest.packageManager = `pnpm@${registry.pnpm}`;
      manifest.engines.node = `>=${registry.nodeMajor}.0.0`;
    }
    write(root, name, `${JSON.stringify(manifest)}\n`);
  }
  const workspace = parse(
    readFileSync(path.join(repository, 'pnpm-workspace.yaml'), 'utf8'),
  );
  workspace.packageExtensions = {
    [`dependency-cruiser@${registry.tools.dependencyCruiser}`]: {
      dependencies: { typescript: registry.tools.astParser },
    },
  };
  write(root, 'pnpm-workspace.yaml', stringify(workspace));
  for (const name of ['quality.yml', 'user-guide.yml']) {
    const file = `.github/workflows/${name}`;
    const workflow = parse(readFileSync(path.join(repository, file), 'utf8'));
    for (const job of Object.values(workflow.jobs))
      for (const step of job.steps) {
        const action = Object.values(registry.actions).find((entry) =>
          step.uses?.startsWith(`${entry.repository}@`),
        );
        if (action) step.uses = `${action.repository}@${action.commit}`;
        if (action?.repository === 'actions/setup-node')
          step.with['node-version'] = String(registry.nodeMajor);
      }
    write(root, file, stringify(workflow));
  }
  write(root, '.gitattributes', '* text=auto eol=lf\n');
  write(root, '.gitignore', 'node_modules/\n.verification/\n');
  write(root, 'state.txt', 'initial\n');
  fixtureGit(root, ['init', '--quiet']);
  fixtureGit(root, ['add', '.']);
  fixtureGit(root, ['commit', '--quiet', '-m', 'initial fixture']);
  write(root, 'state.txt', 'second committed state\n');
  fixtureGit(root, ['add', 'state.txt']);
  fixtureGit(root, ['commit', '--quiet', '-m', 'second fixture']);
  if (candidate)
    for (const name of ['package.json', 'apps/web/package.json'])
      json(root, name, (value) => {
        value.devDependencies.vite = next(registry.tools.vite);
      });
  return root;
}

function prepared(t, root) {
  const workspace = prepareCandidateWorkspace(root);
  t.after(() => workspace.cleanup());
  return workspace;
}

test('actual isolated workspace preserves raw dirty bytes, index, all refs and history', (t) => {
  const root = fixture(t);
  const first = fixtureGit(root, ['rev-parse', 'HEAD~1']).trim();
  fixtureGit(root, ['update-ref', 'refs/remotes/upstream/trusted-only', first]);
  write(root, 'state.txt', 'staged-only secret-shaped test sentinel\n');
  fixtureGit(root, ['add', 'state.txt']);
  const stage = fixtureGit(root, ['ls-files', '--stage', '-z']);
  write(root, 'state.txt', 'different unstaged bytes\r\n');
  write(root, 'new-file.txt', 'newly authored bytes\r\n');
  rmSync(path.join(root, '.gitattributes'));
  const before = sourceState(root);
  const registryBytes = readFileSync(path.join(root, REVIEWED_PATH));
  const indexBytes = readFileSync(path.join(root, '.git/index'));
  const workspace = prepared(t, root);

  assert.deepEqual(workspace.source, before);
  assert.equal(
    workspace.effectiveRegistry.tools.vite,
    next(registry.tools.vite),
  );
  assert.equal(workspace.changes.length, 1);
  assert.equal(reviewUpgrades(root).status, 'review-required');
  assert.equal(reviewUpgrades(workspace.directory).status, 'current');
  assert.deepEqual(readFileSync(path.join(root, REVIEWED_PATH)), registryBytes);
  assert.deepEqual(readFileSync(path.join(root, '.git/index')), indexBytes);
  assert.equal(
    fixtureGit(workspace.directory, ['ls-files', '--stage', '-z']),
    stage,
  );
  assert.equal(
    fixtureGit(workspace.directory, ['show', ':state.txt']),
    'staged-only secret-shaped test sentinel\n',
  );
  for (const name of ['state.txt', 'new-file.txt'])
    assert.deepEqual(
      readFileSync(path.join(workspace.directory, name)),
      readFileSync(path.join(root, name)),
    );
  assert.equal(
    existsSync(path.join(workspace.directory, '.gitattributes')),
    false,
  );
  assert.equal(
    fixtureGit(workspace.directory, ['rev-parse', 'HEAD']).trim(),
    before.revision,
  );
  assert.equal(
    fixtureGit(workspace.directory, [
      'rev-parse',
      'refs/remotes/upstream/trusted-only',
    ]).trim(),
    first,
  );
  assert.equal(
    fixtureGit(workspace.directory, ['rev-list', '--all', '--count']).trim(),
    '2',
  );
  assert.equal(
    existsSync(path.join(workspace.directory, '.git/objects/info/alternates')),
    false,
  );
  assert.equal(
    fixtureGit(workspace.directory, ['config', '--get', 'remote.origin.url'], {
      accepted: [0, 1],
    }).trim(),
    '',
  );
  const hash = fixtureGit(root, ['rev-parse', 'HEAD']).trim();
  const sourceObject = path.join(
    root,
    '.git/objects',
    hash.slice(0, 2),
    hash.slice(2),
  );
  const copiedObject = path.join(
    workspace.directory,
    '.git/objects',
    hash.slice(0, 2),
    hash.slice(2),
  );
  assert.notEqual(lstatSync(sourceObject).ino, lstatSync(copiedObject).ino);
  workspace.assertSourceStable();
  workspace.cleanup();
  workspace.cleanup();
  assert.equal(existsSync(workspace.directory), false);
  assert.ok(existsSync(root));
});

for (const [label, mutate] of [
  [
    'source ownership',
    (root) => {
      mkdirSync(path.join(root, 'node_modules'));
      const preserved = path.join(root, 'node_modules/preserved-web');
      renameSync(path.join(root, 'apps/web'), preserved);
      symlinkSync(preserved, path.join(root, 'apps/web'), 'junction');
    },
  ],
  [
    'working source bytes',
    (root) => write(root, 'state.txt', 'changed during qualification\n'),
  ],
  [
    'staged-only source',
    (root) => {
      write(root, 'state.txt', 'staged change\n');
      fixtureGit(root, ['add', 'state.txt']);
      write(root, 'state.txt', 'second committed state\n');
    },
  ],
  [
    'reviewed source registry',
    (root) =>
      json(root, REVIEWED_PATH, (value) => {
        value.tools.vite = next(value.tools.vite);
      }),
  ],
  [
    'Git refs',
    (root) =>
      fixtureGit(root, ['update-ref', 'refs/remotes/new/trusted', 'HEAD']),
  ],
  [
    'Git policy',
    (root) => fixtureGit(root, ['config', 'core.filemode', 'false']),
  ],
]) {
  test(`late ${label} drift cannot qualify an isolated candidate`, (t) => {
    const root = fixture(t);
    // Start with a known policy value so the mutation differs on Windows too.
    fixtureGit(root, ['config', 'core.filemode', 'true']);
    const workspace = prepared(t, root);
    mutate(root);
    assert.throws(
      () => workspace.assertSourceStable(),
      /source changed; no qualification result/u,
    );
  });
}

for (const [label, mutate] of [
  ['current inventory', null],
  [
    'runtime proposals',
    (root) => {
      const major = (registry.nodeMajor % 99) + 1;
      json(root, 'package.json', (value) => {
        value.engines.node = `>=${major}.0.0`;
      });
      for (const name of ['quality.yml', 'user-guide.yml']) {
        const file = `.github/workflows/${name}`;
        const workflow = parse(readFileSync(path.join(root, file), 'utf8'));
        for (const job of Object.values(workflow.jobs))
          for (const step of job.steps)
            if (step.uses?.startsWith('actions/setup-node@'))
              step.with['node-version'] = String(major);
        write(root, file, stringify(workflow));
      }
    },
  ],
  [
    'partial clones',
    (root) => fixtureGit(root, ['config', 'extensions.partialClone', 'origin']),
  ],
  [
    'promisor remotes',
    (root) => fixtureGit(root, ['config', 'remote.origin.promisor', 'true']),
  ],
  [
    'promisor object packs',
    (root) => write(root, '.git/objects/pack/synthetic.promisor', ''),
  ],
  [
    'gitfile worktrees',
    (root) => {
      const metadata = path.join(root, 'original-git');
      renameSync(path.join(root, '.git'), metadata);
      write(root, '.git', `gitdir: ${metadata}\n`);
    },
  ],
  [
    'conflicted index stages',
    (root) => {
      const blob = fixtureGit(root, ['rev-parse', 'HEAD:state.txt']).trim();
      fixtureGit(root, ['update-index', '--index-info'], {
        input: `100644 ${blob} 1\tstate.txt\n`,
      });
    },
  ],
  [
    'excessive source file count',
    (root) => {
      for (let index = 0; index < 8193; index++)
        write(root, `bounded/file-${index}.txt`, '');
    },
  ],
  [
    'oversized source file',
    (root) => {
      write(root, 'oversized.bin', '');
      truncateSync(path.join(root, 'oversized.bin'), 64 * 1024 * 1024 + 1);
    },
  ],
  [
    'excessive total source bytes',
    (root) => {
      for (let index = 0; index < 4; index++) {
        const name = `bounded-${index}.bin`;
        write(root, name, '');
        truncateSync(path.join(root, name), 64 * 1024 * 1024);
      }
    },
  ],

  [
    'inconsistent npm pins',
    (root) =>
      json(root, 'apps/web/package.json', (value) => {
        value.devDependencies.vite = registry.tools.vite;
      }),
  ],
  [
    'action proposals',
    (root) => {
      for (const name of ['quality.yml', 'user-guide.yml']) {
        const file = `.github/workflows/${name}`;
        const source = readFileSync(path.join(root, file), 'utf8');
        write(
          root,
          file,
          source.replaceAll(
            registry.actions.checkout.commit,
            registry.actions.checkout.commit[0] === 'a'
              ? `b${registry.actions.checkout.commit.slice(1)}`
              : `a${registry.actions.checkout.commit.slice(1)}`,
          ),
        );
      }
    },
  ],
  [
    'package manager proposals',
    (root) =>
      json(root, 'package.json', (value) => {
        value.packageManager = `pnpm@${next(registry.pnpm)}`;
      }),
  ],
  [
    'malformed reviewed registry',
    (root) => write(root, REVIEWED_PATH, '{"private-invalid-input":'),
  ],
  [
    'sparse checkout',
    (root) => fixtureGit(root, ['config', 'core.sparseCheckout', 'true']),
  ],
  [
    'borrowed object stores',
    (root) =>
      write(
        root,
        '.git/objects/info/alternates',
        'private-outside-object-store\n',
      ),
  ],
  [
    'nonstandard index flags',
    (root) =>
      fixtureGit(root, ['update-index', '--assume-unchanged', 'state.txt']),
  ],
  [
    'intent-to-add index entries',
    (root) => {
      write(root, 'intent.txt', 'intent-to-add\n');
      fixtureGit(root, ['add', '--intent-to-add', 'intent.txt']);
    },
  ],
  [
    'submodule index entries',
    (root) => {
      const revision = fixtureGit(root, ['rev-parse', 'HEAD']).trim();
      fixtureGit(root, [
        'update-index',
        '--add',
        '--cacheinfo',
        `160000,${revision},submodule`,
      ]);
    },
  ],
  [
    'linked source ancestors',
    (root) => {
      renameSync(
        path.join(root, 'apps/web'),
        path.join(root, 'apps/original-web'),
      );
      symlinkSync(
        path.join(root, 'apps/original-web'),
        path.join(root, 'apps/web'),
        'junction',
      );
    },
  ],
]) {
  test(`unsupported ${label} fails closed with bounded diagnostics`, (t) => {
    const root = fixture(t, { candidate: label !== 'current inventory' });
    if (mutate) mutate(root);
    assert.throws(
      () => prepareCandidateWorkspace(root),
      (error) =>
        error.message ===
        'Candidate workspace could not be isolated; no qualification result.',
    );
  });
}

test('shallow Git history cannot become candidate qualification material', (t) => {
  const root = fixture(t, { candidate: false });
  const target = temporary('fleetiq-candidate-shallow-');
  t.after(() => target.dispose());
  const checkout = path.join(target.root, 'checkout');
  fixtureGit(root, [
    'clone',
    '--depth=1',
    '--quiet',
    pathToFileURL(root).href,
    checkout,
  ]);
  for (const name of ['package.json', 'apps/web/package.json'])
    json(checkout, name, (value) => {
      value.devDependencies.vite = next(registry.tools.vite);
    });
  assert.throws(
    () => prepareCandidateWorkspace(checkout),
    /no qualification result/u,
  );
});

test('cleanup rejects a replaced owned workspace parent', (t) => {
  const root = fixture(t);
  const workspace = prepareCandidateWorkspace(root);
  const parent = path.dirname(workspace.directory);
  const holding = temporary('fleetiq-candidate-cleanup-');
  t.after(() => holding.dispose());
  // Removing an owned snapshot first is safe. A replacement link must never be followed.
  rmSync(parent, { recursive: true });
  symlinkSync(holding.root, parent, 'junction');
  t.after(() => rmSync(parent, { force: true }));
  assert.throws(
    () => workspace.cleanup(),
    /ownership changed; cleanup refused/u,
  );
  assert.ok(existsSync(holding.root));
});

test('a split index preserves canonical staging without borrowing shared-index files', (t) => {
  const root = fixture(t);
  write(root, 'state.txt', 'split staged state\n');
  fixtureGit(root, ['add', 'state.txt']);
  fixtureGit(root, ['update-index', '--split-index']);
  const before = fixtureGit(root, ['ls-files', '--stage', '-z']);
  const workspace = prepared(t, root);
  assert.equal(
    fixtureGit(workspace.directory, ['ls-files', '--stage', '-z']),
    before,
  );
  assert.equal(
    fixtureGit(workspace.directory, ['show', ':state.txt']),
    'split staged state\n',
  );
  workspace.assertSourceStable();
});

test('the prepared candidate identity allows ignored outputs while binding the registry substitution', (t) => {
  const root = fixture(t);
  const original = sourceState(root);
  const workspace = prepared(t, root);
  assert.deepEqual(
    workspace.expectedCandidateSource,
    sourceState(workspace.directory),
  );
  assert.notEqual(workspace.expectedCandidateSource.digest, original.digest);
  workspace.assertCandidateStable();
  write(
    workspace.directory,
    '.verification/fixture-output.json',
    '{"synthetic":true}\n',
  );
  workspace.assertCandidateStable();
  assert.deepEqual(sourceState(root), original);
});

for (const [label, mutate] of [
  [
    'working bytes',
    (root) => write(root, 'state.txt', 'changed in private workspace\n'),
  ],
  [
    'staged-only blobs',
    (root) => {
      const original = readFileSync(path.join(root, 'state.txt'));
      write(root, 'state.txt', 'staged snapshot drift\n');
      fixtureGit(root, ['add', 'state.txt']);
      write(root, 'state.txt', original);
    },
  ],
  [
    'refs',
    (root) =>
      fixtureGit(root, ['update-ref', 'refs/candidate/unexpected', 'HEAD']),
  ],
  [
    'Git policy',
    (root) => fixtureGit(root, ['config', 'candidate.unexpected', 'true']),
  ],
]) {
  test(`private ${label} changes cannot replace the prepared candidate baseline`, (t) => {
    const root = fixture(t);
    const original = sourceState(root);
    const workspace = prepared(t, root);
    const preparedSource = { ...workspace.expectedCandidateSource };
    mutate(workspace.directory);
    if (label === 'staged-only blobs')
      assert.deepEqual(sourceState(workspace.directory), preparedSource);
    assert.throws(
      () => workspace.assertCandidateStable(),
      /Isolated candidate source changed; no qualification result/u,
    );
    assert.deepEqual(sourceState(root), original);
    workspace.assertSourceStable();
  });
}

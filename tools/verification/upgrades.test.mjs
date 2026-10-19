import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';
import { plainFiles, temporary } from '../security/owned.mjs';
import { DECLARED, isMaintenanceInventory } from './declared-dependencies.mjs';
import {
  REVIEWED_PATH,
  readReviewedDependencies,
} from './reviewed-dependencies.mjs';
import { inspectUpgradeInventory, reviewUpgrades } from './upgrades.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const cli = fileURLToPath(new URL('./upgrades-cli.mjs', import.meta.url));
const names = {
  rootManifest: 'package.json',
  webManifest: 'apps/web/package.json',
  e2eManifest: 'apps/web-e2e/package.json',
  workspace: 'pnpm-workspace.yaml',
  qualityWorkflow: '.github/workflows/quality.yml',
  guideWorkflow: '.github/workflows/user-guide.yml',
};
const inputs = {
  registry: DECLARED,
  ...Object.fromEntries(
    Object.entries(names).map(([key, name]) => {
      const source = readFileSync(path.join(repository, name), 'utf8');
      return [key, name.endsWith('.json') ? JSON.parse(source) : parse(source)];
    }),
  ),
};
// Legacy exact-selector probes use an isolated baseline; live config may be version-independent.
inputs.workspace.packageExtensions = {
  [`dependency-cruiser@${DECLARED.tools.dependencyCruiser}`]: {
    dependencies: { typescript: DECLARED.tools.astParser },
  },
};
// Probes must stay different after a real upgrade changes the reviewed inventory.
const nextVersion = (version) => {
  const [major, minor, patch] = version.split('.');
  return `${major}.${minor}.${BigInt(patch) + 1n}`;
};
const nextNodeMajor = (data) => (data.registry.nodeMajor % 99) + 1;
const nextActionCommit = (commit) =>
  `${commit[0] === 'a' ? 'b' : 'a'}${commit.slice(1)}`;
const candidate = (mutate) => {
  const data = structuredClone(inputs);
  mutate(data);
  return inspectUpgradeInventory(data);
};
const allSteps = (data) =>
  [data.qualityWorkflow, data.guideWorkflow].flatMap((workflow) =>
    Object.values(workflow.jobs).flatMap((job) => job.steps),
  );
const coordinateAction = (data, repositoryName, commit) => {
  for (const step of allSteps(data))
    if (step.uses?.startsWith(`${repositoryName}@`))
      step.uses = `${repositoryName}@${commit}`;
};
const write = (root, name, source) => {
  const file = path.join(root, name);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, source);
};
function fixture() {
  const owned = temporary('fleetiq-upgrade-review-');
  for (const [key, name] of Object.entries(names))
    write(
      owned.root,
      name,
      name.endsWith('.json')
        ? JSON.stringify(inputs[key])
        : stringify(inputs[key]),
    );
  write(owned.root, REVIEWED_PATH, JSON.stringify(inputs.registry));
  return owned;
}
const digest = (root) =>
  plainFiles(root).map((name) => ({
    name,
    size: statSync(path.join(root, name)).size,
    hash: createHash('sha256')
      .update(readFileSync(path.join(root, name)))
      .digest('hex'),
  }));
const execute = (root, extra = []) =>
  spawnSync(process.execPath, [cli, '--root', root, '--json', ...extra], {
    encoding: 'utf8',
    timeout: 15_000,
    windowsHide: true,
  });

test('actual inventory permits consistent maintenance without claiming acceptance', () => {
  const actual = reviewUpgrades(repository);
  assert.deepEqual(actual.issues, []);
  assert.ok(
    actual.status === 'current' ||
      isMaintenanceInventory(actual, readReviewedDependencies(repository)),
  );
  assert.deepEqual(inspectUpgradeInventory(inputs), {
    status: 'current',
    changes: [],
    issues: [],
  });
});

test('version-independent extension permits cruiser maintenance without changing the parser', () => {
  const result = candidate((data) => {
    data.rootManifest.devDependencies['dependency-cruiser'] = nextVersion(
      data.registry.tools.dependencyCruiser,
    );
    data.workspace.packageExtensions = {
      'dependency-cruiser@*': {
        dependencies: { typescript: data.registry.tools.astParser },
      },
    };
  });
  assert.equal(result.status, 'review-required');
  assert.deepEqual(result.issues, []);
  assert.equal(result.changes[0].role, 'dependencyCruiser');
  const invalid = candidate((data) => {
    data.workspace.packageExtensions = {
      'dependency-cruiser@*': { dependencies: { typescript: '*' } },
    };
  });
  assert.equal(invalid.status, 'blocked');
});
for (const [label, mutate, role] of [
  [
    'Vite',
    (data) => {
      data.rootManifest.devDependencies.vite = nextVersion(
        data.registry.tools.vite,
      );
      data.webManifest.devDependencies.vite = nextVersion(
        data.registry.tools.vite,
      );
    },
    'vite',
  ],
  [
    'compiler',
    (data) => {
      for (const owner of ['rootManifest', 'webManifest', 'e2eManifest'])
        data[owner].devDependencies.typescript = nextVersion(
          data.registry.tools.compiler,
        );
    },
    'compiler',
  ],
  [
    'architecture parser and package extension',
    (data) => {
      data.rootManifest.devDependencies['typescript-parser'] =
        `npm:typescript@${nextVersion(data.registry.tools.astParser)}`;
      data.workspace.packageExtensions[
        `dependency-cruiser@${data.registry.tools.dependencyCruiser}`
      ].dependencies.typescript = nextVersion(data.registry.tools.astParser);
    },
    'astParser',
  ],
  [
    'architecture tool and extension selector',
    (data) => {
      data.rootManifest.devDependencies['dependency-cruiser'] = nextVersion(
        data.registry.tools.dependencyCruiser,
      );
      data.workspace.packageExtensions = {
        [`dependency-cruiser@${nextVersion(data.registry.tools.dependencyCruiser)}`]:
          {
            dependencies: { typescript: data.registry.tools.astParser },
          },
      };
    },
    'dependencyCruiser',
  ],
  [
    'coverage provider and Vitest',
    (data) => {
      data.webManifest.devDependencies.vitest = nextVersion(
        data.registry.tools.vitest,
      );
      data.webManifest.devDependencies['@vitest/coverage-v8'] = nextVersion(
        data.registry.tools.vitest,
      );
    },
    'vitest',
  ],
  [
    'Playwright',
    (data) => {
      data.rootManifest.devDependencies['@playwright/test'] = nextVersion(
        data.registry.tools.playwright,
      );
      data.e2eManifest.devDependencies['@playwright/test'] = nextVersion(
        data.registry.tools.playwright,
      );
    },
    'playwright',
  ],
  [
    'package manager',
    (data) => {
      data.rootManifest.packageManager = `pnpm@${nextVersion(data.registry.pnpm)}`;
    },
    'pnpm',
  ],
  [
    'Node major and all runner declarations',
    (data) => {
      const major = nextNodeMajor(data);
      data.rootManifest.engines.node = `>=${major}.0.0`;
      for (const owner of ['rootManifest', 'e2eManifest'])
        data[owner].devDependencies['@types/node'] = `${major}.0.0`;
      for (const step of allSteps(data))
        if (step.uses?.startsWith('actions/setup-node@'))
          step.with['node-version'] = String(major);
    },
    'nodeMajor',
  ],
  [
    'Checkout major in every workflow',
    (data) =>
      coordinateAction(
        data,
        'actions/checkout',
        'v' +
          (Number(data.registry.actions.checkout.version.split('.')[0]) + 1),
      ),
    'action:checkout',
  ],
]) {
  test(`coordinated exact ${label} candidate requires review without approval`, () => {
    const result = candidate(mutate);
    assert.equal(result.status, 'review-required');
    assert.deepEqual(result.issues, []);
    assert.equal(result.changes.length, 1);
    assert.equal(result.changes[0].role, role);
    assert.ok(result.changes[0].locations.length > 0);
    assert.ok(result.changes[0].qualification.includes('pnpm check'));
    assert.ok(
      result.changes[0].qualification.includes(
        'pnpm verify --group browser-quality',
      ),
    );
  });
}

const invalid = {
  'missing Node declaration': (data) => {
    delete data.e2eManifest.devDependencies['@types/node'];
  },
  'mutable Node declaration': (data) => {
    data.rootManifest.devDependencies['@types/node'] = '^24.19.1';
  },
  'inconsistent Node declaration': (data) => {
    data.e2eManifest.devDependencies['@types/node'] = nextVersion(
      data.rootManifest.devDependencies['@types/node'],
    );
  },
  'future-major Node declarations on the current runtime': (data) => {
    for (const owner of ['rootManifest', 'e2eManifest'])
      data[owner].devDependencies['@types/node'] = `${nextNodeMajor(data)}.0.0`;
  },
  'runtime major with a leading zero': (data) => {
    data.rootManifest.engines.node = '>=01.0.0';
    for (const step of allSteps(data))
      if (step.uses?.startsWith('actions/setup-node@'))
        step.with['node-version'] = '1';
  },
  'zero runtime major': (data) => {
    data.rootManifest.engines.node = '>=0.0.0';
  },
  'range instead of exact compiler': (data) => {
    data.rootManifest.devDependencies.typescript = '^7.0.2';
  },
  'missing reviewed compiler declaration': (data) => {
    delete data.e2eManifest.devDependencies.typescript;
  },
  'inconsistent Vite pin': (data) => {
    data.webManifest.devDependencies.vite = nextVersion(
      data.registry.tools.vite,
    );
  },
  'inconsistent compiler pin': (data) => {
    data.rootManifest.devDependencies.typescript = nextVersion(
      data.registry.tools.compiler,
    );
  },
  'inconsistent Playwright pin': (data) => {
    data.e2eManifest.devDependencies['@playwright/test'] = nextVersion(
      data.registry.tools.playwright,
    );
  },
  'Vitest coverage mismatch': (data) => {
    data.webManifest.devDependencies['@vitest/coverage-v8'] = nextVersion(
      data.registry.tools.vitest,
    );
  },
  'missing Vitest provider': (data) => {
    delete data.webManifest.devDependencies['@vitest/coverage-v8'];
  },
  'mutable AST compiler alias': (data) => {
    data.rootManifest.devDependencies['typescript-parser'] =
      'npm:typescript@latest';
  },
  'architecture parser package extension missing': (data) => {
    delete data.workspace.packageExtensions;
  },
  'architecture parser package extension selects an unreviewed parser': (
    data,
  ) => {
    data.workspace.packageExtensions[
      `dependency-cruiser@${data.registry.tools.dependencyCruiser}`
    ].dependencies.typescript = nextVersion(data.registry.tools.astParser);
  },
  'duplicate architecture tool selector': (data) => {
    data.workspace.packageExtensions[
      `dependency-cruiser@${nextVersion(data.registry.tools.dependencyCruiser)}`
    ] = {
      dependencies: { typescript: data.registry.tools.astParser },
    };
  },
  'inconsistent architecture extension after tool upgrade': (data) => {
    data.rootManifest.devDependencies['dependency-cruiser'] = nextVersion(
      data.registry.tools.dependencyCruiser,
    );
  },
  'mutable package manager': (data) => {
    data.rootManifest.packageManager = 'pnpm@latest';
  },
  'unregistered action repository': (data) => {
    data.qualityWorkflow.jobs.check.steps[0].uses = `vendor/checkout@${'a'.repeat(40)}`;
  },
  'mutable action release': (data) => {
    data.qualityWorkflow.jobs.check.steps[0].uses = 'actions/checkout@v7.0.2';
  },
  'action local path': (data) => {
    data.qualityWorkflow.jobs.check.steps[0].uses = './.github/custom';
  },
  'action short SHA': (data) => {
    data.qualityWorkflow.jobs.check.steps[0].uses = 'actions/checkout@1234567';
  },
  'inconsistent action pin across jobs': (data) => {
    data.qualityWorkflow.jobs.check.steps[0].uses = `actions/checkout@${nextActionCommit(data.registry.actions.checkout.commit)}`;
  },
  'missing action role': (data) => {
    for (const job of Object.values(data.guideWorkflow.jobs))
      job.steps = job.steps.filter(
        (step) => !step.uses?.startsWith('actions/deploy-pages@'),
      );
  },
  'unexpected workflow job': (data) => {
    data.guideWorkflow.jobs.unreviewed = { steps: [] };
  },
  'missing workflow job': (data) => {
    delete data.qualityWorkflow.jobs.browser;
  },
  'invalid workflow step': (data) => {
    data.qualityWorkflow.jobs.check.steps[0] = null;
  },
  'invalid workflow steps': (data) => {
    data.qualityWorkflow.jobs.check.steps = {};
  },
  'oversized workflow step collection': (data) => {
    data.qualityWorkflow.jobs.check.steps = Array(65).fill({ run: 'true' });
  },
  'runtime major disagreement': (data) => {
    data.qualityWorkflow.jobs.check.steps[1].with['node-version'] = String(
      nextNodeMajor(data),
    );
  },
  'mutable runtime release': (data) => {
    data.rootManifest.engines.node = '>=24';
  },
  'mutable runtime action option': (data) => {
    for (const step of allSteps(data))
      if (step.uses?.startsWith('actions/setup-node@'))
        step.with['node-version'] = 'lts/*';
  },
  'malformed registry': (data) => {
    delete data.registry.actions.checkout.commit;
  },
  'malformed manifest shape': (data) => {
    data.rootManifest = [];
  },
};
for (const [label, mutate] of Object.entries(invalid))
  test(`${label} blocks upgrade review without echoing arbitrary input`, () => {
    const result = candidate(mutate);
    assert.equal(result.status, 'blocked');
    assert.ok(result.issues.length > 0);
    assert.ok(result.issues.length <= 64);
    assert.equal(JSON.stringify(result).includes('lts/*'), false);
    assert.equal(JSON.stringify(result).includes('vendor/checkout'), false);
  });

test('CLI reads only registered fixture files and leaves bytes unchanged', (t) => {
  const owned = fixture();
  t.after(() => owned.dispose());
  const before = digest(owned.root);
  const result = execute(owned.root);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    status: 'current',
    changes: [],
    issues: [],
  });
  assert.deepEqual(digest(owned.root), before);
});

test('CLI review-required is exit 2 and never writes a proposed registry or receipt', (t) => {
  const owned = fixture();
  t.after(() => owned.dispose());
  for (const name of ['package.json', 'apps/web/package.json']) {
    const manifest = JSON.parse(
      readFileSync(path.join(owned.root, name), 'utf8'),
    );
    manifest.devDependencies.vite = nextVersion(inputs.registry.tools.vite);
    write(owned.root, name, JSON.stringify(manifest));
  }
  const before = digest(owned.root);
  const result = execute(owned.root);
  assert.equal(result.status, 2, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, 'review-required');
  assert.deepEqual(digest(owned.root), before);
});

for (const [label, mutate] of [
  ['malformed JSON', (root) => write(root, 'package.json', '{')],
  [
    'malformed YAML',
    (root) => write(root, 'pnpm-workspace.yaml', 'packages: ['),
  ],
  [
    'duplicate YAML keys',
    (root) =>
      write(root, 'pnpm-workspace.yaml', 'packages: []\npackages: []\n'),
  ],
  ['invalid registry', (root) => write(root, REVIEWED_PATH, '{}')],
  [
    'oversized registered input',
    (root) => write(root, 'package.json', ' '.repeat(2 * 1024 * 1024 + 1)),
  ],
  [
    'linked input ancestor',
    (root) => {
      const directory = path.join(root, 'apps/web');
      const original = path.join(root, 'apps/original-web');
      renameSync(directory, original);
      symlinkSync(original, directory, 'junction');
    },
  ],
]) {
  test(`actual CLI rejects ${label} and reports bounded diagnostics`, (t) => {
    const owned = fixture();
    t.after(() => owned.dispose());
    mutate(owned.root);
    const result = execute(owned.root);
    assert.equal(result.status, 1, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.status, 'blocked');
    assert.equal(report.issues.length, 1);
    assert.ok(result.stdout.length < 2048);
  });
}

test('actual CLI blocks secret-shaped malformed declarations without exposing them', (t) => {
  const owned = fixture();
  t.after(() => owned.dispose());
  const manifest = structuredClone(inputs.rootManifest);
  const sentinel = 'unexpected-private-proposal-value';
  manifest.devDependencies.typescript = sentinel;
  write(owned.root, 'package.json', JSON.stringify(manifest));
  const before = digest(owned.root);
  const result = execute(owned.root);
  assert.equal(result.status, 1);
  assert.equal(`${result.stdout}${result.stderr}`.includes(sentinel), false);
  assert.deepEqual(digest(owned.root), before);
});

test('CLI rejects unknown, duplicate and missing arguments', (t) => {
  const owned = fixture();
  t.after(() => owned.dispose());
  for (const options of [['--unknown'], ['--json'], ['--root']]) {
    const result = execute(owned.root, options);
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes('no clean result'));
  }
});

for (const role of ['node', 'upload', 'pages', 'uploadPages', 'deployPages'])
  test(`coordinated immutable action role ${role} remains review-required`, () => {
    const result = candidate((data) =>
      coordinateAction(
        data,
        data.registry.actions[role].repository,
        `v${Number(data.registry.actions[role].version.split('.')[0]) + 1}`,
      ),
    );
    assert.equal(result.status, 'review-required');
    assert.deepEqual(result.issues, []);
    assert.equal(result.changes.length, 1);
    assert.equal(result.changes[0].role, `action:${role}`);
  });

test('oversized apparently exact versions are blocked with bounded diagnostics', () => {
  const result = candidate((data) => {
    data.rootManifest.packageManager = `pnpm@${'9'.repeat(4096)}.0.0`;
  });
  assert.equal(result.status, 'blocked');
  assert.ok(JSON.stringify(result).length < 2048);
});

test('actual CLI rejects an unknown action without exposing repository substitution', (t) => {
  const owned = fixture();
  t.after(() => owned.dispose());
  const workflow = structuredClone(inputs.qualityWorkflow);
  workflow.jobs.check.steps[0].uses = `private-provider/secret-action@${'a'.repeat(40)}`;
  write(owned.root, names.qualityWorkflow, stringify(workflow));
  const before = digest(owned.root);
  const result = execute(owned.root);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).status, 'blocked');
  assert.equal(result.stdout.includes('private-provider'), false);
  assert.deepEqual(digest(owned.root), before);
});

test('actual entrypoint handles a malformed real registry without raw setup errors', (t) => {
  const owned = fixture();
  t.after(() => owned.dispose());
  for (const name of [
    'tools/verification/upgrades-cli.mjs',
    'tools/verification/upgrades.mjs',
    'tools/verification/reviewed-dependencies.mjs',
    'tools/security/owned.mjs',
  ])
    write(owned.root, name, readFileSync(path.join(repository, name), 'utf8'));
  const modules = path.join(owned.root, 'node_modules');
  mkdirSync(modules);
  symlinkSync(
    path.join(repository, 'node_modules/yaml'),
    path.join(modules, 'yaml'),
    'junction',
  );
  write(owned.root, REVIEWED_PATH, '{"unexpected-private-registry-content":');
  const result = spawnSync(
    process.execPath,
    [path.join(owned.root, 'tools/verification/upgrades-cli.mjs'), '--json'],
    { encoding: 'utf8', timeout: 15_000, windowsHide: true },
  );
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(
    result.stderr.includes('unexpected-private-registry-content'),
    false,
  );
  assert.equal(result.stderr.includes('at '), false);
  assert.equal(result.stderr.includes('no clean result'), true);
});

test('coordinated Node declaration maintenance matches runtime without registry approval', () => {
  const result = candidate((data) => {
    const version = nextVersion(
      data.rootManifest.devDependencies['@types/node'],
    );
    for (const owner of ['rootManifest', 'e2eManifest'])
      data[owner].devDependencies['@types/node'] = version;
  });
  assert.deepEqual(result, { status: 'current', changes: [], issues: [] });
});

test('actual CLI rejects future-major Node declarations and preserves source bytes', (t) => {
  const owned = fixture();
  t.after(() => owned.dispose());
  for (const name of [names.rootManifest, names.e2eManifest]) {
    const manifest = JSON.parse(
      readFileSync(path.join(owned.root, name), 'utf8'),
    );
    manifest.devDependencies['@types/node'] = `${nextNodeMajor(inputs)}.0.0`;
    write(owned.root, name, JSON.stringify(manifest));
  }
  const before = digest(owned.root);
  const result = execute(owned.root);
  assert.equal(result.status, 1, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'blocked');
  assert.deepEqual(
    report.issues.map(({ code, role }) => ({ code, role })),
    [{ code: 'runtime-types-major-mismatch', role: 'nodeTypes' }],
  );
  assert.deepEqual(digest(owned.root), before);
});

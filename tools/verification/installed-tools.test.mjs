import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, renameSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { temporary } from '../security/owned.mjs';
import { inspectInstalledTools } from './installed-tools.mjs';
import { REVIEWED } from './reviewed-dependencies.mjs';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const rootPackages = {
  typescript: ['typescript', REVIEWED.tools.compiler],
  'typescript-parser': ['typescript', REVIEWED.tools.astParser],
  'dependency-cruiser': [
    'dependency-cruiser',
    REVIEWED.tools.dependencyCruiser,
  ],
  vite: ['vite', REVIEWED.tools.vite],
  '@axe-core/playwright': ['@axe-core/playwright', REVIEWED.tools.axe],
  yauzl: ['yauzl', REVIEWED.tools.archive],
  '@playwright/test': ['@playwright/test', REVIEWED.tools.playwright],
};
const webPackages = {
  typescript: ['typescript', REVIEWED.tools.compiler],
  vite: ['vite', REVIEWED.tools.vite],
  vitest: ['vitest', REVIEWED.tools.vitest],
  '@vitest/coverage-v8': ['@vitest/coverage-v8', REVIEWED.tools.vitest],
};
const e2ePackages = {
  typescript: ['typescript', REVIEWED.tools.compiler],
  '@playwright/test': ['@playwright/test', REVIEWED.tools.playwright],
};

function metadata(directory, name, version, extra = {}) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify({ name, version, ...extra }),
  );
}
function fixture(context) {
  const owner = temporary('fleetiq-installed-test-');
  context.after(owner.dispose);
  const root = path.join(owner.root, 'repository');
  for (const [scope, packages] of [
    ['', rootPackages],
    ['apps/web', webPackages],
    ['apps/web-e2e', e2ePackages],
  ]) {
    const directory = path.join(root, scope);
    metadata(directory, 'private-installed-fixture', '0.0.0');
    for (const [dependency, [name, version]] of Object.entries(packages))
      metadata(path.join(directory, 'node_modules', dependency), name, version);
  }
  metadata(
    path.join(root, 'node_modules/dependency-cruiser/node_modules/typescript'),
    'typescript',
    REVIEWED.tools.astParser,
  );
  return {
    root,
    owner: owner.root,
    package(scope, name) {
      return path.join(root, scope, 'node_modules', name);
    },
  };
}

test('actual installed critical tools agree with the reviewed inventory', () => {
  assert.deepEqual(inspectInstalledTools(repositoryRoot), []);
});

test('each declared owner has a complete metadata-only qualifying installation', (context) => {
  const owner = fixture(context);
  assert.deepEqual(inspectInstalledTools(owner.root), []);
});

for (const [scope, dependency, role] of [
  ['', 'typescript', 'compiler'],
  ['', 'typescript-parser', 'astParser'],
  ['', 'dependency-cruiser', 'dependencyCruiser'],
  ['', 'vite', 'vite'],
  ['', '@axe-core/playwright', 'axe'],
  ['', 'yauzl', 'archive'],
  ['', '@playwright/test', 'playwright'],
  ['apps/web', 'typescript', 'compiler'],
  ['apps/web', 'vite', 'vite'],
  ['apps/web', 'vitest', 'vitest'],
  ['apps/web', '@vitest/coverage-v8', 'coverageProvider'],
  ['apps/web-e2e', 'typescript', 'compiler'],
  ['apps/web-e2e', '@playwright/test', 'playwright'],
]) {
  test(`a stale installed ${dependency} cannot qualify ${scope || 'root'}`, (context) => {
    const owner = fixture(context);
    metadata(
      owner.package(scope, dependency),
      dependency === 'typescript-parser' ? 'typescript' : dependency,
      '0.0.0',
    );
    assert.deepEqual(inspectInstalledTools(owner.root), [
      {
        role,
        location: scope ? `${scope}/package.json` : 'package.json',
        code: 'installed-pin-mismatch',
      },
    ]);
  });
}

test('an upgraded reviewed parser cannot qualify an older installed alias', (context) => {
  const owner = fixture(context);
  const proposed = structuredClone(REVIEWED);
  proposed.tools.astParser = '0.0.0';
  assert.deepEqual(inspectInstalledTools(owner.root, proposed), [
    {
      role: 'astParser',
      location: 'package.json',
      code: 'installed-pin-mismatch',
    },
    {
      role: 'astParser',
      location: 'dependency-cruiser/package.json',
      code: 'installed-pin-mismatch',
    },
  ]);
});

test('aliases require the real package identity and do not accept impersonated metadata', (context) => {
  const owner = fixture(context);
  metadata(
    owner.package('', 'typescript-parser'),
    'private-parser-marker',
    REVIEWED.tools.astParser,
  );
  const report = inspectInstalledTools(owner.root);
  assert.deepEqual(report, [
    {
      role: 'astParser',
      location: 'package.json',
      code: 'installed-pin-mismatch',
    },
  ]);
  assert.equal(JSON.stringify(report).includes('private-parser-marker'), false);
});

test('hidden package.json exports qualify without executing package entrypoints', (context) => {
  const owner = fixture(context);
  const directory = owner.package('', 'vite');
  metadata(directory, 'vite', REVIEWED.tools.vite, {
    exports: { '.': './never-executed.cjs' },
    main: './never-executed.cjs',
  });
  writeFileSync(
    path.join(directory, 'never-executed.cjs'),
    'throw new Error("private candidate execution marker");',
  );
  assert.deepEqual(inspectInstalledTools(owner.root), []);
});

test('intentional package-manager directory links qualify by exact target identity', (context) => {
  const owner = fixture(context);
  const source = owner.package('', 'typescript-parser');
  const target = path.join(owner.owner, 'parser-store');
  renameSync(source, target);
  symlinkSync(
    target,
    source,
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  assert.deepEqual(inspectInstalledTools(owner.root), []);
});

for (const [label, value] of [
  ['malformed JSON', '{private malformed metadata marker'],
  ['missing identity', JSON.stringify({ version: REVIEWED.tools.astParser })],
  ['missing version', JSON.stringify({ name: 'typescript' })],
  ['array metadata', '[]'],
  [
    'oversized metadata',
    `${JSON.stringify({ name: 'typescript', version: REVIEWED.tools.astParser })}${' '.repeat(64 * 1024)}`,
  ],
]) {
  test(`${label} is unavailable rather than accepted or echoed`, (context) => {
    const owner = fixture(context);
    writeFileSync(
      path.join(owner.package('', 'typescript-parser'), 'package.json'),
      value,
    );
    const report = inspectInstalledTools(owner.root);
    assert.deepEqual(report, [
      {
        role: 'astParser',
        location: 'package.json',
        code: 'installed-tool-unavailable',
      },
    ]);
    assert.equal(JSON.stringify(report).includes('private'), false);
  });
}

test('missing declared owner cannot borrow its ancestors without ownership', (context) => {
  const owner = fixture(context);
  renameSync(
    path.join(owner.root, 'apps/web-e2e/package.json'),
    path.join(owner.root, 'apps/web-e2e/not-package.json'),
  );
  assert.deepEqual(inspectInstalledTools(owner.root), [
    {
      role: 'compiler',
      location: 'apps/web-e2e/package.json',
      code: 'installed-tool-unavailable',
    },
    {
      role: 'playwright',
      location: 'apps/web-e2e/package.json',
      code: 'installed-tool-unavailable',
    },
  ]);
});

test('missing repository packages cannot be supplied by outside ancestor node_modules', (context) => {
  const owner = fixture(context);
  const source = owner.package('', 'typescript-parser');
  const external = path.join(owner.owner, 'node_modules/typescript-parser');
  mkdirSync(path.dirname(external), { recursive: true });
  renameSync(source, external);
  assert.deepEqual(inspectInstalledTools(owner.root), [
    {
      role: 'astParser',
      location: 'package.json',
      code: 'installed-tool-unavailable',
    },
  ]);
});

test('NODE_PATH packages outside repository lookup scope cannot qualify a missing tool', (context) => {
  const owner = fixture(context);
  const source = owner.package('', 'typescript-parser');
  const global = path.join(owner.owner, 'global-packages');
  mkdirSync(global);
  renameSync(source, path.join(global, 'typescript-parser'));
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { inspectInstalledTools } from ${JSON.stringify(new URL('./installed-tools.mjs', import.meta.url).href)}; process.stdout.write(JSON.stringify(inspectInstalledTools(process.argv[1])));`,
      owner.root,
    ],
    {
      env: { ...process.env, NODE_PATH: global },
      encoding: 'utf8',
      timeout: 30_000,
      maxBuffer: 16_384,
      shell: false,
      windowsHide: true,
    },
  );
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), [
    {
      role: 'astParser',
      location: 'package.json',
      code: 'installed-tool-unavailable',
    },
  ]);
});

test('a broken closer package fails instead of borrowing a correct root package', (context) => {
  const owner = fixture(context);
  renameSync(
    path.join(owner.package('apps/web', 'typescript'), 'package.json'),
    path.join(owner.package('apps/web', 'typescript'), 'not-package.json'),
  );
  assert.deepEqual(inspectInstalledTools(owner.root), [
    {
      role: 'compiler',
      location: 'apps/web/package.json',
      code: 'installed-tool-unavailable',
    },
  ]);
});

test('invalid registry cannot approve an installed inventory', (context) => {
  const owner = fixture(context);
  assert.throws(
    () => inspectInstalledTools(owner.root, {}),
    /registry.*malformed/u,
  );
});

test('dependency-cruiser must resolve its own reviewed parser independently of the root alias', (context) => {
  const owner = fixture(context);
  metadata(
    path.join(
      owner.package('', 'dependency-cruiser'),
      'node_modules/typescript',
    ),
    'typescript',
    '0.0.0',
  );
  assert.deepEqual(inspectInstalledTools(owner.root), [
    {
      role: 'astParser',
      location: 'dependency-cruiser/package.json',
      code: 'installed-pin-mismatch',
    },
  ]);
});

test('a missing cruiser extension cannot borrow the native root compiler', (context) => {
  const owner = fixture(context);
  const proposed = structuredClone(REVIEWED);
  proposed.tools.compiler =
    proposed.tools.astParser === '0.0.0' ? '0.0.1' : '0.0.0';
  for (const scope of ['', 'apps/web', 'apps/web-e2e'])
    metadata(
      owner.package(scope, 'typescript'),
      'typescript',
      proposed.tools.compiler,
    );
  const privateParser = path.join(
    owner.package('', 'dependency-cruiser'),
    'node_modules/typescript',
  );
  renameSync(privateParser, path.join(owner.owner, 'removed-private-parser'));
  assert.deepEqual(inspectInstalledTools(owner.root, proposed), [
    {
      role: 'astParser',
      location: 'dependency-cruiser/package.json',
      code: 'installed-pin-mismatch',
    },
  ]);
});

test('a malformed cruiser parser cannot qualify from a different package scope', (context) => {
  const owner = fixture(context);
  writeFileSync(
    path.join(
      owner.package('', 'dependency-cruiser'),
      'node_modules/typescript/package.json',
    ),
    '{malformed',
  );
  assert.deepEqual(inspectInstalledTools(owner.root), [
    {
      role: 'astParser',
      location: 'dependency-cruiser/package.json',
      code: 'installed-tool-unavailable',
    },
  ]);
});

test('a linked cruiser package resolves its own private parser without ambient lookup', (context) => {
  const owner = fixture(context);
  const source = owner.package('', 'dependency-cruiser');
  const target = path.join(owner.owner, 'cruiser-store');
  renameSync(source, target);
  symlinkSync(
    target,
    source,
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  assert.deepEqual(inspectInstalledTools(owner.root), []);
});

test('pnpm-style cruiser package links use the parser beside the resolved package', (context) => {
  const owner = fixture(context);
  const source = owner.package('', 'dependency-cruiser');
  const container = path.join(
    owner.owner,
    'private-cruiser',
    process.platform === 'win32' ? 'NODE_MODULES' : 'node_modules',
  );
  mkdirSync(container, { recursive: true });
  renameSync(
    path.join(source, 'node_modules/typescript'),
    path.join(container, 'typescript'),
  );
  const target = path.join(container, 'dependency-cruiser');
  renameSync(source, target);
  symlinkSync(
    target,
    source,
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  assert.deepEqual(inspectInstalledTools(owner.root), []);
});

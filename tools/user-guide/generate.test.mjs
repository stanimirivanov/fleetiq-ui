import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { assembleBook } from './assemble-book.mjs';
import { chapters, fixture, manifest, report, source } from './fixtures.mjs';
import { executeGuideStage, generateGuide } from './generate.mjs';
import { requireQualification } from './qualification.mjs';
import { validateReady } from './release.mjs';

const launcher = { command: process.execPath, args: [] };
const qualify = () => ({ tools: { pnpm: '12.5.1' }, launcher, blocker: null });
const inspect = async () => {};
const snapshot = () => source;
async function generated(context, overrides = {}) {
  const { root, output } = await fixture(context);
  const calls = [];
  const execute = async (_root, actual, args, environment) => {
    assert.deepEqual(actual, launcher);
    assert.equal(environment.FLEETIQ_E2E_MODE, 'user-guide');
    calls.push(args);
    if (args.includes('apps/web-e2e/playwright.development.config.ts'))
      await chapters(output);
  };
  await generateGuide(root, {
    qualify,
    snapshot,
    execute,
    inspect,
    ...overrides,
  });
  return { root, output, calls };
}

test('generator modules are import-safe and do not delete or execute output on import', async (context) => {
  const { root, output } = await fixture(context);
  const module = new URL('./generate.mjs', import.meta.url).href;
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `await import(${JSON.stringify(module)})`],
    { cwd: root, encoding: 'utf8', shell: false },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    existsSync(path.join(output, 'fleet-overview', 'guide.json')),
    true,
  );
  assert.equal(existsSync(path.join(output, '.ready.json')), false);
});
test('generator executes the exact ordered build and capture stages and emits qualified readiness', async (context) => {
  const { root, output, calls } = await generated(context);
  assert.deepEqual(calls, [
    ['run', 'build'],
    [
      'exec',
      'playwright',
      'test',
      '--config',
      'apps/web-e2e/playwright.config.ts',
      '--grep',
      '@user-guide',
    ],
    [
      'exec',
      'playwright',
      'test',
      '--config',
      'apps/web-e2e/playwright.development.config.ts',
      '--grep',
      '@user-guide',
    ],
  ]);
  const ready = await validateReady(root, {
    snapshot,
    inspect,
    requireClean: true,
  });
  assert.deepEqual(ready.source, source);
  assert.ok(ready.files.some((file) => file.path === 'index.html'));
  assert.equal(existsSync(path.join(output, '.ready.json')), true);
  assert.equal(
    await readFile(path.join(root, 'dist', 'unrelated.txt'), 'utf8'),
    'preserve this output',
  );
});
for (const stage of [0, 1, 2]) {
  test(`failed stage ${stage} stops later commands and discards only partial owned output`, async (context) => {
    const { root, output } = await fixture(context);
    let calls = 0;
    await assert.rejects(
      generateGuide(root, {
        qualify,
        snapshot,
        inspect,
        execute: async () => {
          if (calls++ === stage) throw new Error('synthetic nonzero');
        },
      }),
      /discarded/u,
    );
    assert.equal(calls, stage + 1);
    assert.equal(existsSync(output), false);
    assert.equal(
      await readFile(path.join(root, 'dist', 'unrelated.txt'), 'utf8'),
      'preserve this output',
    );
  });
}
for (const label of ['missing tool', 'wrong pin']) {
  test(`unqualified ${label} preserves existing output and cannot emit readiness`, async (context) => {
    const { root, output } = await fixture(context);
    let called = false;
    await assert.rejects(
      generateGuide(root, {
        snapshot,
        qualify: () => ({ blocker: 'pinned-pnpm-unavailable' }),
        execute: async () => {
          called = true;
        },
      }),
      /qualification/u,
    );
    assert.equal(called, false);
    assert.equal(existsSync(path.join(output, '.ready.json')), false);
    assert.equal(
      existsSync(path.join(output, 'fleet-overview', 'guide.json')),
      true,
    );
  });
}
test('real subprocess launch and nonzero failures are not success', async (context) => {
  const { root } = await fixture(context);
  assert.throws(
    () =>
      executeGuideStage(
        root,
        { command: path.join(root, 'missing-executable'), args: [] },
        [],
        process.env,
      ),
    /successfully/u,
  );
  assert.throws(
    () =>
      executeGuideStage(
        root,
        { command: process.execPath, args: ['-e', 'process.exit(7)'] },
        [],
        process.env,
      ),
    /successfully/u,
  );
});
test('subprocess argument boundaries remain shell-free', async (context) => {
  const { root } = await fixture(context);
  const file = path.join(root, 'args.json');
  const special = 'literal & echo injected $(whoami)';
  const program = `require('node:fs').writeFileSync(${JSON.stringify(file)}, JSON.stringify(process.argv.slice(1)))`;
  executeGuideStage(
    root,
    { command: process.execPath, args: ['-e', program] },
    [special],
    process.env,
  );
  assert.deepEqual(JSON.parse(await readFile(file, 'utf8')), [special]);
});
for (const [label, override] of [
  ['missing recorded chapters', { execute: async () => {} }],
  [
    'assembly failure',
    {
      assemble: async () => {
        throw new Error('synthetic assembly failure');
      },
    },
  ],
  [
    'scanner failure',
    {
      inspect: async () => {
        throw new Error('synthetic scanner unavailable');
      },
    },
  ],
  [
    'source drift',
    {
      snapshot: (() => {
        let count = 0;
        return () =>
          count++ === 0 ? source : { ...source, digest: 'c'.repeat(64) };
      })(),
    },
  ],
]) {
  test(`${label} cannot leave a readiness marker`, async (context) => {
    const { root, output } = await fixture(context);
    await assert.rejects(
      generateGuide(root, {
        qualify,
        snapshot,
        inspect,
        execute: async (_root, _launcher, args) => {
          if (args.includes('apps/web-e2e/playwright.development.config.ts'))
            await chapters(output);
        },
        ...override,
      }),
    );
    assert.equal(existsSync(output), false);
    assert.equal(existsSync(path.join(root, 'dist', 'unrelated.txt')), true);
  });
}
for (const [label, change] of [
  [
    'missing acceptance',
    async (root) =>
      rm(path.join(root, '.verification', 'acceptance-123-fixture.json')),
  ],
  [
    'missing browser',
    async (root) =>
      rm(path.join(root, '.verification', 'browser-123-fixture.json')),
  ],
  [
    'malformed report',
    async (root) =>
      writeFile(
        path.join(root, '.verification', 'acceptance-123-fixture.json'),
        '{invalid',
      ),
  ],
  [
    'stale source',
    async (root) =>
      writeFile(
        path.join(root, '.verification', 'acceptance-123-fixture.json'),
        JSON.stringify(
          report('acceptance', { ...source, digest: 'c'.repeat(64) }),
        ),
      ),
  ],
  [
    'failed stage',
    async (root) => {
      const value = report('acceptance');
      value.checks[0].status = 'failed';
      await writeFile(
        path.join(root, '.verification', 'acceptance-123-fixture.json'),
        JSON.stringify(value),
      );
    },
  ],
  [
    'changed command',
    async (root) => {
      const value = report('acceptance');
      value.checks[0].command = 'pnpm run skip';
      await writeFile(
        path.join(root, '.verification', 'acceptance-123-fixture.json'),
        JSON.stringify(value),
      );
    },
  ],
  [
    'partial group',
    async (root) => {
      const value = report('acceptance');
      value.checks.pop();
      await writeFile(
        path.join(root, '.verification', 'acceptance-123-fixture.json'),
        JSON.stringify(value),
      );
    },
  ],
]) {
  test(`qualification rejects ${label}`, async (context) => {
    const { root } = await fixture(context);
    await change(root);
    assert.throws(
      () => requireQualification(root, source, manifest),
      /requires complete/u,
    );
  });
}
for (const [label, mutate] of [
  [
    'missing marker',
    async (root) => rm(path.join(root, 'dist/user-guide/.ready.json')),
  ],
  [
    'malformed marker',
    async (root) =>
      writeFile(path.join(root, 'dist/user-guide/.ready.json'), '{}'),
  ],
  ['stale source', null],
  [
    'changed output bytes',
    async (root) =>
      writeFile(path.join(root, 'dist/user-guide/index.html'), 'tampered'),
  ],
  [
    'new uninspected output',
    async (root) =>
      writeFile(path.join(root, 'dist/user-guide/extra.txt'), 'uninspected'),
  ],
  [
    'changed qualification bytes',
    async (root) => {
      const file = path.join(root, '.verification/acceptance-123-fixture.json');
      await writeFile(file, `${await readFile(file, 'utf8')}\n`);
    },
  ],
]) {
  test(`release rejects ${label}`, async (context) => {
    const { root } = await generated(context);
    await mutate?.(root);
    await assert.rejects(
      validateReady(root, {
        snapshot:
          label === 'stale source'
            ? () => ({ ...source, digest: 'c'.repeat(64) })
            : snapshot,
        inspect,
      }),
    );
  });
}
test('clean publication rejects dirty source while local exact-source validation remains permitted', async (context) => {
  const dirty = { ...source, dirty: true };
  const { root, output } = await fixture(context);
  for (const group of ['acceptance', 'browser'])
    await writeFile(
      path.join(root, '.verification', `${group}-123-fixture.json`),
      JSON.stringify(report(group, dirty)),
    );
  await generateGuide(root, {
    qualify,
    snapshot: () => dirty,
    inspect,
    execute: async (_root, _launcher, args) => {
      if (args.includes('apps/web-e2e/playwright.development.config.ts'))
        await chapters(output);
    },
    assemble: assembleBook,
  });
  await validateReady(root, { snapshot: () => dirty, inspect });
  await assert.rejects(
    validateReady(root, { snapshot: () => dirty, inspect, requireClean: true }),
    /clean source/u,
  );
});

test('output mutation during generation inspection cannot produce readiness', async (context) => {
  const { root, output } = await fixture(context);
  await assert.rejects(
    generateGuide(root, {
      qualify,
      snapshot,
      execute: async (_root, _launcher, args) => {
        if (args.includes('apps/web-e2e/playwright.development.config.ts'))
          await chapters(output);
      },
      inspect: async () => {
        await writeFile(
          path.join(output, 'index.html'),
          'mutated while inspecting',
        );
      },
    }),
  );
  assert.equal(existsSync(output), false);
});
for (const target of [
  'dist/user-guide/index.html',
  'dist/user-guide/.ready.json',
  '.verification/acceptance-123-fixture.json',
]) {
  test(`release rejects late mutation of ${target}`, async (context) => {
    const { root } = await generated(context);
    await assert.rejects(
      validateReady(root, {
        snapshot,
        inspect: async () => {
          await writeFile(path.join(root, target), 'late mutation');
        },
      }),
      /changed during/u,
    );
  });
}
test('release rejects a readiness qualification that redirects to a sibling', async (context) => {
  const { root, output } = await generated(context);
  const file = path.join(output, '.ready.json');
  const value = JSON.parse(await readFile(file, 'utf8'));
  value.qualification.acceptance.path = '../other/acceptance.json';
  await writeFile(file, JSON.stringify(value));
  await assert.rejects(
    validateReady(root, { snapshot, inspect }),
    /qualification is invalid/u,
  );
});

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { executeCheck, qualifyTools } from './execution.mjs';
import { pnpmLaunchers } from './pnpm-launchers.mjs';

const manifest = { packageManager: 'pnpm@12.5.1' };

function fixture(context) {
  const root = mkdtempSync(path.join(tmpdir(), 'fleetiq-pnpm-test-'));
  context.after(() => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(tmpdir()));
    assert.ok(path.basename(root).startsWith('fleetiq-pnpm-test-'));
    rmSync(root, { recursive: true, force: true });
  });
  const bin = path.join(root, 'bin with spaces & literal');
  mkdirSync(bin);
  const environment = { ...process.env, PATH: bin };
  delete environment.Path;
  delete environment.npm_execpath;
  return { root, bin, environment };
}

function writeLauncher(file, version = '12.5.1', exitCode = 0) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(
    file,
    `import { writeFileSync } from 'node:fs';
if (process.argv[2] === '--version') {
  process.stdout.write(${JSON.stringify(version)} + '\\n');
  process.exit(${exitCode});
}
writeFileSync('executed.json', JSON.stringify(process.argv.slice(2)));
`,
  );
}

/** Git qualification is orthogonal; all pnpm probes below use actual Node processes. */
function runLauncher(command, args, options) {
  if (command === 'git') return { status: 0, stdout: 'git version 2.55.0\n' };
  assert.equal(options.shell, false);
  return spawnSync(command, args, options);
}

test('npm_execpath supports the pnpm 12 .mjs entry without a PATH install', async (context) => {
  const { root, environment } = fixture(context);
  const entry = path.join(root, 'entry with spaces & literal.mjs');
  writeLauncher(entry);
  const qualified = qualifyTools(root, manifest, runLauncher, {
    environment: { ...environment, npm_execpath: entry },
  });
  assert.equal(qualified.blocker, null);
  assert.deepEqual(qualified.launcher, {
    command: process.execPath,
    args: [entry],
  });
  assert.equal(
    (await executeCheck(root, qualified.launcher, 'fixture')).status,
    'passed',
  );
  assert.deepEqual(JSON.parse(readFileSync(path.join(root, 'executed.json'))), [
    'run',
    'fixture',
  ]);
});

test('PATH Corepack links resolve to the real JavaScript entry', async (context) => {
  const { root, bin, environment } = fixture(context);
  const library = path.join(root, 'lib', 'node_modules', 'corepack', 'dist');
  const entry = path.join(library, 'pnpm.cjs');
  // This fixture is CommonJS so the resolved filename, rather than the link name,
  // determines its parser. Corepack places its package outside Node's bin folder.
  mkdirSync(library, { recursive: true });
  writeFileSync(
    entry,
    "if(process.argv[2] === '--version') process.stdout.write('12.5.1\\n'); else require('node:fs').writeFileSync('executed.json', JSON.stringify(process.argv.slice(2)));\n",
  );
  symlinkSync(entry, path.join(bin, 'pnpm'));
  const qualified = qualifyTools(root, manifest, runLauncher, { environment });
  assert.equal(qualified.blocker, null);
  assert.equal(qualified.launcher.command, process.execPath);
  assert.equal(qualified.launcher.args[0], path.join(library, 'pnpm.cjs'));
  assert.equal(
    (await executeCheck(root, qualified.launcher, 'fixture')).status,
    'passed',
  );
});

test('a native PATH launcher runs directly with an argument array', async (context) => {
  const { root, bin, environment } = fixture(context);
  const executable = path.join(bin, 'pnpm');
  // A real ELF binary proves shell-free dispatch, not pnpm's implementation.
  // Only the version response is substituted to isolate qualification policy.
  copyFileSync(process.execPath, executable);
  const probes = [];
  const qualified = qualifyTools(
    root,
    manifest,
    (command, args, options) => {
      probes.push({ command, args, shell: options.shell });
      return {
        status: 0,
        stdout: command === 'git' ? 'git version 2.55.0\n' : '12.5.1\n',
      };
    },
    { environment },
  );
  assert.equal(qualified.blocker, null);
  assert.deepEqual(qualified.launcher, { command: executable, args: [] });
  assert.deepEqual(probes[1], {
    command: executable,
    args: ['--version'],
    shell: false,
  });
  const record =
    "require('node:fs').writeFileSync('executed.json', JSON.stringify(process.argv.slice(1)))";
  const result = await executeCheck(
    root,
    { ...qualified.launcher, args: ['--eval', record] },
    'fixture',
  );
  assert.equal(result.status, 'passed');
  assert.deepEqual(JSON.parse(readFileSync(path.join(root, 'executed.json'))), [
    'run',
    'fixture',
  ]);
});

for (const [label, version, exitCode] of [
  ['wrong version', '12.5.0', 0],
  ['nonzero exit', '12.5.1', 1],
  ['extra output', '12.5.1\nprivate payload', 0],
]) {
  test(`${label} cannot qualify or leak launcher output into evidence`, (context) => {
    const { root, environment } = fixture(context);
    const entry = path.join(root, 'entry.mjs');
    writeLauncher(entry, version, exitCode);
    const qualified = qualifyTools(root, manifest, runLauncher, {
      environment: { ...environment, npm_execpath: entry },
    });
    assert.equal(qualified.blocker, 'pinned-pnpm-unavailable');
    assert.equal(qualified.tools.pnpm, null);
    assert.equal(JSON.stringify(qualified).includes('private payload'), false);
  });
}

test('missing files, directory entries and shell shims cannot qualify', (context) => {
  const { root, bin, environment } = fixture(context);
  mkdirSync(path.join(bin, 'pnpm'));
  for (const extension of ['cmd', 'bat', 'ps1']) {
    const shim = path.join(bin, `pnpm.${extension}`);
    writeFileSync(shim, 'do not execute\n');
    assert.deepEqual(
      pnpmLaunchers(root, {
        environment: { ...environment, npm_execpath: shim },
      }),
      [],
    );
  }
  const qualified = qualifyTools(root, manifest, runLauncher, {
    environment: {
      ...environment,
      npm_execpath: path.join(root, 'missing.mjs'),
    },
  });
  assert.equal(qualified.blocker, 'pinned-pnpm-unavailable');
});

test('Corepack installs qualify the adjacent Corepack JavaScript entry', (context) => {
  const { root, bin, environment } = fixture(context);
  writeFileSync(path.join(bin, 'pnpm.cmd'), 'do not execute\n');
  const entry = path.join(bin, 'node_modules', 'corepack', 'dist', 'pnpm.js');
  mkdirSync(path.dirname(entry), { recursive: true });
  writeFileSync(entry, "process.stdout.write('12.5.1\\n');\n");
  const launchers = pnpmLaunchers(root, { environment });
  assert.deepEqual(launchers, [{ command: process.execPath, args: [entry] }]);
});

test('an unavailable child is not-run, never a passing check', async (context) => {
  const { root } = fixture(context);
  const result = await executeCheck(
    root,
    { command: path.join(root, 'missing-pnpm'), args: [] },
    'fixture',
  );
  assert.deepEqual(result, {
    status: 'not-run',
    reason: 'launch-failed',
    exitCode: null,
  });
});

test('an earlier wrong version cannot hide a later pinned Corepack launcher', (context) => {
  const { root, bin, environment } = fixture(context);
  const wrong = path.join(root, 'wrong.mjs');
  const pinned = path.join(bin, 'node_modules', 'corepack', 'dist', 'pnpm.js');
  writeLauncher(wrong, '12.5.0');
  mkdirSync(path.dirname(pinned), { recursive: true });
  writeFileSync(pinned, "process.stdout.write('12.5.1\\n');\n");
  const qualified = qualifyTools(root, manifest, runLauncher, {
    environment: { ...environment, npm_execpath: wrong },
  });
  assert.equal(qualified.blocker, null);
  assert.deepEqual(qualified.launcher, {
    command: process.execPath,
    args: [pinned],
  });
});

test('duplicate PATH entries and npm_execpath qualify one canonical launcher', (context) => {
  const { root, bin, environment } = fixture(context);
  const pinned = path.join(bin, 'node_modules', 'corepack', 'dist', 'pnpm.js');
  mkdirSync(path.dirname(pinned), { recursive: true });
  writeFileSync(pinned, "process.stdout.write('12.5.1\\n');\n");
  assert.deepEqual(
    pnpmLaunchers(root, {
      environment: {
        ...environment,
        PATH: [bin, bin].join(path.delimiter),
        npm_execpath: pinned,
      },
    }),
    [{ command: process.execPath, args: [pinned] }],
  );
});

import assert from 'node:assert/strict';
import {
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ownedFixture } from '../sensors/fixtures.mjs';
import { detectorScan, safeReport } from './detector.mjs';
import { qualifyDetector, verifyArchive } from './install.mjs';
import { DEFAULT_POLICY } from './policy.mjs';
import { git } from './process.mjs';
import { checkSecrets, copyIndex, scanDirectory } from './secrets.mjs';

const repository = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const token = () =>
  ['ghp', '_', 'a1B2c3D4e5', 'F6g7H8i9J0', 'k1L2m3N4o5', 'P6q7R8s9T0'].join('');

test('checksum mismatch cannot qualify an ambient detector', () =>
  assert.throws(() => verifyArchive(Buffer.from('wrong'), '0'.repeat(64))));
test('detector metadata redacts values in hostile paths and never includes raw match', () => {
  const secret = token();
  const report = safeReport(
    JSON.stringify([
      {
        RuleID: 'github-pat',
        StartLine: 2,
        File: `a/${secret}.txt`,
        Secret: secret,
        Match: 'PRIVATE',
        Author: 'PRIVATE',
      },
    ]),
    23,
  );
  assert.ok(!JSON.stringify(report).includes(secret));
  assert.ok(!JSON.stringify(report).includes('PRIVATE'));
  assert.ok(report.locations[0].includes('REDACTED'));
});
for (const [value, status] of [
  ['{}', 0],
  ['[]', 23],
  ['[{}]', 23],
  ['not-json', 0],
])
  test('malformed or contradictory detector report cannot pass', () =>
    assert.throws(() => safeReport(value, status)));
test('real pinned scanner ignores inline/config/env bypass and rejects synthetic secret privately', async (context) => {
  const root = await ownedFixture(context);
  const detector = qualifyDetector(repository);
  context.after(() => detector.dispose());
  writeFileSync(path.join(root, 'safe.txt'), 'synthetic test content\n');
  assert.equal(scanDirectory(root, { detector }).files, 1);
  writeFileSync(
    path.join(root, '.gitleaks.toml'),
    '[extend]\nuseDefault = false\n',
  );
  writeFileSync(
    path.join(root, 'unsafe.txt'),
    `token = "${token()}" // gitleaks:allow\n`,
  );
  assert.throws(
    () => scanDirectory(root, { detector }),
    (error) =>
      /Secret scan rejected/u.test(error.message) &&
      !error.message.includes(token()),
  );
  assert.throws(
    () =>
      detectorScan(detector, root, {
        run: () => ({ status: 127, stdout: 'PRIVATE', stderr: 'PRIVATE' }),
      }),
    (error) => !error.message.includes('PRIVATE'),
  );
  writeFileSync(path.join(root, '.gitleaksignore'), 'fingerprint');
  assert.throws(() => scanDirectory(root, { detector }), /Fingerprint/u);
});
for (const eventName of [undefined, 'pull_request', 'push']) {
  test(`source/index/history selection catches staged-only and removed historical secrets (${eventName ?? 'local'})`, async (context) => {
    const root = await ownedFixture(context);
    const metadata = await ownedFixture(context);
    const detector = qualifyDetector(repository);
    context.after(() => detector.dispose());
    git(root, ['init', '--quiet']);
    git(root, ['config', 'user.email', 'fixture@example.invalid']);
    git(root, ['config', 'user.name', 'Fixture']);
    mkdirSync(path.join(root, 'tools/security'), { recursive: true });
    writeFileSync(
      path.join(root, 'tools/security/policy.json'),
      JSON.stringify(DEFAULT_POLICY),
    );
    writeFileSync(path.join(root, '.gitignore'), 'ignored.txt\n');
    writeFileSync(path.join(root, 'safe.txt'), 'normal fixture\n');
    git(root, ['add', '.']);
    git(root, ['commit', '--quiet', '-m', 'baseline']);
    const base = git(root, ['rev-parse', 'HEAD']).trim();
    writeFileSync(path.join(root, 'safe.txt'), 'clean incoming fixture\n');
    git(root, ['add', '.']);
    git(root, ['commit', '--quiet', '-m', 'incoming']);
    const eventPath = path.join(metadata, 'event.json');
    // A disposable Git history cannot inherit the enclosing workflow's SHAs.
    // Production keeps process.env; each fixture owns its local/CI scan context.
    const environment = eventName
      ? {
          GITHUB_ACTIONS: 'true',
          GITHUB_EVENT_NAME: eventName,
          GITHUB_EVENT_PATH: eventPath,
        }
      : {};
    const writeEvent = (trustedBase = base) => {
      const head = git(root, ['rev-parse', 'HEAD']).trim();
      writeFileSync(
        eventPath,
        JSON.stringify(
          eventName === 'pull_request'
            ? {
                pull_request: {
                  base: { sha: trustedBase },
                  head: { sha: head },
                },
              }
            : { before: trustedBase, after: head },
        ),
      );
    };
    const scan = () => {
      if (eventName) writeEvent();
      return checkSecrets(root, { detector, environment });
    };
    writeFileSync(path.join(root, 'ignored.txt'), token());
    assert.equal(scan().history, true);
    if (eventName) {
      writeEvent('f'.repeat(40));
      assert.throws(
        () => checkSecrets(root, { detector, environment }),
        /Security prerequisite or command failed/u,
      );
    }
    writeFileSync(
      path.join(root, 'staged.txt'),
      `access_token = "${token()}"\n`,
    );
    git(root, ['add', 'staged.txt']);
    writeFileSync(path.join(root, 'staged.txt'), 'corrected working tree\n');
    const snapshot = await ownedFixture(context);
    copyIndex(root, snapshot);
    assert.ok(
      readFileSync(path.join(snapshot, 'staged.txt'), 'utf8').includes(token()),
    );
    assert.throws(scan, /Secret scan rejected/u);
    git(root, ['commit', '--quiet', '-m', 'history contains synthetic secret']);
    git(root, ['add', 'staged.txt']);
    git(root, ['commit', '--quiet', '-m', 'remove synthetic secret']);
    assert.throws(scan, /Secret scan rejected/u);
  });
}

test('linked artifact/source directories are rejected before target bytes are read', async (context) => {
  const root = await ownedFixture(context);
  const external = await ownedFixture(context);
  writeFileSync(path.join(external, 'secret.txt'), token());
  symlinkSync(external, path.join(root, 'linked'), 'dir');
  assert.throws(
    () => scanDirectory(root, { detector: { executable: 'not-run' } }),
    /links/u,
  );
  rmSync(path.join(root, 'linked'));
});

test('approved public identifier review matches exact rule AND file AND value', () => {
  const entry = DEFAULT_POLICY.secretExceptions[0];
  const finding = {
    RuleID: entry.rule,
    File: entry.path,
    Secret: entry.value,
    StartLine: 33,
  };
  assert.equal(safeReport(JSON.stringify([finding]), 23, [entry]).findings, 0);
  for (const changed of [
    { ...finding, RuleID: 'other-rule' },
    { ...finding, File: 'other/provider.tsx' },
    { ...finding, Secret: token() },
  ])
    assert.equal(
      safeReport(JSON.stringify([changed]), 23, [entry]).findings,
      1,
    );
});
test('real scanner accepts only the reviewed public identifier and catches another secret in same file', async (context) => {
  const root = await ownedFixture(context);
  const detector = qualifyDetector(repository);
  context.after(() => detector.dispose());
  const entry = DEFAULT_POLICY.secretExceptions[0];
  const filename = path.join(root, entry.path);
  mkdirSync(path.dirname(filename), { recursive: true });
  writeFileSync(filename, `const RETURN_KEY = '${entry.value}';\n`);
  assert.equal(
    detectorScan(detector, root, { exceptions: [entry] }).findings,
    0,
  );
  writeFileSync(
    filename,
    `const RETURN_KEY = '${entry.value}';\nconst access_token = '${token()}';\n`,
  );
  assert.throws(
    () => detectorScan(detector, root, { exceptions: [entry] }),
    /Secret scan rejected/u,
  );
});

test('installer rejects parent redirection before any network or overwrite', async (context) => {
  const root = await ownedFixture(context);
  const external = await ownedFixture(context);
  writeFileSync(path.join(external, 'sentinel.txt'), 'preserve');
  symlinkSync(external, path.join(root, '.verification'), 'dir');
  const { installDetector } = await import('./install.mjs');
  await assert.rejects(() =>
    installDetector(root, () => assert.fail('redirected download invoked')),
  );
  assert.equal(
    readFileSync(path.join(external, 'sentinel.txt'), 'utf8'),
    'preserve',
  );
});
test('installer cannot accept corrupt archive cache or final links', async (context) => {
  const root = await ownedFixture(context);
  const { installDetector } = await import('./install.mjs');
  const { releaseFor } = await import('./pins.mjs');
  mkdirSync(path.join(root, '.verification/tools/gitleaks'), {
    recursive: true,
  });
  writeFileSync(
    path.join(root, '.verification/tools/gitleaks', releaseFor().name),
    'corrupt',
  );
  await assert.rejects(() =>
    installDetector(root, () => assert.fail('bad cache fetched')),
  );
});

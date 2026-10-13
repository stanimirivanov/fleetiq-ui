import assert from 'node:assert/strict';
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { crc32 } from 'node:zlib';
import { ownedFixture } from '../sensors/fixtures.mjs';
import { inspectArtifact, inspectRetention } from './artifacts.mjs';
import { qualifyDetector } from './install.mjs';

const repository = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const secret = () =>
  ['ghp', '_', 'a1B2c3D4e5', 'F6g7H8i9J0', 'k1L2m3N4o5', 'P6q7R8s9T0'].join('');
/** Minimal stored ZIP fixture; production inspection uses maintained yauzl. */
function zip(
  name,
  content,
  { mode = 0o100644, declaredSize = content.length } = {},
) {
  const filename = Buffer.from(name);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50);
  local.writeUInt16LE(20, 4);
  local.writeUInt32LE(crc32(content), 14);
  local.writeUInt32LE(content.length, 18);
  local.writeUInt32LE(declaredSize, 22);
  local.writeUInt16LE(filename.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50);
  central.writeUInt16LE(0x0314, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt32LE(crc32(content), 16);
  central.writeUInt32LE(content.length, 20);
  central.writeUInt32LE(declaredSize, 24);
  central.writeUInt16LE(filename.length, 28);
  central.writeUInt32LE((mode << 16) >>> 0, 38);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + filename.length, 12);
  end.writeUInt32LE(local.length + filename.length + content.length, 16);
  return Buffer.concat([local, filename, content, central, filename, end]);
}
test('plain artifact text and bounded ZIP metadata qualify with pinned detector', async (context) => {
  const root = await ownedFixture(context);
  const detector = qualifyDetector(repository);
  context.after(() => detector.dispose());
  writeFileSync(path.join(root, 'index.html'), '<p>Synthetic guide</p>');
  writeFileSync(
    path.join(root, 'trace.zip'),
    zip('0-trace.trace', Buffer.from('{"fixture":"synthetic"}')),
  );
  const report = await inspectArtifact(root, { detector });
  assert.equal(report.passed, true);
  assert.equal(report.files, 2);
  assert.match(report.sha256, /^[a-f0-9]{64}$/u);
  writeFileSync(
    path.join(root, 'trace.zip'),
    zip('0-trace.trace', Buffer.from(`{"access_token":"${secret()}"}`)),
  );
  await assert.rejects(
    () => inspectArtifact(root, { detector }),
    (error) =>
      !error.message.includes(secret()) &&
      /release inspection failed/u.test(error.message),
  );
});
for (const [name, bytes] of [
  ['traversal', zip('../escape.json', Buffer.from('{}'))],
  [
    'symbolic-link',
    zip('link.json', Buffer.from('outside'), { mode: 0o120777 }),
  ],
  [
    'oversized',
    zip('large.json', Buffer.from('{}'), { declaredSize: 65 * 1024 * 1024 }),
  ],
  ['malformed', Buffer.from('not a zip')],
])
  test(`artifact ZIP ${name} is rejected before scanning`, async (context) => {
    const root = await ownedFixture(context);
    writeFileSync(path.join(root, 'trace.zip'), bytes);
    let scans = 0;
    await assert.rejects(() =>
      inspectArtifact(root, {
        scan: () => {
          scans += 1;
        },
      }),
    );
    assert.equal(scans, 0);
  });
test('excess nested archive depth cannot hide uninspected payload', async (context) => {
  const root = await ownedFixture(context);
  let bytes = zip('payload.json', Buffer.from('{}'));
  for (let index = 0; index < 4; index += 1) bytes = zip('nested.zip', bytes);
  writeFileSync(path.join(root, 'trace.zip'), bytes);
  await assert.rejects(() =>
    inspectArtifact(root, {
      scan: () => assert.fail('unqualified archive scanned'),
    }),
  );
});
test('empty file/output and unsupported extension never qualify release', async (context) => {
  const root = await ownedFixture(context);
  await assert.rejects(() => inspectArtifact(root));
  writeFileSync(path.join(root, 'index.html'), '');
  await assert.rejects(() =>
    inspectArtifact(root, { scan: () => assert.fail('empty content scanned') }),
  );
  writeFileSync(path.join(root, 'index.html'), 'safe');
  writeFileSync(path.join(root, 'payload.unknown'), 'safe');
  await assert.rejects(() =>
    inspectArtifact(root, {
      scan: () => assert.fail('unknown content scanned'),
    }),
  );
});
test('JSON web manifests remain fully scanned and cannot conceal a secret', async (context) => {
  const root = await ownedFixture(context);
  const detector = qualifyDetector(repository);
  context.after(() => detector.dispose());
  const file = path.join(root, 'manifest.webmanifest');
  writeFileSync(
    file,
    JSON.stringify({ name: 'Synthetic trace viewer', start_url: 'index.html' }),
  );
  assert.equal((await inspectArtifact(root, { detector })).passed, true);
  writeFileSync(
    file,
    JSON.stringify({ name: 'Synthetic trace viewer', access_token: secret() }),
  );
  await assert.rejects(
    () => inspectArtifact(root, { detector }),
    (error) =>
      /secret-findings/u.test(error.message) &&
      !error.message.includes(secret()),
  );
});
for (const content of [
  Buffer.from('{'),
  Buffer.from('[]'),
  Buffer.from('null'),
  Buffer.from('"manifest"'),
  Buffer.from([0xff, 0xfe]),
]) {
  test('invalid web manifest content fails before scanning', async (context) => {
    const root = await ownedFixture(context);
    writeFileSync(path.join(root, 'manifest.webmanifest'), content);
    await assert.rejects(() =>
      inspectArtifact(root, {
        scan: () => assert.fail('invalid manifest scanned'),
      }),
    );
  });
}

test('linked artifacts are not followed to content outside owner', async (context) => {
  const root = await ownedFixture(context);
  const external = await ownedFixture(context);
  writeFileSync(path.join(external, 'private.txt'), secret());
  symlinkSync(
    external,
    path.join(root, 'outside'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  await assert.rejects(() => inspectArtifact(root));
});
test('retention scans exact JSON evidence glob plus actual output roots; absent outputs explicit', async (context) => {
  const root = await ownedFixture(context);
  assert.deepEqual(await inspectRetention(root), {
    passed: true,
    roots: 0,
    nothingToUpload: true,
  });
  mkdirSync(path.join(root, '.verification/tools'), { recursive: true });
  writeFileSync(
    path.join(root, '.verification/evidence.json'),
    '{"status":"passed"}',
  );
  writeFileSync(
    path.join(root, '.verification/tools/ignored-cache.zip'),
    'not uploaded',
  );
  mkdirSync(path.join(root, 'test-results'));
  writeFileSync(
    path.join(root, 'test-results/result.json'),
    '{"fixture":true}',
  );
  const scanned = [];
  const report = await inspectRetention(root, {
    inspect: async (directory) => {
      scanned.push(directory);
      return { passed: true };
    },
  });
  assert.equal(report.roots, 2);
  assert.equal(report.nothingToUpload, false);
  assert.equal(scanned[1], path.join(root, 'test-results'));
});
test('existing invalid output cannot become nothing-to-upload', async (context) => {
  const root = await ownedFixture(context);
  mkdirSync(path.join(root, 'test-results'));
  await assert.rejects(() => inspectRetention(root));
});

test('parent junction does not redirect artifact root', async (context) => {
  const root = await ownedFixture(context);
  const external = await ownedFixture(context);
  mkdirSync(path.join(external, 'guide'));
  writeFileSync(path.join(external, 'guide/index.html'), 'outside');
  symlinkSync(
    external,
    path.join(root, 'dist'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  await assert.rejects(() =>
    inspectArtifact(path.join(root, 'dist/guide'), {
      scan: () => assert.fail('redirected data scanned'),
    }),
  );
});
test('artifact source mutation during inspection prevents attestation', async (context) => {
  const root = await ownedFixture(context);
  writeFileSync(path.join(root, 'index.html'), 'original');
  await assert.rejects(() =>
    inspectArtifact(root, {
      scan: async () => {
        writeFileSync(path.join(root, 'index.html'), 'changed');
      },
    }),
  );
});

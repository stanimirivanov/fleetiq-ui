import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  mkdir,
  readFile,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { assembleBook } from './assemble-book.mjs';
import { captureOrigin, captureRequest } from './capture-policy.mjs';
import { changeManifest, fixture } from './fixtures.mjs';
import {
  discardGuideOutput,
  ownedPath,
  resetGuideOutput,
} from './owned-output.mjs';

for (const [label, change] of [
  [
    'unknown mode',
    (value) => {
      value.dataMode = 'live-provider';
    },
  ],
  [
    'duplicate order',
    (value) => {
      value.order = 10;
    },
  ],
  [
    'non-integer order',
    (value) => {
      value.order = 1.5;
    },
  ],
  [
    'too few steps',
    (value) => {
      value.steps = value.steps.slice(0, 4);
    },
  ],
  [
    'traversing image',
    (value) => {
      value.steps[0].image = '../outside.png';
    },
  ],
  [
    'wrong video extension',
    (value) => {
      value.video = 'assets/step-01.png';
    },
  ],
  [
    'blank prose',
    (value) => {
      value.steps[0].body = '';
    },
  ],
  [
    'invalid schema',
    (value) => {
      value.schemaVersion = 3;
    },
  ],
]) {
  test(`assembler rejects ${label} before writing a book`, async (context) => {
    const { output } = await fixture(context);
    await changeManifest(output, 'fleet-overview', change);
    await assert.rejects(assembleBook(output));
    assert.equal(existsSync(path.join(output, 'index.html')), false);
  });
}
for (const [label, file, content] of [
  ['empty image', 'step-01.png', Buffer.alloc(0)],
  ['incorrect image', 'step-01.png', Buffer.from('not PNG media')],
  [
    'truncated image',
    'step-01.png',
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  ],
  ['empty video', 'fleet-overview.webm', Buffer.alloc(0)],
  ['incorrect video', 'fleet-overview.webm', Buffer.from('not WebM media')],
]) {
  test(`assembler rejects ${label}`, async (context) => {
    const { output } = await fixture(context);
    await writeFile(
      path.join(output, 'fleet-overview', 'assets', file),
      content,
    );
    await assert.rejects(assembleBook(output), /media|PNG|WebM/u);
  });
}
test('assembler rejects missing and malformed manifests', async (context) => {
  const { output } = await fixture(context);
  const file = path.join(output, 'fleet-overview', 'guide.json');
  await rm(file);
  await assert.rejects(assembleBook(output));
  await writeFile(file, '{ malformed');
  await assert.rejects(assembleBook(output));
});
test('assembler rejects unregistered chapter directories', async (context) => {
  const { output } = await fixture(context);
  await mkdir(path.join(output, 'unregistered'));
  await assert.rejects(assembleBook(output));
});
test('assembler escapes guide prose rather than embedding scripts', async (context) => {
  const { output } = await fixture(context);
  await changeManifest(output, 'fleet-overview', (value) => {
    value.title = '<script>alert(1)</script>';
  });
  await assembleBook(output);
  const html = await readFile(
    path.join(output, 'fleet-overview', 'index.html'),
    'utf8',
  );
  assert.match(html, /&lt;script&gt;/u);
  assert.doesNotMatch(html, /<script>/u);
});

test('fixed cleanup preserves unrelated outputs', async (context) => {
  const { root } = await fixture(context);
  const expected = await readFile(path.join(root, 'dist', 'unrelated.txt'));
  resetGuideOutput(root);
  discardGuideOutput(root);
  assert.deepEqual(
    await readFile(path.join(root, 'dist', 'unrelated.txt')),
    expected,
  );
  assert.equal(existsSync(path.join(root, 'dist', 'user-guide')), false);
});
test('owned path rejects sibling traversal', async (context) => {
  const { root, output } = await fixture(context);
  assert.throws(() => ownedPath(output, '../unrelated.txt'), /escapes/u);
  assert.equal(existsSync(path.join(root, 'dist', 'unrelated.txt')), true);
});
for (const parent of [
  'dist',
  'dist/user-guide',
  'dist/user-guide/fleet-overview/assets',
]) {
  test(`cleanup and assembly refuse redirected ${parent} without touching its target`, async (context) => {
    const { root, output } = await fixture(context);
    const target = path.join(root, 'outside');
    await mkdir(target);
    await writeFile(path.join(target, 'preserve.txt'), 'unrelated');
    const linked = path.join(root, parent);
    const saved = `${linked}-saved`;
    await rename(linked, saved);
    await symlink(
      target,
      linked,
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    try {
      assert.throws(() => resetGuideOutput(root), /symlink|junction/u);
      assert.throws(() => discardGuideOutput(root), /symlink|junction/u);
      await assert.rejects(assembleBook(output));
      assert.equal(
        await readFile(path.join(target, 'preserve.txt'), 'utf8'),
        'unrelated',
      );
    } finally {
      await unlink(linked);
      await rename(saved, linked);
    }
  });
}
test('capture rejects remote and credential-bearing origins', () => {
  assert.equal(captureOrigin('http://127.0.0.1:4173'), 'http://127.0.0.1:4173');
  for (const url of [
    'https://example.com',
    'http://secret@localhost:4173',
    'http://localhost:4173/?code=value',
    'http://localhost:4173/path',
  ])
    assert.throws(() => captureOrigin(url));
});
test('capture routes allow only local static content and synthetic API responses', () => {
  const origin = 'http://127.0.0.1:4173';
  assert.equal(
    captureRequest(`${origin}/assets/app.js`, origin),
    'local-asset',
  );
  assert.equal(
    captureRequest(`${origin}/api/v1/auth/session`, origin),
    'mock-api',
  );
  for (const url of [
    'https://provider.example/login',
    'http://127.0.0.1:5173/api/v1/assets',
    `${origin}/callback?code=sample`,
    `${origin}/?access_token=sample`,
    'malformed',
  ])
    assert.equal(captureRequest(url, origin), 'blocked');
});

test('direct chapter capture cannot trust a redirected output root', async (context) => {
  const { root, output } = await fixture(context);
  const { resetChapter, discardChapter } = await import('./owned-output.mjs');
  const outside = path.join(root, 'outside');
  await mkdir(path.join(outside, 'fleet-overview'), { recursive: true });
  await writeFile(
    path.join(outside, 'fleet-overview', 'preserve.txt'),
    'unrelated',
  );
  const saved = `${output}-saved`;
  await rename(output, saved);
  await symlink(
    outside,
    output,
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  try {
    assert.throws(
      () => resetChapter(output, 'fleet-overview'),
      /redirected|junction/u,
    );
    assert.throws(
      () => discardChapter(output, 'fleet-overview'),
      /redirected|junction/u,
    );
    assert.equal(
      await readFile(
        path.join(outside, 'fleet-overview', 'preserve.txt'),
        'utf8',
      ),
      'unrelated',
    );
  } finally {
    await unlink(output);
    await rename(saved, output);
  }
});
test('fragment credentials cannot be captured', () => {
  const origin = 'http://127.0.0.1:4173';
  assert.equal(
    captureRequest(`${origin}/callback#id_token=synthetic`, origin),
    'blocked',
  );
  assert.equal(
    captureRequest(`${origin}/callback#access_token=synthetic`, origin),
    'blocked',
  );
});

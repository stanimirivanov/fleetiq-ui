import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { gitEnvironment } from '../docs/source.mjs';

const attributes = readFileSync(
  new URL('../../.gitattributes', import.meta.url),
  'utf8',
);
const textFiles = new Map([
  ['.dependency-cruiser.cjs', 'module.exports = {};\n// CommonJS config\n'],
  ['tools/sensor.mjs', 'export const value = 1;\n// ESM tooling\n'],
  ['tools/script.new-extension', 'A future text source\nSecond line\n'],
  ['README.md', '# Checkout fixture\n\nDocumentation.\n'],
  ['source.ts', 'export const value = 1;\n'],
  ['source.tsx', 'export const view = <div />;\n'],
  ['config.json', '{}\n'],
  ['workflow.yml', 'name: fixture\n'],
]);
const binary = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x00, 0x0d, 0x0a, 0xff,
]);

/** Use a fresh checkout, rather than trusting a warm worktree's line endings. */
function checkoutWithWindowsDefaults(contents, inspect) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'fleetiq-checkout-'));
  const source = path.join(root, 'source');
  const checkout = path.join(root, 'checkout');
  const git = (cwd, args) => {
    const result = spawnSync('git', args, {
      cwd,
      env: gitEnvironment(),
      encoding: 'utf8',
      timeout: 20_000,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
  };
  try {
    mkdirSync(path.join(source, 'tools'), { recursive: true });
    writeFileSync(path.join(source, '.gitattributes'), contents);
    for (const [file, text] of textFiles)
      writeFileSync(path.join(source, file), text);
    writeFileSync(path.join(source, 'image.png'), binary);
    git(source, ['init', '--quiet']);
    git(source, ['-c', 'core.autocrlf=false', 'add', '.']);
    git(source, [
      '-c',
      'user.name=Harness fixture',
      '-c',
      'user.email=fixture@example.invalid',
      '-c',
      'commit.gpgsign=false',
      'commit',
      '--quiet',
      '-m',
      'checkout fixture',
    ]);
    git(root, [
      'clone',
      '--quiet',
      '--no-checkout',
      '--no-hardlinks',
      source,
      checkout,
    ]);
    git(checkout, [
      '-c',
      'core.autocrlf=true',
      '-c',
      'core.eol=crlf',
      'checkout',
      '--quiet',
      '--force',
      'HEAD',
    ]);
    inspect(checkout);
    assert.deepEqual(readFileSync(path.join(checkout, 'image.png')), binary);
  } finally {
    const target = path.resolve(root);
    assert.equal(path.dirname(target), path.resolve(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('fleetiq-checkout-'));
    rmSync(target, { recursive: true, force: true });
  }
}

test('repository attributes preserve LF for all text and binary bytes in a Windows-style checkout', () => {
  checkoutWithWindowsDefaults(attributes, (checkout) => {
    for (const [file, text] of textFiles)
      assert.deepEqual(
        readFileSync(path.join(checkout, file)),
        Buffer.from(text),
        file,
      );
  });
});

test('the previous extension allowlist reproduces CRLF tooling failures in a fresh checkout', () => {
  checkoutWithWindowsDefaults('* text=auto\n*.md text eol=lf\n', (checkout) => {
    for (const file of [
      '.dependency-cruiser.cjs',
      'tools/sensor.mjs',
      'tools/script.new-extension',
    ]) {
      const original = textFiles.get(file);
      const actual = readFileSync(path.join(checkout, file));
      assert.notDeepEqual(actual, Buffer.from(original), file);
      assert.deepEqual(actual, Buffer.from(original.replaceAll('\n', '\r\n')));
    }
    assert.deepEqual(
      readFileSync(path.join(checkout, 'README.md')),
      Buffer.from(textFiles.get('README.md')),
    );
  });
});

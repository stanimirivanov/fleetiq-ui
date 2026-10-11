import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { test } from 'node:test';
import { fixture } from './fixtures.mjs';
import {
  discoverSources,
  gitEnvironment,
  resolveOwnedPath,
} from './source.mjs';

test('Git inventories tracked and new files once and excludes ignored files', (context) => {
  const owned = fixture(context);
  owned.git('add', '--', 'README.md');
  owned.write('new.md', '# New\n');
  owned.write('.idea/ignored.md', '# Ignored\n');
  assert.deepEqual(discoverSources(owned.root), [
    '.gitignore',
    'README.md',
    'new.md',
  ]);
});

test('intentional unstaged tracked deletions do not leave phantom sources', (context) => {
  const owned = fixture(context);
  owned.write('removed.md', '# Removed\n');
  owned.git('add', '--', 'removed.md');
  rmSync(resolveOwnedPath(owned.root, 'removed.md').absolute);
  assert.ok(!discoverSources(owned.root).includes('removed.md'));
});

test('Git launch failure and nonzero output cannot produce an empty valid inventory', () => {
  for (const result of [
    { error: new Error('unavailable'), status: null },
    { status: 1, stdout: '' },
    { status: 0, stdout: undefined },
    { status: 0, stdout: '../escape.md\0' },
  ])
    assert.throws(() => discoverSources('.', () => result), /Git/u);
});

test('lexical escape, backslash and absolute paths fail before a file is read', (context) => {
  const owned = fixture(context);
  for (const target of [
    '../outside.md',
    '/outside.md',
    'C:/outside.md',
    'docs\\README.md',
  ]) {
    assert.throws(
      () => resolveOwnedPath(owned.root, target),
      /repository|relative|slashes/u,
    );
  }
});

test('an ordinary path starting with two dots remains inside the root', (context) => {
  const owned = fixture(context);
  owned.write('..notes.md', '# Notes\n');
  assert.equal(
    resolveOwnedPath(owned.root, '..notes.md').relative,
    '..notes.md',
  );
});

test('source discovery excludes ambient Git directory and index overrides', (context) => {
  const owned = fixture(context);
  discoverSources(owned.root, (_program, _arguments, options) => {
    assert.equal(options.env.GIT_DIR, undefined);
    assert.equal(options.env.GIT_INDEX_FILE, undefined);
    assert.equal(options.env.GIT_CONFIG_NOSYSTEM, '1');
    assert.equal(
      options.env.GIT_CONFIG_GLOBAL,
      process.platform === 'win32' ? 'NUL' : '/dev/null',
    );
    return { status: 0, stdout: 'README.md\0' };
  });
});

test('Git isolation treats Windows environment keys case-insensitively', () => {
  const environment = gitEnvironment({
    Path: 'synthetic',
    git_dir: 'outside',
    Git_Index_File: 'outside',
    GIT_CONFIG_COUNT: '1',
  });
  assert.equal(environment.Path, 'synthetic');
  assert.equal(environment.git_dir, undefined);
  assert.equal(environment.Git_Index_File, undefined);
  assert.equal(environment.GIT_CONFIG_COUNT, undefined);
});

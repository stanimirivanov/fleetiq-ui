import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const minimalPolicy = {
  requiredEntries: ['README.md'],
  guidanceRoutes: [],
};

/** Every fixture owns its Git checkout, redirects and configuration. */
export function fixture(
  context,
  files = { 'README.md': '# Fixture\n\n## Real heading\n' },
) {
  const parent = mkdtempSync(path.join(tmpdir(), 'fleetiq-docs-test-'));
  const root = path.join(parent, 'repository');
  mkdirSync(root);
  const config = path.join(parent, 'global.gitconfig');
  writeFileSync(config, '');
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')),
  );
  Object.assign(env, {
    GIT_CONFIG_GLOBAL: config,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_ATTR_NOSYSTEM: '1',
  });
  function git(...args) {
    const result = spawnSync(
      'git',
      ['-c', 'core.autocrlf=false', '-c', 'commit.gpgsign=false', ...args],
      { cwd: root, env, encoding: 'utf8', timeout: 20_000 },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 0, `fixture Git failed: ${result.stderr}`);
    return result.stdout;
  }
  function write(relative, content) {
    const destination = path.join(root, relative);
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, content);
  }
  const template = path.join(parent, 'empty-template');
  mkdirSync(template);
  git('init', '--quiet', '--initial-branch=main', `--template=${template}`);
  write('.gitignore', '.idea/\nnode_modules/\ndist/\n');
  for (const [file, content] of Object.entries(files)) write(file, content);
  context.after(() => {
    assert.equal(
      path.dirname(parent),
      tmpdir(),
      'remove only the explicitly owned temporary directory',
    );
    assert.ok(path.basename(parent).startsWith('fleetiq-docs-test-'));
    rmSync(parent, { recursive: true, force: true });
  });
  return { root, parent, git, write };
}

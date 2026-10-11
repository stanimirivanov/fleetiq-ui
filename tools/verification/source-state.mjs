import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import {
  discoverSources,
  gitEnvironment,
  resolveOwnedPath,
} from '../docs/source.mjs';
/** Hash Git-owned source bytes without persisting contents or raw Git output. */
export function sourceState(root, runGit = spawnSync) {
  const env = gitEnvironment();
  const revision = runGit('git', ['rev-parse', '--verify', 'HEAD'], {
    cwd: root,
    env,
    encoding: 'utf8',
    timeout: 20_000,
  });
  const status = runGit('git', ['status', '--porcelain=v1', '-z'], {
    cwd: root,
    env,
    encoding: 'utf8',
    timeout: 20_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (
    revision.error ||
    revision.status !== 0 ||
    !/^[a-f0-9]{40,64}\s*$/u.test(revision.stdout) ||
    status.error ||
    status.status !== 0 ||
    typeof status.stdout !== 'string'
  ) {
    throw new Error('Git source state unavailable.');
  }
  const digest = createHash('sha256');
  const files = discoverSources(root, runGit);
  for (const relative of files) {
    const { absolute } = resolveOwnedPath(root, relative);
    if (!statSync(absolute).isFile())
      throw new Error('Source inventory contains a non-file.');
    const bytes = readFileSync(absolute);
    digest.update(JSON.stringify([relative, bytes.length]));
    digest.update(bytes);
  }
  return {
    revision: revision.stdout.trim(),
    dirty: status.stdout.length > 0,
    digest: digest.digest('hex'),
    files: files.length,
  };
}
export function unchangedSource(before, after) {
  return (
    before.revision === after.revision &&
    before.dirty === after.dirty &&
    before.digest === after.digest &&
    before.files === after.files
  );
}

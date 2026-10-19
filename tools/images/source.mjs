import { execFileSync } from 'node:child_process';
import { gitEnvironment } from '../docs/source.mjs';
import { sourceState } from '../verification/source-state.mjs';
import { ensure, REPOSITORY } from './policy.mjs';
/** Reuse the UX harness's raw-source inventory and Git-redirection protection. */
export async function sourceIdentity(root = process.cwd()) {
  const origin = execFileSync('git', ['remote', 'get-url', 'origin'], {
    cwd: root,
    env: gitEnvironment(),
    encoding: 'utf8',
    timeout: 20000,
  }).trim();
  ensure(
    [
      `https://github.com/${REPOSITORY}`,
      `https://github.com/${REPOSITORY}.git`,
      `git@github.com:${REPOSITORY}.git`,
    ].includes(origin),
    'Unexpected source repository.',
  );
  return { repository: REPOSITORY, ...sourceState(root) };
}

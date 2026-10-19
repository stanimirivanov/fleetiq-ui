import { spawn, spawnSync } from 'node:child_process';
import { DECLARED } from './declared-dependencies.mjs';
import { pnpmLaunchers } from './pnpm-launchers.mjs';

/** Qualify native and JavaScript pnpm launchers against the exact manifest pin. */
export function qualifyTools(
  root,
  manifest,
  run = spawnSync,
  { environment = process.env } = {},
) {
  const tools = { node: process.version, pnpm: null, git: null };
  if (!tools.node.startsWith(`v${DECLARED.nodeMajor}.`))
    return { tools, blocker: `node-${DECLARED.nodeMajor}-required` };
  const git = run('git', ['--version'], {
    cwd: root,
    env: environment,
    encoding: 'utf8',
    timeout: 20_000,
    maxBuffer: 16_384,
    shell: false,
  });
  if (
    git.error ||
    git.status !== 0 ||
    !/^git version [\d.a-z-]+\s*$/iu.test(git.stdout)
  ) {
    return { tools, blocker: 'git-unavailable' };
  }
  tools.git = git.stdout.trim().replace('git version ', '');
  const expected = /^pnpm@(\d+\.\d+\.\d+)$/u.exec(manifest.packageManager)?.[1];
  if (!expected) return { tools, blocker: 'package-manager-pin-invalid' };
  for (const launcher of pnpmLaunchers(root, { environment })) {
    const result = run(launcher.command, [...launcher.args, '--version'], {
      cwd: root,
      env: environment,
      encoding: 'utf8',
      timeout: 30_000,
      maxBuffer: 16_384,
      shell: false,
    });
    if (
      !result.error &&
      result.status === 0 &&
      result.stdout.trim() === expected
    ) {
      tools.pnpm = expected;
      return { tools, launcher, blocker: null };
    }
  }
  return { tools, blocker: 'pinned-pnpm-unavailable' };
}

/** Human output is inherited; evidence stores bounded statuses, never command output. */
export function executeCheck(root, launcher, script, { signal } = {}) {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve({ status: 'not-run', reason: 'interrupted', exitCode: null });
      return;
    }
    const child = spawn(launcher.command, [...launcher.args, 'run', script], {
      cwd: root,
      stdio: 'inherit',
      shell: false,
      signal,
    });
    let launchError;
    child.once('error', (error) => {
      launchError = error;
    });
    child.once('close', (code, childSignal) => {
      if (launchError) {
        resolve({
          status: launchError.name === 'AbortError' ? 'failed' : 'not-run',
          reason:
            launchError.name === 'AbortError' ? 'interrupted' : 'launch-failed',
          exitCode: null,
        });
        return;
      }
      resolve({
        status: code === 0 && !childSignal ? 'passed' : 'failed',
        reason: childSignal
          ? 'interrupted'
          : code === 0
            ? null
            : 'command-failed',
        exitCode: Number.isInteger(code) ? code : null,
      });
    });
  });
}

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
/** Launch JS entry points directly; Windows shell shims cannot run with shell:false. */
export function qualifyTools(root, manifest, run = spawnSync) {
  const tools = { node: process.version, pnpm: null, git: null };
  if (!/^v24\./u.test(tools.node))
    return { tools, blocker: 'node-24-required' };
  const git = run('git', ['--version'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 20_000,
  });
  if (
    git.error ||
    git.status !== 0 ||
    !/^git version [\d.a-z-]+\s*$/iu.test(git.stdout)
  ) {
    return { tools, blocker: 'git-unavailable' };
  }
  tools.git = git.stdout.trim().replace('git version ', '');
  const directories = [
    path.dirname(process.execPath),
    ...(process.env.PATH ?? '').split(path.delimiter),
  ];
  const candidates = [
    process.env.npm_execpath,
    ...directories.flatMap((directory) => [
      path.join(directory, 'node_modules/corepack/dist/pnpm.js'),
      path.join(directory, 'node_modules/pnpm/bin/pnpm.cjs'),
    ]),
  ].filter(
    (candidate) =>
      candidate && existsSync(candidate) && /\.(?:c?js)$/u.test(candidate),
  );
  const expected = /^pnpm@(\d+\.\d+\.\d+)$/u.exec(manifest.packageManager)?.[1];
  if (!expected) return { tools, blocker: 'package-manager-pin-invalid' };
  for (const launcher of new Set(candidates)) {
    const result = run(process.execPath, [launcher, '--version'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 30_000,
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
    const child = spawn(process.execPath, [launcher, 'run', script], {
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

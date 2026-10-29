import { spawnSync } from 'node:child_process';
import { gitEnvironment } from '../docs/source.mjs';

/** Neither tool diagnostics nor ambient detector/Git redirection reach evidence. */
export function securityEnvironment(base = process.env) {
  return Object.fromEntries(
    Object.entries(gitEnvironment(base)).filter(
      ([name]) => !/^(?:GITLEAKS_|NPM_|PNPM_)/iu.test(name),
    ),
  );
}
export function command(
  commandName,
  args,
  {
    cwd,
    run = spawnSync,
    maxBuffer = 16 * 1024 * 1024,
    accepted = [0],
    environment = process.env,
    input,
    encoding = 'utf8',
  } = {},
) {
  const result = run(commandName, args, {
    cwd,
    env: securityEnvironment(environment),
    shell: false,
    encoding,
    input,
    timeout: 150_000,
    maxBuffer,
  });
  if (result.error || !accepted.includes(result.status))
    throw new Error(
      'Security prerequisite or command failed; no clean result.',
    );
  return result;
}
export function git(root, args, options = {}) {
  return command(
    'git',
    ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, ...args],
    { cwd: root, ...options },
  ).stdout;
}

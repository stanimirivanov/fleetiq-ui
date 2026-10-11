import { spawnSync } from 'node:child_process';
import { lstatSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';

/** Use repository-owned Git policy and ignore ambient Git redirection. */
export function gitEnvironment(base = process.env) {
  const env = Object.fromEntries(
    Object.entries(base).filter(
      ([key]) => !key.toUpperCase().startsWith('GIT_'),
    ),
  );
  Object.assign(env, {
    GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_ATTR_NOSYSTEM: '1',
  });
  return env;
}

/** Return Git-owned sources, including newly authored unignored files. */
export function discoverSources(root, runGit = spawnSync) {
  const env = gitEnvironment();
  const result = runGit(
    'git',
    [
      '-c',
      'core.quotePath=false',
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '-z',
    ],
    {
      cwd: root,
      env,
      encoding: 'utf8',
      timeout: 20_000,
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  if (result?.error || result?.status !== 0) {
    throw new Error(
      'Git source discovery failed; install Git and use a repository checkout.',
    );
  }
  if (typeof result.stdout !== 'string')
    throw new Error('Git returned invalid source inventory.');
  const files = [...new Set(result.stdout.split('\0').filter(Boolean))].sort();
  for (const file of files) {
    if (
      file.includes('\\') ||
      path.posix.isAbsolute(file) ||
      file.split('/').some((part) => part === '..' || part === '.' || !part)
    ) {
      throw new Error(
        'Git returned an invalid repository-relative source path.',
      );
    }
  }
  return files.filter((file) => {
    try {
      lstatSync(path.join(root, file));
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') return false;
      throw new Error('Git-owned source cannot be inspected.');
    }
  });
}

function contained(root, target) {
  const relative = path.relative(root, target);
  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

/** Check casing and real containment before a caller reads any target content. */
function inspectOwnedPath(root, relative) {
  if (
    path.isAbsolute(relative) ||
    /^[a-z]:/iu.test(relative) ||
    relative.includes('\\')
  ) {
    throw new Error('use a repository-relative path with forward slashes');
  }
  const rootPath = path.resolve(root);
  const target = path.resolve(rootPath, relative);
  if (!contained(rootPath, target))
    throw new Error('path escapes the repository');
  let current = rootPath;
  for (const part of path
    .relative(rootPath, target)
    .split(path.sep)
    .filter(Boolean)) {
    const entries = readdirSync(current);
    if (!entries.includes(part)) {
      const caseMatch = entries.some(
        (entry) => entry.toLowerCase() === part.toLowerCase(),
      );
      throw new Error(
        caseMatch
          ? 'path casing does not match the repository'
          : 'target does not exist',
      );
    }
    current = path.join(current, part);
    const canonical = realpathSync(current);
    if (!contained(realpathSync(rootPath), canonical)) {
      throw new Error('symlink or junction target escapes the repository');
    }
  }
  return {
    absolute: target,
    relative: path.relative(rootPath, target).split(path.sep).join('/'),
    metadata: lstatSync(target),
  };
}

/** Controlled filesystem diagnostics never echo a redirected target path. */
export function resolveOwnedPath(root, relative) {
  try {
    return inspectOwnedPath(root, relative);
  } catch (error) {
    if (error.code)
      throw new Error(
        error.code === 'ENOENT'
          ? 'target does not exist'
          : 'target cannot be inspected',
      );
    throw error;
  }
}

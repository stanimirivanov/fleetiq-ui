import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  realpathSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export function temporary(prefix = 'fleetiq-security-') {
  const root = mkdtempSync(path.join(tmpdir(), prefix), { encoding: 'utf8' });
  return {
    root,
    dispose() {
      const resolved = path.resolve(root);
      if (
        path.dirname(resolved) !== path.resolve(tmpdir()) ||
        lstatSync(resolved).isSymbolicLink()
      ) {
        throw new Error(
          'Security temporary ownership changed; cleanup refused.',
        );
      }
      rmSync(resolved, { recursive: true, force: true });
    },
  };
}
export function relativePath(value) {
  if (
    typeof value !== 'string' ||
    !value ||
    value.includes('\\') ||
    /^[a-z]:/iu.test(value) ||
    path.posix.isAbsolute(value) ||
    value.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    throw new Error('Security inputs require contained relative paths.');
  }
  return value;
}
/** Reject every link component, including junctions, before reading or copying. */
export function ownedFile(root, relative) {
  relativePath(relative);
  let current = path.resolve(root);
  const canonicalRoot = realpathSync(current);
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    const metadata = lstatSync(current);
    if (metadata.isSymbolicLink())
      throw new Error('Security input links are forbidden.');
    const canonical = realpathSync(current);
    const difference = path.relative(canonicalRoot, canonical);
    if (
      difference === '..' ||
      difference.startsWith(`..${path.sep}`) ||
      path.isAbsolute(difference)
    )
      throw new Error('Security input escaped its owned root.');
  }
  if (!lstatSync(current).isFile())
    throw new Error('Security input must be a regular file.');
  return current;
}
/** Check absolute parent directories too, so a replaced output parent cannot redirect reads. */
export function plainAncestors(root) {
  const absolute = path.resolve(root);
  let current = path.parse(absolute).root;
  for (const part of path
    .relative(current, absolute)
    .split(path.sep)
    .filter(Boolean)) {
    current = path.join(current, part);
    const metadata = lstatSync(current);
    if (metadata.isSymbolicLink())
      throw new Error('Security input ancestor links are forbidden.');
  }
}
export function plainFiles(root) {
  plainAncestors(root);
  if (!lstatSync(root).isDirectory() || lstatSync(root).isSymbolicLink())
    throw new Error('Security scan requires an owned plain directory.');
  const files = [];
  function walk(directory, prefix = '') {
    for (const name of readdirSync(directory)) {
      const relative = prefix ? `${prefix}/${name}` : name;
      const metadata = lstatSync(path.join(root, relative));
      if (metadata.isSymbolicLink())
        throw new Error('Artifact links are forbidden.');
      if (metadata.isDirectory()) walk(path.join(root, relative), relative);
      else {
        ownedFile(root, relative);
        files.push(relative);
      }
    }
  }
  walk(root);
  return files.sort();
}
export function makeParent(file) {
  mkdirSync(path.dirname(file), { recursive: true });
}
export function makeOwnedDirectory(root, relative) {
  relativePath(relative);
  plainAncestors(root);
  let current = path.resolve(root);
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    try {
      const metadata = lstatSync(current);
      if (!metadata.isDirectory() || metadata.isSymbolicLink())
        throw new Error(
          'Security installation path is linked or not a directory.',
        );
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      mkdirSync(current, { mode: 0o700 });
    }
  }
  return current;
}

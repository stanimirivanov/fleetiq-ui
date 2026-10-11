import {
  lstatSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  rmSync,
} from 'node:fs';
import path from 'node:path';

/** Generated output is owned only below this exact root; links are never traversed. */
export function ownedPath(root, relative, { missing = false } = {}) {
  const resolvedRoot = path.resolve(root);
  const canonicalRoot = realpathSync(root);
  if (
    lstatSync(resolvedRoot).isSymbolicLink() ||
    path.relative(canonicalRoot, resolvedRoot) !== ''
  ) {
    throw new Error(
      'Generated output root cannot be redirected by symlinks or junctions.',
    );
  }
  const target = path.resolve(canonicalRoot, relative);
  const local = path.relative(canonicalRoot, target);
  if (
    !local ||
    local === '..' ||
    local.startsWith(`..${path.sep}`) ||
    path.isAbsolute(local)
  ) {
    throw new Error('Generated path escapes its owned output root.');
  }
  let cursor = canonicalRoot;
  const parts = local.split(path.sep);
  for (let index = 0; index < parts.length; index++) {
    cursor = path.join(cursor, parts[index]);
    let info;
    try {
      info = lstatSync(cursor);
    } catch (error) {
      if (missing && error.code === 'ENOENT') return target;
      throw new Error('Generated path is missing or cannot be inspected.');
    }
    if (info.isSymbolicLink())
      throw new Error('Generated output cannot contain symlinks or junctions.');
    if (index < parts.length - 1 && !info.isDirectory())
      throw new Error('Generated path parent must be a directory.');
  }
  return target;
}

/** Inspect before recursive removal; reject links and unsupported filesystem entries. */
export function inspectTree(root) {
  const info = lstatSync(root);
  if (info.isSymbolicLink() || !info.isDirectory())
    throw new Error('Owned output root must be a real directory.');
  const files = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = ownedPath(
        root,
        path.relative(root, path.join(directory, entry.name)),
      );
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile()) files.push(absolute);
      else
        throw new Error(
          'Generated output contains an unsupported filesystem entry.',
        );
      if (files.length > 10_000)
        throw new Error('Generated output inventory exceeds its bound.');
    }
  };
  walk(root);
  return files.sort();
}

/** Reset only the fixed guide output after inspecting every existing entry. */
export function resetGuideOutput(repositoryRoot) {
  const target = ownedPath(repositoryRoot, 'dist/user-guide', {
    missing: true,
  });
  try {
    inspectTree(target);
    rmSync(target, { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  mkdirSync(target, { recursive: true });
  return target;
}

export function discardGuideOutput(repositoryRoot) {
  const target = ownedPath(repositoryRoot, 'dist/user-guide', {
    missing: true,
  });
  try {
    inspectTree(target);
    rmSync(target, { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

/** A chapter reset cannot touch siblings or follow redirected asset directories. */
export function resetChapter(outputRoot, slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug))
    throw new Error('Guide slug is invalid.');
  const target = ownedPath(outputRoot, slug, { missing: true });
  try {
    inspectTree(target);
    rmSync(target, { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  mkdirSync(path.join(target, 'assets'), { recursive: true });
  return target;
}

export function discardChapter(outputRoot, slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug))
    throw new Error('Guide slug is invalid.');
  const target = ownedPath(outputRoot, slug, { missing: true });
  try {
    inspectTree(target);
    rmSync(target, { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

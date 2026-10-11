import path from 'node:path';
import { resolveOwnedPath } from './source.mjs';

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new Error('destination has malformed URI encoding');
  }
}

/** Resolve a local Markdown destination without reading an escaping target. */
export function resolveLink(root, source, destination, sourceFiles) {
  if (/^(?:https?:|mailto:)/iu.test(destination)) {
    try {
      new URL(destination);
    } catch {
      throw new Error('external destination is malformed');
    }
    return undefined;
  }
  if (
    /^[a-z][a-z\d+.-]*:/iu.test(destination) ||
    destination.startsWith('//')
  ) {
    throw new Error('use a local repository path or an HTTP/mailto URL');
  }
  const hash = destination.indexOf('#');
  const rawPath = hash < 0 ? destination : destination.slice(0, hash);
  const fragment = hash < 0 ? undefined : decode(destination.slice(hash + 1));
  if (rawPath.includes('?'))
    throw new Error('local destinations cannot contain URL query strings');
  const decoded = decode(rawPath);
  if (decoded.includes('\0'))
    throw new Error('destination contains a NUL byte');
  if (
    path.isAbsolute(decoded) ||
    /^[a-z]:/iu.test(decoded) ||
    decoded.includes('\\')
  ) {
    throw new Error('use a relative path with forward slashes');
  }
  const relative = decoded
    ? path.posix.join(path.posix.dirname(source), decoded)
    : source;
  const target = resolveOwnedPath(root, relative);
  if (!target.metadata.isDirectory() && !sourceFiles.has(target.relative)) {
    throw new Error('destination is outside Git-owned and unignored source');
  }
  return { ...target, fragment };
}

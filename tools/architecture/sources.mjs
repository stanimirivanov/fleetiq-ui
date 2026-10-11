import { readdirSync } from 'node:fs';
import path from 'node:path';
import { PRODUCTION_OWNERS } from '../boundaries/policy.mjs';
import { resolveOwnedPath } from '../docs/source.mjs';

const sourceExtensions = new Set([
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
]);

/** Independently inventory every explicitly registered, existing production owner. */
export function architectureSources(root, owners = PRODUCTION_OWNERS) {
  const files = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(
          'Architecture source inventory rejects source symlinks.',
        );
      }
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile() && sourceExtensions.has(path.extname(entry.name)))
        files.push(path.relative(root, target).replaceAll('\\', '/'));
    }
  }
  for (const owner of typeof owners === 'string' ? [owners] : owners) {
    const target = resolveOwnedPath(root, owner);
    if (!target.metadata.isDirectory())
      throw new Error('Architecture owner must be an existing directory.');
    visit(target.absolute);
  }
  return [...new Set(files)].sort();
}

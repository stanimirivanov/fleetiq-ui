import { readdirSync } from 'node:fs';
import path from 'node:path';

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

/** Inventory the current scan owner independently of dependency-cruiser. */
export function architectureSources(root, owner = 'apps/web/src') {
  const files = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(
          `Architecture source inventory rejects symlinks: ${target}`,
        );
      }
      if (entry.isDirectory()) visit(target);
      else if (
        entry.isFile() &&
        sourceExtensions.has(path.extname(entry.name))
      ) {
        files.push(path.relative(root, target).replaceAll('\\', '/'));
      }
    }
  }
  visit(path.join(root, owner));
  return files.sort();
}

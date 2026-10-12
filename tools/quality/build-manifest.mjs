import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
/** Resolve sample ownership from Vite's graph, then hash final bytes after CSS emission. */
export function qualityManifest(repositoryRoot) {
  const prefix = `${path.resolve(repositoryRoot).replaceAll('\\', '/')}/`;
  let modules;
  return {
    name: 'fleetiq-quality-manifest',
    generateBundle(_options, bundle) {
      modules = [
        ...new Set(
          Object.values(bundle)
            .filter((entry) => entry.type === 'chunk')
            .flatMap((chunk) => Object.keys(chunk.modules)),
        ),
      ]
        .map((id) => id.replaceAll('\\', '/').split('?')[0])
        .filter((id) => id.startsWith(`${prefix}apps/web/src/`))
        .map((id) => id.slice(prefix.length))
        .sort();
    },
    writeBundle(options, bundle) {
      if (!options.dir || !modules?.length)
        throw new Error('Resolved production module graph is unavailable.');
      const files = Object.values(bundle)
        .filter(
          (entry) =>
            entry.type === 'chunk' || /\.(?:css)$/u.test(entry.fileName),
        )
        .map((entry) => {
          const file = path.resolve(options.dir, entry.fileName);
          if (!file.startsWith(path.resolve(options.dir) + path.sep))
            throw new Error('Bundle output escaped its directory.');
          const bytes = readFileSync(file);
          return {
            name: entry.fileName,
            bytes: bytes.length,
            sha256: createHash('sha256').update(bytes).digest('hex'),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      writeFileSync(
        path.join(options.dir, 'quality-manifest.json'),
        `${JSON.stringify({ schemaVersion: 1, modules, files })}\n`,
      );
    },
  };
}

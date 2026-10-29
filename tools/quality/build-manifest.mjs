import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
/** Resolve sample ownership from Vite's graph, then hash final bytes after CSS emission. */
export function qualityManifest(repositoryRoot) {
  // Resolve the canonical source path before comparing manifest entries.
  // Vite/Rolldown may resolve imports differently from the configured temp root.
  const prefix = `${realpathSync.native(repositoryRoot).replaceAll('\\', '/')}/`;
  let modules;
  let mapFiles;
  return {
    name: 'fleetiq-quality-manifest',
    generateBundle(_options, bundle) {
      const entries = Object.values(bundle);
      const chunks = entries.filter((e) => e.type === 'chunk');
      const initial = new Set();
      const visit = (chunk, set) => {
        if (set.has(chunk.fileName)) return;
        set.add(chunk.fileName);
        for (const name of chunk.imports ?? []) {
          const next = bundle[name];
          if (next?.type === 'chunk') visit(next, set);
        }
      };
      for (const chunk of chunks.filter((c) => c.isEntry))
        visit(chunk, initial);
      const map = new Set();
      for (const chunk of chunks.filter((c) =>
        Object.keys(c.modules).some((id) =>
          [
            '/apps/web/src/features/assets/ui/ConnectedMapContent.tsx',
            '/apps/web/src/features/assets/api/live-fleet-reader.ts',
            '/apps/web/src/features/assets/api/maplibre-adapter.ts',
          ].some((owner) => id.replaceAll('\\', '/').endsWith(owner)),
        ),
      ))
        visit(chunk, map);
      for (const name of initial) map.delete(name);
      for (const name of [...map]) {
        const chunk = bundle[name];
        if (chunk?.type !== 'chunk') continue;
        for (const asset of entries.filter(
          (e) => e.type === 'asset' && /\.(?:m?js|css)$/.test(e.fileName),
        ))
          if (
            chunk.code.includes(asset.fileName) ||
            chunk.viteMetadata?.importedCss?.has(asset.fileName)
          )
            map.add(asset.fileName);
      }
      mapFiles = [...map].sort();
      modules = [
        ...new Set(
          Object.values(bundle)
            .filter((entry) => entry.type === 'chunk')
            .flatMap((chunk) => Object.keys(chunk.modules)),
        ),
      ]
        .map((id) => id.split('?')[0])
        .filter((id) => path.isAbsolute(id))
        .map((id) => realpathSync.native(id).replaceAll('\\', '/'))
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
            entry.type === 'chunk' || /\.(?:m?js|css)$/u.test(entry.fileName),
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
        `${JSON.stringify({ schemaVersion: 2, modules, files, mapFiles })}\n`,
      );
    },
  };
}

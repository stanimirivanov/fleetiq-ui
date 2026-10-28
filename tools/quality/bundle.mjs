import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { ownedFile, plainFiles } from '../security/owned.mjs';
import { runEntrypoint } from '../sensors/entrypoint.mjs';
import { qualityPolicy } from './policy.mjs';
/** Compare the emitted graph, inventory, hashes and actual compressed sizes. */
export function inspectBundle(root, limits = qualityPolicy.bundle) {
  if (
    !limits ||
    ![
      'javascriptBytes',
      'javascriptGzipBytes',
      'cssBytes',
      'cssGzipBytes',
    ].every((key) => Number.isSafeInteger(limits[key]) && limits[key] > 0) ||
    !Array.isArray(limits.forbiddenModules) ||
    limits.forbiddenModules.length !== 4
  )
    throw new Error(
      'Production output budgets or sample owners are incomplete.',
    );
  const inventory = plainFiles(root);
  const manifest = JSON.parse(
    readFileSync(ownedFile(root, 'quality-manifest.json'), 'utf8'),
  );
  if (
    manifest.schemaVersion !== 2 ||
    !Array.isArray(manifest.modules) ||
    !manifest.modules.length ||
    !Array.isArray(manifest.files) ||
    !Array.isArray(manifest.mapFiles) ||
    new Set(manifest.mapFiles).size !== manifest.mapFiles.length ||
    !limits.map
  )
    throw new Error('Production module manifest is unavailable.');
  if (
    manifest.modules.some(
      (id) =>
        typeof id !== 'string' ||
        !id.startsWith('apps/web/src/') ||
        limits.forbiddenModules.some((owner) =>
          owner.endsWith('/') ? id.startsWith(owner) : id === owner,
        ),
    )
  )
    throw new Error('Production bundle contains forbidden sample modules.');
  const outputs = inventory.filter((name) => /\.(?:m?js|css)$/u.test(name));
  if (
    !outputs.length ||
    outputs.length !== manifest.files.length ||
    new Set(manifest.files.map((entry) => entry.name)).size !== outputs.length
  )
    throw new Error('Production output inventory is incomplete.');
  const sizes = {
    javascriptBytes: 0,
    javascriptGzipBytes: 0,
    cssBytes: 0,
    cssGzipBytes: 0,
  };
  const mapSizes = { ...sizes };
  if (manifest.mapFiles.some((name) => !outputs.includes(name)))
    throw new Error('Map output inventory is stale.');
  for (const entry of manifest.files) {
    if (!outputs.includes(entry.name))
      throw new Error('Production output registration is stale.');
    const bytes = readFileSync(ownedFile(root, entry.name));
    if (
      entry.bytes !== bytes.length ||
      entry.sha256 !== createHash('sha256').update(bytes).digest('hex')
    )
      throw new Error(
        'Production output bytes changed after graph extraction.',
      );
    const type = /\.m?js$/.test(entry.name) ? 'javascript' : 'css';
    const group = manifest.mapFiles.includes(entry.name) ? mapSizes : sizes;
    group[`${type}Bytes`] += bytes.length;
    group[`${type}GzipBytes`] += gzipSync(bytes).length;
  }
  if (Object.entries(sizes).some(([key, value]) => value > limits[key]))
    throw new Error('Production bundle exceeds the reviewed byte budget.');
  if (
    Object.entries(mapSizes).some(
      ([key, value]) =>
        !Number.isSafeInteger(limits.map[key]) ||
        limits.map[key] <= 0 ||
        value > limits.map[key],
    )
  )
    throw new Error('Lazy map bundle exceeds the reviewed byte budget.');
  return {
    map: mapSizes,
    passed: true,
    modules: manifest.modules.length,
    files: outputs.length,
    ...sizes,
  };
}
await runEntrypoint(import.meta.url, () =>
  console.log(
    'Production output quality passed:',
    inspectBundle(
      fileURLToPath(new URL('../../apps/web/dist', import.meta.url)),
    ),
  ),
);

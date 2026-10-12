import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceState, unchangedSource } from '../verification/source-state.mjs';
import { inspectTree, ownedPath } from './owned-output.mjs';
import { qualifiedReport, requireQualification } from './qualification.mjs';

export const readyName = '.ready.json';
const manifestFor = (root) =>
  JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Inventory every output byte. The marker itself is excluded to avoid a circular hash. */
export function outputInventory(outputRoot) {
  return inspectTree(outputRoot)
    .filter((file) => file !== path.join(outputRoot, readyName))
    .map((file) => ({
      path: path.relative(outputRoot, file).split(path.sep).join('/'),
      bytes: lstatSync(file).size,
      sha256: sha256(readFileSync(file)),
    }));
}

export async function inspectGuideArtifacts(outputRoot, root) {
  const { inspectArtifact } = await import('../security/artifacts.mjs');
  const result = await inspectArtifact(outputRoot, { policyRoot: root });
  if (result?.passed !== true)
    throw new Error('Guide artifact inspection is incomplete.');
}

/** Marker is emitted only after the generator has assembled and inspected every output. */
export function writeReady(root, source, qualification) {
  const outputRoot = ownedPath(root, 'dist/user-guide');
  const manifest = manifestFor(root);
  const evidence = Object.fromEntries(
    Object.entries(qualification).map(([group, relative]) => {
      const file = ownedPath(root, relative);
      const bytes = readFileSync(file);
      const report = JSON.parse(bytes);
      if (
        !qualifiedReport(
          report,
          group,
          source,
          manifest.packageManager.slice(5),
        )
      )
        throw new Error('Guide qualification changed before readiness.');
      return [group, { path: relative, sha256: sha256(bytes) }];
    }),
  );
  const inventory = outputInventory(outputRoot);
  if (!inventory.length) throw new Error('Guide output is empty.');
  const ready = {
    schemaVersion: 1,
    source,
    qualification: evidence,
    files: inventory,
  };
  writeFileSync(
    ownedPath(outputRoot, readyName, { missing: true }),
    `${JSON.stringify(ready, null, 2)}\n`,
    { flag: 'wx' },
  );
  return ready;
}

/** Readiness is exact-source and exact-byte qualification; it is not a signed attestation. */
export async function validateReady(
  root,
  {
    snapshot = sourceState,
    inspect = inspectGuideArtifacts,
    requireClean = false,
  } = {},
) {
  const source = snapshot(root);
  if (requireClean && source.dirty !== false)
    throw new Error('Publication requires a clean source checkout.');
  const outputRoot = ownedPath(root, 'dist/user-guide');
  const file = ownedPath(outputRoot, readyName);
  if (!lstatSync(file).isFile() || lstatSync(file).size > 2 * 1024 * 1024)
    throw new Error('Guide readiness marker is not a bounded file.');
  const markerBytes = readFileSync(file);
  let ready;
  try {
    ready = JSON.parse(markerBytes);
  } catch {
    throw new Error('Guide readiness marker is malformed.');
  }
  if (
    ready?.schemaVersion !== 1 ||
    !ready.source ||
    !unchangedSource(ready.source, source) ||
    !Array.isArray(ready.files) ||
    JSON.stringify(ready.files) !== JSON.stringify(outputInventory(outputRoot))
  ) {
    throw new Error('Guide readiness marker is stale or output bytes changed.');
  }
  const manifest = manifestFor(root);
  requireQualification(root, source, manifest);
  for (const group of ['acceptance', 'browser', 'browser-quality']) {
    const entry = ready.qualification?.[group];
    if (
      !entry ||
      typeof entry.path !== 'string' ||
      !new RegExp(`^\\.verification/${group}-[a-z0-9-]+\\.json$`, 'u').test(
        entry.path,
      )
    )
      throw new Error('Guide readiness qualification is invalid.');
    const bytes = readFileSync(ownedPath(root, entry.path));
    let report;
    try {
      report = JSON.parse(bytes);
    } catch {
      throw new Error('Guide readiness evidence is malformed.');
    }
    if (
      sha256(bytes) !== entry.sha256 ||
      !qualifiedReport(report, group, source, manifest.packageManager.slice(5))
    )
      throw new Error('Guide readiness evidence changed.');
  }
  await inspect(outputRoot, root);
  if (
    sha256(readFileSync(file)) !== sha256(markerBytes) ||
    JSON.stringify(ready.files) !== JSON.stringify(outputInventory(outputRoot))
  )
    throw new Error('Guide output changed during release inspection.');
  for (const group of ['acceptance', 'browser', 'browser-quality']) {
    const entry = ready.qualification[group];
    if (sha256(readFileSync(ownedPath(root, entry.path))) !== entry.sha256)
      throw new Error('Guide evidence changed during release inspection.');
  }
  if (!unchangedSource(source, snapshot(root)))
    throw new Error('Source changed during guide release inspection.');
  return ready;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    if (
      process.argv.slice(2).some((argument) => argument !== '--require-clean')
    )
      throw new Error('Invalid release option.');
    await validateReady(fileURLToPath(new URL('../../', import.meta.url)), {
      requireClean: process.argv.includes('--require-clean'),
    });
    console.log(
      '[ok] User guide release qualified at the current source and output bytes.',
    );
  } catch {
    console.error(
      'User guide release incomplete; no publication is permitted.',
    );
    process.exitCode = 1;
  }
}

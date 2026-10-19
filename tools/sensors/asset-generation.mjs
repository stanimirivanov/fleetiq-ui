import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import {
  checkGenerationProvenance,
  generationProvenance,
  maintenanceGeneratorUpdate,
} from './generation-provenance.mjs';

const maxBuffer = 4 * 1024 * 1024;
function bytes(value) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === 'string') return Buffer.from(value, 'utf8');
  return Buffer.alloc(0);
}

/** Invoke the pinned Node CLI without shell expansion or payload diagnostics.
 * Check mode compares exact bytes and never writes the selected output.
 */
export async function generateAssetContract({
  repositoryRoot,
  specPath,
  outputPath,
  generatorPath,
  check = false,
  run = spawnSync,
  nodeExecutable = process.execPath,
  provenancePath,
  generatorVersion,
}) {
  if (Boolean(provenancePath) !== Boolean(generatorVersion))
    throw new Error(
      'Generator version and provenance must be supplied together.',
    );
  if (
    provenancePath &&
    (typeof generatorVersion !== 'string' ||
      generatorVersion.length > 64 ||
      !/^\d+\.\d+\.\d+$/u.test(generatorVersion))
  )
    throw new Error('Invalid installed generator version.');
  let result;
  try {
    result = run(
      nodeExecutable,
      [
        generatorPath,
        '--spec',
        specPath,
        '--name',
        'FleetIqApi',
        '--format',
        'httpclient',
      ],
      { cwd: repositoryRoot, maxBuffer, timeout: 120_000 },
    );
  } catch {
    throw new Error(
      'Effect OpenAPI generation failed: subprocess could not launch',
    );
  }
  if (result.error || result.status !== 0) {
    // OS and subprocess messages may contain unexpected payloads or credentials.
    const reason = result.error
      ? 'subprocess error'
      : result.signal
        ? 'subprocess interrupted'
        : `exit ${result.status}`;
    throw new Error(`Effect OpenAPI generation failed: ${reason}`);
  }
  if (bytes(result.stderr).toString('utf8').trim()) {
    throw new Error(
      'Effect OpenAPI generation warned on stderr; output was rejected',
    );
  }
  const generated = bytes(result.stdout);
  if (!generated.includes(Buffer.from('export const AssetPage =', 'utf8'))) {
    throw new Error('Generated contract has no AssetPage schema');
  }
  if (check) {
    let committed;
    try {
      committed = await readFile(outputPath);
    } catch {
      throw new Error('Cannot read generated FleetIQ HTTP contract');
    }
    let previousVersion;
    if (provenancePath)
      previousVersion = await checkGenerationProvenance(
        provenancePath,
        committed,
        await readFile(specPath),
      );
    if (
      provenancePath &&
      previousVersion !== generatorVersion &&
      !maintenanceGeneratorUpdate(previousVersion, generatorVersion)
    )
      throw new Error(
        'Generated FleetIQ HTTP contract is stale for this generator version; run pnpm contract:generate',
      );
    if (
      !committed.equals(generated) &&
      provenancePath &&
      maintenanceGeneratorUpdate(previousVersion, generatorVersion)
    )
      return { checked: true, bytes: generated.length, generatorDrift: true };
    if (!committed.equals(generated)) {
      throw new Error(
        'Generated FleetIQ HTTP contract is stale; run pnpm contract:generate',
      );
    }
  } else {
    await writeFile(outputPath, generated);
    if (provenancePath)
      await writeFile(
        provenancePath,
        `${JSON.stringify(generationProvenance(generated, await readFile(specPath), generatorVersion), null, 2)}\n`,
      );
  }
  return { checked: check, bytes: generated.length };
}

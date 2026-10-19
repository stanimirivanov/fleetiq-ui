import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';

const versionParts = (value) =>
  typeof value === 'string' &&
  value.length <= 64 &&
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(value)
    ? value.split('.').map(Number)
    : null;
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function generationProvenance(output, spec, version) {
  if (!versionParts(version)) throw new Error('Invalid generator version.');
  return {
    schemaVersion: 1,
    generator: { name: '@effect/openapi-generator', version },
    specSha256: digest(spec),
    outputSha256: digest(output),
  };
}

export function maintenanceGeneratorUpdate(before, after) {
  const previous = versionParts(before),
    next = versionParts(after);
  return Boolean(
    previous &&
      next &&
      previous[0] === next[0] &&
      (next[1] > previous[1] ||
        (next[1] === previous[1] && next[2] > previous[2])),
  );
}

/** Bind the checked-in client to its producing tool and exact backend specification. */
export async function checkGenerationProvenance(file, output, spec) {
  try {
    const bytes = await readFile(file);
    if (bytes.length > 16_384) throw new Error();
    const record = JSON.parse(bytes.toString('utf8'));
    const expected = generationProvenance(
      output,
      spec,
      record.generator?.version,
    );
    if (!isDeepStrictEqual(record, expected)) throw new Error();
    return record.generator.version;
  } catch {
    throw new Error(
      'Generated contract provenance is stale or unavailable; run pnpm contract:generate.',
    );
  }
}

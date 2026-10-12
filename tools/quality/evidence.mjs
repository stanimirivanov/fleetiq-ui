import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { makeOwnedDirectory } from '../security/owned.mjs';
import { sourceState } from '../verification/source-state.mjs';
import { validateObservation } from './observations.mjs';
/** Caller supplies bounded numeric/rule-category observations, never DOM or error payloads. */
export function sourceIdentity(root) {
  return sourceState(root);
}
export function writeQualityEvidence(root, kind, source, observations) {
  if (!['performance', 'accessibility', 'coverage', 'mutations'].includes(kind))
    throw new Error('Unregistered quality evidence category.');
  if (
    !source ||
    Object.keys(source).sort().join(',') !== 'digest,dirty,files,revision' ||
    !/^[a-f0-9]{40,64}$/u.test(source.revision) ||
    !/^[a-f0-9]{64}$/u.test(source.digest) ||
    typeof source.dirty !== 'boolean' ||
    !Number.isSafeInteger(source.files) ||
    source.files < 1
  )
    throw new Error(
      'Quality source identity is malformed or contains unregistered fields.',
    );
  validateObservation(kind, observations);
  const directory = makeOwnedDirectory(root, '.verification');
  const file = path.join(
    directory,
    `quality-${kind}-${process.pid}-${randomUUID()}.json`,
  );
  const bytes = `${JSON.stringify({ schemaVersion: 1, kind, source, observations })}\n`;
  if (Buffer.byteLength(bytes) > 128 * 1024)
    throw new Error('Quality evidence exceeded its bounded size.');
  writeFileSync(file, bytes, { flag: 'wx', mode: 0o600 });
  return file;
}

import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  makeOwnedDirectory,
  ownedFile,
  plainFiles,
} from '../security/owned.mjs';

/** Retain inspected browser diagnostics only; private acceptance receipts stay private. */
export function retainCandidateArtifacts(root, directory) {
  const suffix = `candidate-${randomUUID()}`;
  for (const relative of ['test-results', 'playwright-report']) {
    if (!existsSync(path.join(directory, relative))) continue;
    const files = plainFiles(path.join(directory, relative));
    let bytes = 0;
    if (files.length > 2000)
      throw new Error('Candidate artifact inventory exceeds its bound.');
    for (const name of files) {
      const source = ownedFile(directory, `${relative}/${name}`);
      const body = readFileSync(source);
      bytes += body.length;
      if (body.length > 64 * 1024 * 1024 || bytes > 256 * 1024 * 1024)
        throw new Error('Candidate artifact bytes exceed their bound.');
      const target = `${relative}/${suffix}/${name}`;
      makeOwnedDirectory(root, path.posix.dirname(target));
      writeFileSync(path.join(root, target), body, { flag: 'wx', mode: 0o600 });
    }
  }
}

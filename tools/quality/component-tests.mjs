import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { makeOwnedDirectory, ownedFile } from '../security/owned.mjs';
import { runEntrypoint } from '../sensors/entrypoint.mjs';
import { qualifyTools } from '../verification/execution.mjs';
import { unchangedSource } from '../verification/source-state.mjs';
import { assessCoverage } from './coverage.mjs';
import { sourceIdentity, writeQualityEvidence } from './evidence.mjs';
import { repositoryRoot } from './policy.mjs';
/** Reset only three registered reports; refuse redirected parents before cleanup. */
export function prepareCoverage(root) {
  const directory = makeOwnedDirectory(root, 'apps/web/coverage');
  for (const name of [
    'coverage-summary.json',
    'coverage-final.json',
    'test-results.json',
  ]) {
    if (existsSync(path.join(directory, name)))
      unlinkSync(ownedFile(directory, name));
  }
  return directory;
}
await runEntrypoint(import.meta.url, () => {
  const source = sourceIdentity(repositoryRoot);
  const manifest = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'),
  );
  const qualified = qualifyTools(repositoryRoot, manifest);
  if (qualified.blocker)
    throw new Error('Component coverage prerequisite unavailable.');
  const directory = prepareCoverage(repositoryRoot);
  const result = spawnSync(
    qualified.launcher.command,
    [
      ...qualified.launcher.args,
      '--filter',
      '@fleetiq/web',
      'exec',
      'vitest',
      'run',
      '--coverage',
    ],
    { cwd: repositoryRoot, stdio: 'inherit', shell: false, windowsHide: true },
  );
  if (result.error || result.status !== 0 || result.signal)
    throw new Error('Component coverage did not complete successfully.');
  if (!unchangedSource(source, sourceIdentity(repositoryRoot)))
    throw new Error('Sources changed during component coverage.');
  const read = (name) =>
    JSON.parse(readFileSync(ownedFile(directory, name), 'utf8'));
  const observations = assessCoverage(
    read('coverage-summary.json'),
    read('test-results.json'),
  );
  const file = writeQualityEvidence(
    repositoryRoot,
    'coverage',
    source,
    observations,
  );
  console.log(
    'Scoped component coverage and critical obligations passed; evidence: ' +
      file,
  );
});

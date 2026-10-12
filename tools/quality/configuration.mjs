import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runEntrypoint } from '../sensors/entrypoint.mjs';
import { qualityPolicy, repositoryRoot } from './policy.mjs';
import { coverageScope } from './scope.mjs';
export function inspectQualityConfiguration(
  app,
  policy = qualityPolicy,
  scope = coverageScope,
) {
  if (
    app.scripts?.['test:component'] !==
      'node ../../tools/quality/component-tests.mjs' ||
    app.devDependencies?.vitest !== '5.0.3' ||
    app.devDependencies?.['@vitest/coverage-v8'] !== '5.0.3'
  )
    throw new Error(
      'Keep the canonical component coverage runner and matching provider pins.',
    );
  if (
    scope.length !== 10 ||
    new Set(scope).size !== scope.length ||
    Object.keys(policy.coverage).sort().join(',') !==
      scope.slice().sort().join(',')
  )
    throw new Error(
      'Critical coverage scope and measured baselines must agree; source omission requires owner review.',
    );
  if (
    policy.performance.warmups !== 2 ||
    policy.performance.samples !== 5 ||
    policy.performance.catalogueRecords !== 100 ||
    policy.performance.pageSize !== 50
  )
    throw new Error('Keep the calibrated bounded rendering workload.');
  return { passed: true };
}
await runEntrypoint(import.meta.url, () => {
  inspectQualityConfiguration(
    JSON.parse(
      readFileSync(path.join(repositoryRoot, 'apps/web/package.json'), 'utf8'),
    ),
  );
  console.log(
    'Measured quality configuration and complete critical coverage scope agree.',
  );
});

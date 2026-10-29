import { readFileSync } from 'node:fs';
import path from 'node:path';
import browserConfiguration from '../../apps/web-e2e/playwright.quality.config.ts';
import { runEntrypoint } from '../sensors/entrypoint.mjs';
import { DECLARED } from '../verification/declared-dependencies.mjs';
import { qualityPolicy, repositoryRoot } from './policy.mjs';
import { coverageScope } from './scope.mjs';
export function inspectQualityConfiguration(
  app,
  policy = qualityPolicy,
  scope = coverageScope,
  browser = browserConfiguration,
) {
  if (
    app.scripts?.['test:component'] !==
      'node ../../tools/quality/component-tests.mjs' ||
    app.devDependencies?.vitest !== DECLARED.tools.vitest ||
    app.devDependencies?.['@vitest/coverage-v8'] !== DECLARED.tools.vitest
  )
    throw new Error(
      'Keep the canonical component coverage runner and matching provider pins.',
    );
  if (
    scope.length !== 16 ||
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
  const projects = browser.projects ?? [];
  const accessibility = projects.find(
    (project) => project.name === 'rendered-accessibility',
  );
  const performance = projects.find(
    (project) => project.name === 'rendering-performance',
  );
  const map = projects.find((p) => p.name === 'geographic-map');
  if (
    !map ||
    JSON.stringify(map.testMatch) !==
      JSON.stringify(['**/geographic-map.spec.ts']) ||
    map.use?.trace !== 'off' ||
    map.use?.video !== 'off' ||
    JSON.stringify(map.use?.launchOptions?.args) !==
      JSON.stringify([
        '--js-flags=--expose-gc',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
      ])
  )
    throw new Error(
      'Keep the owned unrecorded geographic worker lifecycle project.',
    );
  if (
    browser.workers !== 1 ||
    browser.retries !== 0 ||
    projects.length !== 3 ||
    !accessibility ||
    !performance ||
    JSON.stringify(accessibility.testMatch) !==
      JSON.stringify([
        '**/measured-browser.spec.ts',
        '**/geographic-map-accessibility.spec.ts',
        '**/overview-accessibility.spec.ts',
        '**/commissioning-accessibility.spec.ts',
      ]) ||
    JSON.stringify(performance.testMatch) !==
      JSON.stringify([
        '**/rendering-performance.spec.ts',
        '**/resource-sensors.spec.ts',
        '**/overview-performance.spec.ts',
      ]) ||
    performance.use?.trace !== 'off' ||
    performance.use?.video !== 'off' ||
    JSON.stringify(performance.use?.launchOptions?.args) !==
      JSON.stringify(['--js-flags=--expose-gc'])
  )
    throw new Error(
      'Keep both owned quality projects, unrecorded precise-GC measurements, one worker and zero retries.',
    );
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

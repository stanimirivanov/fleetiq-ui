import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { temporary } from '../security/owned.mjs';
import { runEntrypoint } from '../sensors/entrypoint.mjs';
import { repositoryRoot } from './policy.mjs';
/** Qualify the actual auto fixture: a positive control must pass and the redacted error case must fail. */
export function qualifyBrowserErrorFixture(
  root = repositoryRoot,
  run = spawnSync,
) {
  const owned = temporary('fleetiq-pageerror-');
  try {
    writeFileSync(
      path.join(owned.root, 'package.json'),
      JSON.stringify({ type: 'module' }),
    );
    const require = createRequire(path.join(root, 'package.json'));
    const cli = path.join(
      path.dirname(require.resolve('@playwright/test/package.json')),
      'cli.js',
    );
    const fixture = path
      .join(root, 'apps/web-e2e/fixtures/browser-quality-test.ts')
      .replaceAll('\\', '/');
    const report = path.join(owned.root, 'report.json');
    const config = path.join(owned.root, 'playwright.config.mjs');
    writeFileSync(
      config,
      `export default {testDir:${JSON.stringify(owned.root)},testMatch:'probe.spec.ts',workers:1,retries:0,timeout:15000,reporter:[['json',{outputFile:${JSON.stringify(report)}}]],outputDir:${JSON.stringify(path.join(owned.root, 'output'))},use:{browserName:'chromium',headless:true,trace:'off',screenshot:'off'}};`,
    );
    writeFileSync(
      path.join(owned.root, 'probe.spec.ts'),
      `import {test,expect} from ${JSON.stringify(fixture)};
test('owned error observer positive control',async({page})=>{await page.setContent('<main><h1>Controlled page</h1></main>');await expect(page.getByRole('heading')).toBeVisible();});
test('owned error observer rejects uncaught errors',async({page})=>{await page.setContent('<main>Controlled error</main>');const observed=page.waitForEvent('pageerror');await page.evaluate(()=>setTimeout(()=>{throw new Error('synthetic-private-error-marker');},0));await observed;});
`,
    );
    const result = run(process.execPath, [cli, 'test', '--config', config], {
      cwd: root,
      encoding: 'utf8',
      shell: false,
      timeout: 90000,
      maxBuffer: 2 * 1024 * 1024,
    });
    if (result.error || result.signal || result.status !== 1)
      throw new Error(
        'Browser error-observer qualification did not reject its controlled violation.',
      );
    const data = JSON.parse(readFileSync(report, 'utf8'));
    const specs = data.suites.flatMap((suite) => suite.specs ?? []);
    const positive = specs.find(
      (spec) => spec.title === 'owned error observer positive control',
    );
    const negative = specs.find(
      (spec) => spec.title === 'owned error observer rejects uncaught errors',
    );
    if (
      positive?.tests[0]?.results[0]?.status !== 'passed' ||
      negative?.tests[0]?.results[0]?.status !== 'failed' ||
      !negative.tests[0].results[0].errors.some((error) =>
        error.message.includes(
          'Unexpected browser page error (details redacted)',
        ),
      )
    )
      throw new Error(
        'Browser error observer positive/negative assertions failed qualification.',
      );
    return {
      passed: true,
      positiveControl: 'passed',
      unexpectedPageError: 'rejected',
    };
  } finally {
    owned.dispose();
  }
}
await runEntrypoint(import.meta.url, () =>
  console.log(
    'Actual browser error fixture qualified:',
    qualifyBrowserErrorFixture(),
  ),
);

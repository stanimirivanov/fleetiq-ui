import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ownedFile } from '../security/owned.mjs';
import { runEntrypoint } from '../sensors/entrypoint.mjs';
import { sourceIdentity, writeQualityEvidence } from './evidence.mjs';
import { qualityPolicy, repositoryRoot } from './policy.mjs';
import { coverageScope } from './scope.mjs';

export { coverageScope } from './scope.mjs';

const metrics = ['lines', 'statements', 'branches', 'functions'];
/** An omitted source or mandatory assertion cannot improve the scoped percentage. */
export function assessCoverage(summary, results, policy = qualityPolicy) {
  if (
    !summary ||
    !results ||
    results.success !== true ||
    !Array.isArray(results.testResults)
  )
    throw new Error('Coverage/test qualification is unavailable.');
  const observations = [];
  for (const file of coverageScope) {
    const matches = Object.entries(summary).filter(([name]) =>
      name.replaceAll('\\', '/').endsWith(`/apps/web/${file}`),
    );
    const baseline = policy.coverage[file];
    if (matches.length !== 1 || !baseline)
      throw new Error(
        `Owned coverage file is missing or unregistered: ${file}`,
      );
    const data = matches[0][1];
    for (const metric of metrics) {
      const current = data[metric],
        floor = baseline[metric];
      if (!Number.isSafeInteger(floor?.minimumTotal) || floor.minimumTotal < 1)
        throw new Error(`Coverage baseline denominator is incomplete: ${file}`);
      if (
        !current ||
        !floor ||
        !Number.isSafeInteger(current.total) ||
        !Number.isSafeInteger(current.covered) ||
        current.covered < 0 ||
        current.covered > current.total ||
        current.total < floor.minimumTotal
      )
        throw new Error(
          `Coverage denominator regressed or is malformed: ${file}`,
        );
      const percentage =
        current.total === 0 ? 100 : (100 * current.covered) / current.total;
      if (
        !Number.isFinite(floor.percent) ||
        floor.percent < 1 ||
        floor.percent > 100 ||
        percentage < floor.percent
      )
        throw new Error(`Critical coverage floor failed: ${file} (${metric})`);
    }
    observations.push({
      file,
      metrics: Object.fromEntries(
        metrics.map((key) => [
          key,
          { total: data[key].total, covered: data[key].covered },
        ]),
      ),
    });
  }
  for (const obligation of policy.obligations) {
    const suite = results.testResults.find((entry) =>
      entry.name.replaceAll('\\', '/').endsWith(`/apps/web/${obligation.file}`),
    );
    if (
      !suite ||
      obligation.titles.some(
        (title) =>
          !suite.assertionResults.some(
            (test) => test.title === title && test.status === 'passed',
          ),
      )
    )
      throw new Error(
        'Critical behavior obligation is absent, skipped or failed: ' +
          obligation.file,
      );
  }
  return {
    passed: true,
    files: observations,
    obligations: policy.obligations.reduce(
      (count, item) => count + item.titles.length,
      0,
    ),
  };
}
await runEntrypoint(import.meta.url, () => {
  const coverage = path.join(repositoryRoot, 'apps/web/coverage');
  const read = (name) =>
    JSON.parse(readFileSync(ownedFile(coverage, name), 'utf8'));
  const result = assessCoverage(
    read('coverage-summary.json'),
    read('test-results.json'),
  );
  const file = writeQualityEvidence(
    repositoryRoot,
    'coverage',
    sourceIdentity(repositoryRoot),
    result,
  );
  console.log(
    'Scoped critical coverage and behavior obligations passed; evidence: ' +
      file,
  );
});

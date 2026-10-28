/** Inspect built bytes from the running image, with the existing graph and size authority. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inspectBundle } from '../quality/bundle.mjs';
import { qualityPolicy } from '../quality/policy.mjs';
import { ensure, hash } from './policy.mjs';
import { docker } from './process.mjs';
export async function inspectRuntimeBundle(container, directory) {
  const root = join(directory, 'served');
  await docker(['cp', `${container}:/srv/.`, root]);
  await docker([
    'cp',
    `${container}:/usr/share/fleetiq/quality-manifest.json`,
    join(root, 'quality-manifest.json'),
  ]);
  const report = {
    ...inspectBundle(root),
    graphDigest: `sha256:${hash(readFileSync(join(root, 'quality-manifest.json')))}`,
  };
  validateBundleEvidence(report);
  writeFileSync(
    join(directory, 'reports/bundle.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  return { root, report };
}
export function validateBundleEvidence(report) {
  ensure(
    report.passed === true &&
      Number.isSafeInteger(report.files) &&
      report.files > 0 &&
      Number.isSafeInteger(report.modules) &&
      report.modules > 0 &&
      /^sha256:[a-f0-9]{64}$/u.test(report.graphDigest),
    'Missing built-bundle evidence.',
  );
  for (const key of [
    'javascriptBytes',
    'javascriptGzipBytes',
    'cssBytes',
    'cssGzipBytes',
  ])
    ensure(
      Number.isSafeInteger(report[key]) &&
        report[key] >= 0 &&
        report[key] <= qualityPolicy.bundle[key],
      'Built bundle exceeds reviewed budgets.',
    );
  for (const key of [
    'javascriptBytes',
    'javascriptGzipBytes',
    'cssBytes',
    'cssGzipBytes',
  ])
    ensure(
      Number.isSafeInteger(report.map?.[key]) &&
        report.map[key] >= 0 &&
        report.map[key] <= qualityPolicy.bundle.map[key],
      'Lazy map bundle evidence is missing or exceeds reviewed budgets.',
    );
}

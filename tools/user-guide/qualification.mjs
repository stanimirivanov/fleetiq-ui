import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { selectedChecks } from '../verification/catalogue.mjs';
import { REVIEWED } from '../verification/reviewed-dependencies.mjs';
import { unchangedSource } from '../verification/source-state.mjs';
import { ownedPath } from './owned-output.mjs';

export function qualifiedReport(report, group, source, pin) {
  if (
    report?.schemaVersion !== 1 ||
    report.kind !== undefined ||
    report.qualificationPass !== undefined ||
    report.group !== group ||
    report.completePass !== true ||
    report.sourceStable !== true ||
    report.blocker !== null ||
    report.dependencyReview?.status !== 'current' ||
    report.dependencyReview.changes !== 0 ||
    report.dependencyReview.issues !== 0 ||
    report.installedTools?.status !== 'current' ||
    report.installedTools.issues !== 0 ||
    !report.source ||
    !unchangedSource(report.source, source) ||
    report.tools?.pnpm !== pin ||
    typeof report.tools?.node !== 'string' ||
    !report.tools.node.startsWith(`v${REVIEWED.nodeMajor}.`) ||
    typeof report.tools?.git !== 'string' ||
    !Array.isArray(report.checks)
  )
    return false;
  const expected = selectedChecks(group);
  return (
    report.checks.length === expected.length &&
    expected.every(({ id, script }, index) => {
      const entry = report.checks[index];
      return (
        entry?.id === id &&
        entry.command === `pnpm run ${script}` &&
        entry.status === 'passed' &&
        entry.reason === null &&
        entry.exitCode === 0
      );
    })
  );
}

/** All three complete groups must qualify the exact source bytes used for the book. */
export function requireQualification(root, source, manifest) {
  const directory = ownedPath(root, '.verification');
  if (!lstatSync(directory).isDirectory())
    throw new Error('Verification evidence is unavailable.');
  const pin = /^pnpm@(\d+\.\d+\.\d+)$/u.exec(manifest.packageManager)?.[1];
  if (!pin) throw new Error('Guide package-manager pin is invalid.');
  const reports = readdirSync(directory).filter((name) =>
    /^(?:acceptance|browser|browser-quality)-[a-z0-9-]+\.json$/u.test(name),
  );
  const found = {};
  for (const name of reports.sort()) {
    const file = ownedPath(root, `.verification/${name}`);
    if (!lstatSync(file).isFile() || lstatSync(file).size > 2 * 1024 * 1024)
      throw new Error('Verification evidence is not a bounded file.');
    let report;
    try {
      report = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      continue;
    }
    for (const group of ['acceptance', 'browser', 'browser-quality']) {
      if (qualifiedReport(report, group, source, pin))
        found[group] = `.verification/${name}`;
    }
  }
  if (!found.acceptance || !found.browser || !found['browser-quality'])
    throw new Error(
      'Guide generation requires complete acceptance, browser and measured-quality evidence at the current source revision and digest.',
    );
  return found;
}

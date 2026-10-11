import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAllDocuments } from 'yaml';
import { runEntrypoint } from '../sensors/entrypoint.mjs';
import { qualifyTools } from '../verification/execution.mjs';
import { makeParent, ownedFile, relativePath, temporary } from './owned.mjs';
import { policies, scanScope, validatePolicy } from './policy.mjs';
import { command } from './process.mjs';

const severities = ['info', 'low', 'moderate', 'high', 'critical'];
/** Validate the maintained pnpm12 report before using a zero-advisory conclusion. */
export function evaluateAudit(report, policy, exitCode = 0) {
  validatePolicy(policy);
  if (
    !report ||
    Object.keys(report).sort().join(',') !== 'advisories,metadata' ||
    typeof report.advisories !== 'object' ||
    !report.advisories ||
    Array.isArray(report.advisories) ||
    !report.metadata?.vulnerabilities ||
    ![0, 1].includes(exitCode)
  )
    throw new Error(
      'Advisory report is malformed or incomplete; no clean result.',
    );
  const counts = Object.fromEntries(
    severities.map((severity) => [severity, 0]),
  );
  const findings = [];
  let excepted = 0;
  for (const advisory of Object.values(report.advisories)) {
    if (
      !/^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/u.test(
        advisory.github_advisory_id,
      ) ||
      !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/u.test(advisory.module_name) ||
      !severities.includes(advisory.severity) ||
      !Array.isArray(advisory.findings) ||
      !advisory.findings.length
    )
      throw new Error('Advisory identity or findings are malformed.');
    counts[advisory.severity] += 1;
    for (const finding of advisory.findings) {
      if (
        !/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/iu.test(finding.version) ||
        !Array.isArray(finding.paths) ||
        !finding.paths.length ||
        finding.paths.some((item) => typeof item !== 'string' || !item)
      )
        throw new Error('Advisory installed-version evidence is incomplete.');
      const exception = policy.advisoryExceptions.find(
        (item) =>
          item.advisory === advisory.github_advisory_id &&
          item.package === advisory.module_name &&
          item.version === finding.version &&
          finding.paths.every((value) => item.paths.includes(value)),
      );
      if (exception) excepted += 1;
      else
        findings.push(
          `${advisory.github_advisory_id} ${advisory.module_name}@${finding.version} [${advisory.severity}]`,
        );
    }
  }
  for (const severity of severities)
    if (report.metadata.vulnerabilities[severity] !== counts[severity])
      throw new Error(
        'Advisory summary contradicts report findings; ignored or incomplete output rejected.',
      );
  if ((exitCode === 1) !== Object.keys(report.advisories).length > 0)
    throw new Error('Advisory process status contradicts its findings.');
  if (findings.length)
    throw new Error(
      `Dependency advisory policy rejected: ${[...new Set(findings)].join('; ')}. Upgrade dependencies or obtain an exact reviewed exception.`,
    );
  return { advisories: Object.keys(report.advisories).length, excepted };
}
/** Copy only manifests/lock, excluding ambient ignore lists and registry settings. */
export function auditSnapshot(root, destination) {
  let lock;
  try {
    const documents = parseAllDocuments(
      readFileSync(ownedFile(root, 'pnpm-lock.yaml'), 'utf8'),
    );
    if (
      !documents.length ||
      documents.some((document) => document.errors.length)
    )
      throw new Error('Invalid lock documents.');
    const values = documents.map((document) => document.toJSON());
    if (
      values.some(
        (value) => !value.importers || value.lockfileVersion !== '9.0',
      )
    )
      throw new Error('Incomplete lock documents.');
    lock = {
      importers: Object.assign({}, ...values.map((value) => value.importers)),
    };
  } catch {
    throw new Error('Advisory review requires a valid frozen pnpm lockfile.');
  }
  if (
    !lock.importers ||
    !Object.keys(lock.importers).length ||
    !lock.importers['.']
  )
    throw new Error('Advisory lock has no complete importer inventory.');
  writeFileSync(
    path.join(destination, 'pnpm-lock.yaml'),
    readFileSync(ownedFile(root, 'pnpm-lock.yaml')),
  );
  const packages = [];
  for (const importer of Object.keys(lock.importers)) {
    const file =
      importer === '.'
        ? 'package.json'
        : `${relativePath(importer)}/package.json`;
    const source = ownedFile(root, file);
    const target = path.join(destination, file);
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(source, 'utf8'));
    } catch {
      throw new Error('Advisory importer manifest is invalid JSON.');
    }
    const keys = [
      'name',
      'version',
      'private',
      'packageManager',
      'dependencies',
      'devDependencies',
      'optionalDependencies',
      'peerDependencies',
    ];
    const inventory = Object.fromEntries(
      keys
        .filter((key) => Object.hasOwn(manifest, key))
        .map((key) => [key, manifest[key]]),
    );
    makeParent(target);
    writeFileSync(target, `${JSON.stringify(inventory, null, 2)}\n`);

    if (importer !== '.') packages.push(importer);
  }
  writeFileSync(
    path.join(destination, 'pnpm-workspace.yaml'),
    `packages:\n${packages.map((name) => `  - ${JSON.stringify(name)}`).join('\n')}\n`,
  );
  writeFileSync(
    path.join(destination, '.npmrc'),
    'registry=https://registry.npmjs.org\n',
  );
  return { importers: Object.keys(lock.importers).length };
}
export function checkAdvisories(root, { run, environment = process.env } = {}) {
  const scope = scanScope(root, { environment });
  const selectedPolicies = policies(root, scope);
  const manifest = JSON.parse(
    readFileSync(ownedFile(root, 'package.json'), 'utf8'),
  );
  const qualification = qualifyTools(root, manifest);
  if (qualification.blocker)
    throw new Error(
      'Pinned pnpm unavailable for advisory review; no clean result.',
    );
  const selected = temporary('fleetiq-advisory-');
  try {
    const inventory = auditSnapshot(root, selected.root);
    const config = path.join(selected.root, 'empty-config');
    writeFileSync(config, '');
    const result = command(
      qualification.launcher.command,
      [
        ...qualification.launcher.args,
        'audit',
        '--json',
        '--audit-level=info',
        '--registry=https://registry.npmjs.org',
        `--npmrc-auth-file=${config}`,
      ],
      { cwd: selected.root, run, accepted: [0, 1], environment },
    );
    let report;
    try {
      report = JSON.parse(result.stdout);
    } catch {
      throw new Error(
        'Registry audit did not return qualified JSON; no clean result.',
      );
    }
    for (const policy of selectedPolicies)
      evaluateAudit(report, policy, result.status);
    return { ...inventory, advisories: Object.keys(report.advisories).length };
  } finally {
    selected.dispose();
  }
}
await runEntrypoint(import.meta.url, () => {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..',
  );
  const report = checkAdvisories(root);
  console.log(
    `Dependency audit passed: ${report.importers} frozen importers; ${report.advisories} reviewed advisories.`,
  );
});

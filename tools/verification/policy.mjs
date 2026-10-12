import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { ACTIONS } from './actions.mjs';
import {
  CHECKS,
  GROUPS,
  REQUIRED_JOBS,
  REQUIRED_SCRIPTS,
  selectedChecks,
} from './catalogue.mjs';
import { inspectDelivery } from './delivery-policy.mjs';

/** Parse workflow structure rather than trusting text that merely mentions a gate. */
export function inspectPolicy(
  manifest,
  workflowSource,
  workspaceSource,
  guideSource,
) {
  const diagnostics = [];
  const fail = (message) => diagnostics.push(message);
  const parse = (source, label) => {
    const document = parseDocument(source, { uniqueKeys: true });
    if (document.errors.length > 0) {
      fail(`${label}: invalid YAML`);
      return {};
    }
    return document.toJS() ?? {};
  };
  const workflow = parse(workflowSource, 'quality workflow');
  const workspace = parse(workspaceSource, 'workspace');
  const guide = parse(guideSource, 'guide workflow');
  inspectDelivery(workflow, guide, fail);
  if (
    manifest.devDependencies?.['typescript-parser'] !==
      'npm:typescript@6.0.3' ||
    manifest.devDependencies?.yauzl !== '3.4.0'
  )
    fail('Keep explicit reviewed AST and archive parser pins.');
  if (
    manifest.devDependencies?.['@axe-core/playwright'] !== '4.13.0' ||
    manifest.devDependencies?.vite !== '8.3.2'
  )
    fail('Keep the reviewed browser-quality tool pins.');
  if (manifest.packageManager !== 'pnpm@12.5.1') fail('Pin pnpm@12.5.1.');
  if (
    manifest.devDependencies?.typescript !== '7.0.2' ||
    manifest.devDependencies?.['dependency-cruiser'] !== '18.5.0'
  ) {
    fail('Keep the reviewed compiler and architecture tool pins.');
  }
  if (
    workspace.packageExtensions?.['dependency-cruiser@18.5.0']?.dependencies
      ?.typescript !== '6.0.3'
  ) {
    fail('Declare the architecture parser package extension explicitly.');
  }
  for (const [name, expected] of Object.entries(REQUIRED_SCRIPTS)) {
    if (manifest.scripts?.[name] !== expected)
      fail(`Canonical script changed or missing: ${name}`);
  }
  for (const group of Object.keys(GROUPS)) {
    try {
      selectedChecks(group);
    } catch {
      fail(`Invalid check inventory: ${group}`);
    }
  }
  if (
    CHECKS.some(({ script }) => ['check', 'e2e', 'verify'].includes(script))
  ) {
    fail('A group must not invoke itself.');
  }
  const triggers = workflow.on;
  if (
    !triggers ||
    !Object.hasOwn(triggers, 'pull_request') ||
    (triggers.pull_request !== null &&
      JSON.stringify(triggers.pull_request) !== '{}') ||
    JSON.stringify(triggers.push) !== JSON.stringify({ branches: ['main'] })
  ) {
    fail('Require unfiltered PR and main-push verification.');
  }
  if (workflow.defaults !== undefined || workflow.env !== undefined) {
    fail('Unregistered workflow execution defaults or environment.');
  }
  if (
    JSON.stringify(workflow.permissions) !==
    JSON.stringify({ contents: 'read' })
  ) {
    fail('Quality workflow permissions must be contents: read only.');
  }
  for (const [name, { platform, command }] of Object.entries(REQUIRED_JOBS)) {
    const job = workflow.jobs?.[name];
    if (!job || job['runs-on'] !== platform) {
      fail(`Required job absent or wrong platform: ${name}`);
      continue;
    }
    if (
      job.if !== undefined ||
      (job['continue-on-error'] !== undefined &&
        job['continue-on-error'] !== false) ||
      job.permissions !== undefined ||
      job.needs !== undefined ||
      job.defaults !== undefined ||
      job.env !== undefined ||
      job.container !== undefined ||
      job.strategy !== undefined
    ) {
      fail(`Required job can be skipped or weakened: ${name}`);
    }
    const steps = Array.isArray(job.steps) ? job.steps : [];
    const gate = steps.filter((step) => step.run === command);
    const install = steps.filter(
      (step) => step.run === 'pnpm install --frozen-lockfile',
    );
    const node = steps.filter(
      (step) =>
        step.uses === ACTIONS.node &&
        String(step.with?.['node-version']) === '24',
    );
    const checkout = steps.filter((step) => step.uses === ACTIONS.checkout);
    if (
      gate.length !== 1 ||
      install.length !== 1 ||
      node.length !== 1 ||
      checkout.length !== 1
    ) {
      fail(`Required setup, frozen install or canonical gate missing: ${name}`);
      continue;
    }
    for (const step of [...gate, ...install, ...node, ...checkout]) {
      if (
        step.if !== undefined ||
        (step['continue-on-error'] !== undefined &&
          step['continue-on-error'] !== false) ||
        step['working-directory'] !== undefined ||
        step.shell !== undefined ||
        step.env !== undefined
      ) {
        fail(`Required step can be skipped or weakened: ${name}`);
      }
    }
    const scannerInstall = steps.filter(
      (step) => step.run === 'pnpm security:install' && step.if === undefined,
    );
    const corepack = steps.filter(
      (step) => step.run === 'corepack enable' && step.if === undefined,
    );
    if (scannerInstall.length !== 1 || corepack.length !== 1) {
      fail('Required scanner/package-manager setup missing.');
      continue;
    }
    const positions = [
      checkout[0],
      node[0],
      corepack[0],
      install[0],
      scannerInstall[0],
      gate[0],
    ].map((step) => steps.indexOf(step));
    if (
      positions.some(
        (position, index) => index > 0 && position <= positions[index - 1],
      )
    ) {
      fail(`Setup must precede installation and verification: ${name}`);
    }
  }
  return diagnostics;
}
export function checkPolicy(root) {
  return inspectPolicy(
    JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')),
    readFileSync(path.join(root, '.github/workflows/quality.yml'), 'utf8'),
    readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8'),
    readFileSync(path.join(root, '.github/workflows/user-guide.yml'), 'utf8'),
  );
}

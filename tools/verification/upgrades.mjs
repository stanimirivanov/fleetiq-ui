import { readFileSync, statSync } from 'node:fs';
import { parseDocument } from 'yaml';
import { ownedFile } from '../security/owned.mjs';
import {
  readReviewedDependencies,
  validateReviewedDependencies,
} from './reviewed-dependencies.mjs';

const FILES = Object.freeze({
  rootManifest: 'package.json',
  webManifest: 'apps/web/package.json',
  e2eManifest: 'apps/web-e2e/package.json',
  workspace: 'pnpm-workspace.yaml',
  qualityWorkflow: '.github/workflows/quality.yml',
  guideWorkflow: '.github/workflows/user-guide.yml',
});
const QUALIFICATION = Object.freeze([
  'pnpm install --frozen-lockfile',
  'pnpm security:install',
  'pnpm check',
  'pnpm e2e',
  'pnpm verify --group browser-quality',
  'pnpm security:artifacts',
]);
const exactVersion = (value) =>
  typeof value === 'string' &&
  value.length <= 64 &&
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u.test(value);
const object = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const issue = (code, role, locations) => ({ code, role, locations });

/**
 * Compare declared candidates with reviewed trust, without changing either.
 * Exact, coordinated proposals still require owner review and qualification;
 * this inventory is diagnostic evidence, never an acceptance receipt.
 */
export function inspectUpgradeInventory(inputs) {
  const changes = [];
  const issues = [];
  const block = (code, role, locations) => {
    if (issues.length < 64) issues.push(issue(code, role, locations));
  };
  const changed = (role, reviewed, proposed, locations) => {
    if (proposed !== reviewed)
      changes.push({
        role,
        reviewed,
        proposed,
        locations,
        owner: 'Repository maintainers',
        qualification: [
          ...(Object.hasOwn(inputs.registry.tools, role)
            ? [
                'pnpm dependencies:qualify --group structural',
                'pnpm dependencies:qualify --group browser',
                'pnpm dependencies:qualify --group browser-quality',
              ]
            : []),
          ...QUALIFICATION,
        ],
      });
  };
  let registry;
  try {
    registry = validateReviewedDependencies(inputs.registry);
  } catch {
    return {
      status: 'blocked',
      changes: [],
      issues: [
        issue('invalid-reviewed-registry', 'registry', [
          'tools/verification/reviewed-dependencies.json',
        ]),
      ],
    };
  }
  if (!Object.keys(FILES).every((name) => object(inputs[name])))
    return {
      status: 'blocked',
      changes: [],
      issues: [
        issue('invalid-inventory-shape', 'inventory', Object.values(FILES)),
      ],
    };

  const pin = (role, declarations, reviewed) => {
    const locations = declarations.map(({ location }) => location);
    if (!declarations.every(({ value }) => exactVersion(value))) {
      block('missing-or-non-exact-pin', role, locations);
      return;
    }
    const values = new Set(declarations.map(({ value }) => value));
    if (values.size !== 1) {
      block('inconsistent-shared-pin', role, locations);
      return;
    }
    changed(role, reviewed, declarations[0].value, locations);
  };
  const declared = (input, name) => ({
    value: inputs[input].devDependencies?.[name],
    location: `${FILES[input]}#devDependencies/${name}`,
  });
  for (const [role, name, owners] of [
    ['compiler', 'typescript', ['rootManifest', 'webManifest', 'e2eManifest']],
    ['dependencyCruiser', 'dependency-cruiser', ['rootManifest']],
    ['vite', 'vite', ['rootManifest', 'webManifest']],
    ['axe', '@axe-core/playwright', ['rootManifest']],
    ['archive', 'yauzl', ['rootManifest']],
    ['vitest', 'vitest', ['webManifest']],
    ['playwright', '@playwright/test', ['rootManifest', 'e2eManifest']],
  ])
    pin(
      role,
      owners.map((owner) => declared(owner, name)),
      registry.tools[role],
    );

  const provider = declared('webManifest', '@vitest/coverage-v8');
  if (
    !exactVersion(provider.value) ||
    provider.value !== inputs.webManifest.devDependencies?.vitest
  )
    block('coverage-provider-mismatch', 'vitest', [provider.location]);

  const parser = inputs.rootManifest.devDependencies?.['typescript-parser'];
  const parserMatch =
    typeof parser === 'string' ? /^npm:typescript@(.+)$/u.exec(parser) : null;
  pin(
    'astParser',
    [
      {
        value: parserMatch?.[1],
        location: 'package.json#devDependencies/typescript-parser',
      },
    ],
    registry.tools.astParser,
  );
  const cruiser = inputs.rootManifest.devDependencies?.['dependency-cruiser'];
  const extensions = inputs.workspace.packageExtensions;
  const cruiserExtensions = object(extensions)
    ? Object.keys(extensions).filter((name) =>
        name.startsWith('dependency-cruiser'),
      )
    : [];
  if (
    !exactVersion(cruiser) ||
    cruiserExtensions.length !== 1 ||
    ![`dependency-cruiser@${cruiser}`, 'dependency-cruiser@*'].includes(
      cruiserExtensions[0],
    ) ||
    !exactVersion(parserMatch?.[1]) ||
    extensions?.[cruiserExtensions[0]]?.dependencies?.typescript !==
      parserMatch?.[1]
  )
    block('architecture-parser-extension-mismatch', 'astParser', [
      'pnpm-workspace.yaml#packageExtensions',
    ]);

  const manager = inputs.rootManifest.packageManager;
  const managerMatch =
    typeof manager === 'string' ? /^pnpm@(.+)$/u.exec(manager) : null;
  pin(
    'pnpm',
    [
      {
        value: managerMatch?.[1],
        location: 'package.json#packageManager',
      },
    ],
    registry.pnpm,
  );

  const runtime = inputs.rootManifest.engines?.node;
  const nodeMatch =
    typeof runtime === 'string' ? /^>=([1-9]\d?)\.0\.0$/u.exec(runtime) : null;
  const nodeMajor = nodeMatch ? Number(nodeMatch[1]) : null;
  if (!Number.isSafeInteger(nodeMajor) || nodeMajor < 1)
    block('non-exact-runtime-major', 'node', ['package.json#engines/node']);

  // Node declarations describe runtime APIs; future-major types would admit APIs
  // that the reviewed execution runtime cannot provide. Maintenance releases
  // within the coordinated runtime major remain ordinary dependency proposals.
  const nodeTypes = ['rootManifest', 'e2eManifest'].map((owner) =>
    declared(owner, '@types/node'),
  );
  const typeLocations = nodeTypes.map(({ location }) => location);
  if (!nodeTypes.every(({ value }) => exactVersion(value)))
    block('missing-or-non-exact-pin', 'nodeTypes', typeLocations);
  else if (new Set(nodeTypes.map(({ value }) => value)).size !== 1)
    block('inconsistent-shared-pin', 'nodeTypes', typeLocations);
  else if (Number(nodeTypes[0].value.split('.')[0]) !== nodeMajor)
    block('runtime-types-major-mismatch', 'nodeTypes', [
      ...typeLocations,
      'package.json#engines/node',
    ]);

  const actionCandidates = new Map();
  const repositories = new Map(
    Object.entries(registry.actions).map(([role, entry]) => [
      entry.repository,
      role,
    ]),
  );
  let workflowSteps = 0;
  for (const [input, expectedJobs] of [
    [
      'qualityWorkflow',
      ['check', 'browser', 'browser-quality', 'harness-windows', 'image'],
    ],
    ['guideWorkflow', ['build', 'deploy']],
  ]) {
    const workflow = inputs[input];
    const location = FILES[input];
    if (
      !object(workflow.jobs) ||
      Object.keys(workflow.jobs).sort().join(',') !==
        expectedJobs.sort().join(',')
    ) {
      block('unregistered-workflow-jobs', 'actions', [location]);
      continue;
    }
    for (const job of Object.values(workflow.jobs)) {
      if (!object(job) || !Array.isArray(job.steps) || job.steps.length > 64) {
        block('invalid-workflow-steps', 'actions', [location]);
        continue;
      }
      for (const step of job.steps) {
        workflowSteps++;
        if (!object(step)) {
          block('invalid-workflow-step', 'actions', [location]);
          continue;
        }
        if (step.uses === undefined) continue;
        const match =
          typeof step.uses === 'string'
            ? /^([a-z0-9-]+\/[a-z0-9-]+)@(v[1-9][0-9]*)$/u.exec(step.uses)
            : null;
        const role = match ? repositories.get(match[1]) : undefined;
        if (!role) {
          block('unregistered-or-mutable-action', 'actions', [location]);
          continue;
        }
        const candidate = actionCandidates.get(role) ?? {
          commits: new Set(),
          locations: new Set(),
        };
        candidate.commits.add(match[2]);
        candidate.locations.add(location);
        actionCandidates.set(role, candidate);
        if (
          role === 'node' &&
          String(step.with?.['node-version']) !== String(nodeMajor)
        )
          block('runtime-major-mismatch', 'node', [location]);
      }
    }
  }
  if (workflowSteps > 384)
    block('workflow-inventory-exceeds-bound', 'actions', [
      FILES.qualityWorkflow,
      FILES.guideWorkflow,
    ]);
  for (const [role, entry] of Object.entries(registry.actions)) {
    const candidate = actionCandidates.get(role);
    if (!candidate) {
      block('missing-action-role', role, [
        FILES.qualityWorkflow,
        FILES.guideWorkflow,
      ]);
      continue;
    }
    const locations = [...candidate.locations].sort();
    if (candidate.commits.size !== 1) {
      block('inconsistent-action-pin', role, locations);
      continue;
    }
    changed(
      `action:${role}`,
      `${entry.repository}@v${entry.version.split('.')[0]}`,
      `${entry.repository}@${[...candidate.commits][0]}`,
      locations,
    );
  }
  if (Number.isSafeInteger(nodeMajor) && nodeMajor > 0)
    changed('nodeMajor', registry.nodeMajor, nodeMajor, [
      'package.json#engines/node',
      FILES.qualityWorkflow,
      FILES.guideWorkflow,
    ]);
  return {
    status:
      issues.length > 0
        ? 'blocked'
        : changes.length > 0
          ? 'review-required'
          : 'current',
    changes,
    issues,
  };
}

/** Read only the registered plain files; parser failures never become a clean scan. */
export function reviewUpgrades(root) {
  try {
    const inputs = { registry: readReviewedDependencies(root) };
    for (const [name, relative] of Object.entries(FILES)) {
      const file = ownedFile(root, relative);
      if (statSync(file).size > 2 * 1024 * 1024)
        throw new Error('Dependency inventory input exceeds its size bound.');
      const source = readFileSync(file, 'utf8');
      if (relative.endsWith('.json')) inputs[name] = JSON.parse(source);
      else {
        const document = parseDocument(source, { uniqueKeys: true });
        if (document.errors.length > 0)
          throw new Error('Dependency inventory YAML is malformed.');
        inputs[name] = document.toJS({ maxAliasCount: 32 });
      }
    }
    return inspectUpgradeInventory(inputs);
  } catch {
    return {
      status: 'blocked',
      changes: [],
      issues: [
        issue(
          'unavailable-or-malformed-inventory',
          'inventory',
          Object.values(FILES),
        ),
      ],
    };
  }
}

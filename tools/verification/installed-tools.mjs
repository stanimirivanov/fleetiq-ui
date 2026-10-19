import { lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { ownedFile } from '../security/owned.mjs';
import { DECLARED } from './declared-dependencies.mjs';
import { validateReviewedDependencies } from './reviewed-dependencies.mjs';

const inventory = [
  ['compiler', 'package.json', 'typescript', 'typescript', 'compiler'],
  ['astParser', 'package.json', 'typescript-parser', 'typescript', 'astParser'],
  [
    'dependencyCruiser',
    'package.json',
    'dependency-cruiser',
    'dependency-cruiser',
    'dependencyCruiser',
  ],
  ['vite', 'package.json', 'vite', 'vite', 'vite'],
  [
    'axe',
    'package.json',
    '@axe-core/playwright',
    '@axe-core/playwright',
    'axe',
  ],
  ['archive', 'package.json', 'yauzl', 'yauzl', 'archive'],
  [
    'playwright',
    'package.json',
    '@playwright/test',
    '@playwright/test',
    'playwright',
  ],
  ['compiler', 'apps/web/package.json', 'typescript', 'typescript', 'compiler'],
  ['vite', 'apps/web/package.json', 'vite', 'vite', 'vite'],
  ['vitest', 'apps/web/package.json', 'vitest', 'vitest', 'vitest'],
  [
    'coverageProvider',
    'apps/web/package.json',
    '@vitest/coverage-v8',
    '@vitest/coverage-v8',
    'vitest',
  ],
  [
    'compiler',
    'apps/web-e2e/package.json',
    'typescript',
    'typescript',
    'compiler',
  ],
  [
    'playwright',
    'apps/web-e2e/package.json',
    '@playwright/test',
    '@playwright/test',
    'playwright',
  ],
];

function packageMetadata(root, owner, name) {
  const canonicalRoot = realpathSync(root);
  const origin = ownedFile(canonicalRoot, owner);
  const allowed = new Set();
  let directory = path.dirname(origin);
  while (true) {
    allowed.add(path.join(directory, 'node_modules'));
    if (directory === canonicalRoot) break;
    const parent = path.dirname(directory);
    if (parent === directory) throw new Error('Invalid package owner.');
    directory = parent;
  }
  return resolveMetadata(origin, allowed, name);
}

function resolveMetadata(origin, allowed, name) {
  const scopeKey = (directory) =>
    process.platform === 'win32'
      ? path.resolve(directory).toLowerCase()
      : path.resolve(directory);
  const scopes = new Set([...allowed].map(scopeKey));
  const candidates = createRequire(origin).resolve.paths(name) ?? [];
  for (const lookup of candidates) {
    if (!scopes.has(scopeKey(lookup))) continue;
    const dependency = path.join(lookup, name);
    try {
      // Package-manager links are intentional. A present but broken first
      // dependency fails qualification rather than falling back to another copy.
      lstatSync(dependency);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    const metadata = path.join(dependency, 'package.json');
    const status = statSync(metadata);
    if (!status.isFile() || status.size > 64 * 1024)
      throw new Error('Invalid installed package metadata.');
    const value = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(metadata)),
    );
    if (
      value === null ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      typeof value.name !== 'string' ||
      typeof value.version !== 'string'
    )
      throw new Error('Incomplete installed package metadata.');
    return {
      value,
      file: path.join(realpathSync(dependency), 'package.json'),
    };
  }
  throw new Error('Installed package is unavailable in its owner scope.');
}

function architectureParser(root, pins) {
  const cruiser = packageMetadata(root, 'package.json', 'dependency-cruiser');
  if (
    cruiser.value.name !== 'dependency-cruiser' ||
    cruiser.value.version !== pins.tools.dependencyCruiser
  )
    throw new Error('Architecture package did not qualify.');

  const allowed = new Set([
    path.join(path.dirname(cruiser.file), 'node_modules'),
    path.join(realpathSync(root), 'node_modules'),
  ]);
  // pnpm installs package peers beside the resolved package in its private
  // node_modules container. Qualify that dependency edge, not a global parser
  // that happens to share the alias version declared at the repository root.
  let parent = path.dirname(cruiser.file);
  const isContainer = (directory) =>
    process.platform === 'win32'
      ? path.basename(directory).toLowerCase() === 'node_modules'
      : path.basename(directory) === 'node_modules';
  while (!isContainer(parent)) {
    const next = path.dirname(parent);
    if (next === parent) break;
    parent = next;
  }
  if (isContainer(parent)) allowed.add(parent);
  return resolveMetadata(cruiser.file, allowed, 'typescript');
}

/**
 * Inspect exact installed critical versions without importing candidate code.
 * Node's lookup order is restricted to repository-owned ancestor node_modules;
 * NODE_PATH/global packages cannot qualify. Reading package metadata directly
 * also handles export maps that deliberately hide the package.json subpath.
 * This detects stale installations; it does not attest package authenticity.
 */
export function inspectInstalledTools(root, reviewed = DECLARED) {
  const pins = validateReviewedDependencies(reviewed);
  const diagnostics = [];
  for (const [role, location, dependency, identity, version] of inventory) {
    try {
      const installed = packageMetadata(root, location, dependency);
      if (
        installed.value.name !== identity ||
        installed.value.version !== pins.tools[version]
      )
        diagnostics.push({
          role,
          location,
          code: 'installed-pin-mismatch',
        });
    } catch {
      // Metadata may be private or malformed. Evidence contains fixed inventory
      // labels only, never paths, package fields or raw resolver errors.
      diagnostics.push({
        role,
        location,
        code: 'installed-tool-unavailable',
      });
    }
  }
  if (
    !diagnostics.some(
      (entry) =>
        entry.role === 'dependencyCruiser' && entry.location === 'package.json',
    )
  ) {
    const parserLocation = {
      role: 'astParser',
      location: 'dependency-cruiser/package.json',
    };
    try {
      const installed = architectureParser(root, pins);
      if (
        installed.value.name !== 'typescript' ||
        installed.value.version !== pins.tools.astParser
      )
        diagnostics.push({ ...parserLocation, code: 'installed-pin-mismatch' });
    } catch {
      diagnostics.push({
        ...parserLocation,
        code: 'installed-tool-unavailable',
      });
    }
  }
  return diagnostics;
}

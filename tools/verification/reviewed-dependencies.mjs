import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ownedFile } from '../security/owned.mjs';

export const REVIEWED_PATH = 'tools/verification/reviewed-dependencies.json';
const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const toolNames = [
  'compiler',
  'astParser',
  'dependencyCruiser',
  'vite',
  'axe',
  'archive',
  'vitest',
  'playwright',
];
const actionRepositories = {
  checkout: 'actions/checkout',
  node: 'actions/setup-node',
  upload: 'actions/upload-artifact',
  pages: 'actions/configure-pages',
  uploadPages: 'actions/upload-pages-artifact',
  deployPages: 'actions/deploy-pages',
};
const exactKeys = (value, keys) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).sort().join(',') === keys.slice().sort().join(',');
const exactVersion = (value) =>
  typeof value === 'string' &&
  value.length <= 64 &&
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u.test(value);

function immutable(value) {
  for (const child of Object.values(value))
    if (child !== null && typeof child === 'object') immutable(child);
  return Object.freeze(value);
}

/**
 * Validate registry structure, never approve a proposed upgrade. Owner review
 * establishes trust; all consumers compare candidates with this exact inventory.
 * Compiler and parser are independent review decisions.
 */
export function validateReviewedDependencies(value) {
  if (
    !exactKeys(value, [
      'schemaVersion',
      'nodeMajor',
      'pnpm',
      'tools',
      'actions',
    ]) ||
    value.schemaVersion !== 1 ||
    !Number.isSafeInteger(value.nodeMajor) ||
    value.nodeMajor < 1 ||
    value.nodeMajor > 99 ||
    !exactVersion(value.pnpm) ||
    !exactKeys(value.tools, toolNames) ||
    !toolNames.every((name) => exactVersion(value.tools[name])) ||
    !exactKeys(value.actions, Object.keys(actionRepositories))
  )
    throw new Error('Reviewed dependency registry is missing or malformed.');

  for (const [role, repository] of Object.entries(actionRepositories)) {
    const action = value.actions[role];
    if (
      !exactKeys(action, ['repository', 'version', 'commit']) ||
      action.repository !== repository ||
      !exactVersion(action.version) ||
      typeof action.commit !== 'string' ||
      !/^[a-f0-9]{40}$/u.test(action.commit)
    )
      throw new Error(`Reviewed action identity is invalid: ${role}.`);
  }
  return immutable(structuredClone(value));
}

/** Read a bounded regular registry file; links/junctions cannot redirect trust. */
export function readReviewedDependencies(root = repositoryRoot) {
  const file = ownedFile(root, REVIEWED_PATH);
  if (statSync(file).size > 64 * 1024)
    throw new Error('Reviewed dependency registry exceeds its size bound.');
  let value;
  try {
    value = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    throw new Error('Reviewed dependency registry is not valid JSON.');
  }
  return validateReviewedDependencies(value);
}

export const REVIEWED = readReviewedDependencies(path.resolve(repositoryRoot));

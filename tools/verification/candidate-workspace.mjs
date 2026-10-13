import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { discoverSources } from '../docs/source.mjs';
import {
  ownedFile,
  plainAncestors,
  plainFiles,
  relativePath,
  temporary,
} from '../security/owned.mjs';
import { git } from '../security/process.mjs';
import {
  REVIEWED_PATH,
  readReviewedDependencies,
  validateReviewedDependencies,
} from './reviewed-dependencies.mjs';
import { sourceState, unchangedSource } from './source-state.mjs';
import { reviewUpgrades } from './upgrades.mjs';

const MAX_FILES = 8192;
const MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_TOTAL_BYTES = 256 * 1024 * 1024;
const TOOLS = new Set([
  'compiler',
  'astParser',
  'dependencyCruiser',
  'vite',
  'axe',
  'archive',
  'vitest',
  'playwright',
]);
const failure = () =>
  new Error(
    'Candidate workspace could not be isolated; no qualification result.',
  );
const runGit = (root, args, options = {}) =>
  git(root, ['-c', 'core.hooksPath=/dev/null', ...args], options);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

function checkoutIdentity(root) {
  for (const relative of discoverSources(root)) ownedFile(root, relative);
  const source = sourceState(root);
  const index = runGit(root, ['ls-files', '--stage', '-z']);
  const flags = runGit(root, ['ls-files', '-v', '-z']);
  const refs = runGit(root, [
    'for-each-ref',
    '--format=%(refname) %(objectname)',
  ]);
  const config = runGit(root, ['config', '--local', '--null', '--list']);
  return { source, index, flags, refs, configHash: hash(config) };
}

function unchangedCheckout(before, after) {
  return (
    unchangedSource(before.source, after.source) &&
    before.index === after.index &&
    before.flags === after.flags &&
    before.refs === after.refs &&
    before.configHash === after.configHash
  );
}

/** Index extensions and unresolved entries cannot silently change the copied state. */
function indexEntries(root, identity) {
  const entries = identity.index.split('\0').filter(Boolean);
  const names = [];
  for (const entry of entries) {
    const match = /^(100644|100755) ([a-f0-9]{40,64}) 0\t(.+)$/su.exec(entry);
    if (!match) throw failure();
    names.push(relativePath(match[3]));
  }
  const flags = identity.flags.split('\0').filter(Boolean);
  if (
    flags.length !== entries.length ||
    !flags.every((entry, index) => entry === `H ${names[index]}`)
  )
    throw failure();
  const debug = runGit(root, ['ls-files', '--debug', '-z']);
  const extendedFlags = [
    ...debug.matchAll(/^\s+size: \d+\tflags: ([a-f0-9]+)\r?$/gmu),
  ];
  if (
    extendedFlags.length !== entries.length ||
    // CE_UPDATE_IN_BASE is split-index bookkeeping; intent-to-add and
    // all visibility-changing flags still require rejection.
    extendedFlags.some((match) => !['0', '8000000'].includes(match[1]))
  )
    throw failure();
  return names;
}

function inspectCheckout(root) {
  plainAncestors(root);
  if (!lstatSync(root).isDirectory()) throw failure();
  const gitDirectory = path.join(root, '.git');
  if (
    !lstatSync(gitDirectory).isDirectory() ||
    lstatSync(gitDirectory).isSymbolicLink() ||
    realpathSync(gitDirectory) !== path.resolve(gitDirectory)
  )
    throw failure();
  // Every Git object must be local. Borrowed, shallow and promisor history cannot
  // establish the incoming/trusted-base history used by secret scanning.
  if (plainFiles(gitDirectory).some((name) => name.endsWith('.promisor')))
    throw failure();
  if (
    runGit(root, ['rev-parse', '--show-toplevel'])
      .trim()
      .replaceAll('\\', '/') !== realpathSync(root).replaceAll('\\', '/') ||
    runGit(root, ['rev-parse', '--is-shallow-repository']).trim() !== 'false' ||
    runGit(root, ['rev-parse', '--is-bare-repository']).trim() !== 'false' ||
    existsSync(path.join(gitDirectory, 'objects/info/alternates'))
  )
    throw failure();
  const sparse = runGit(
    root,
    ['config', '--bool', '--get', 'core.sparseCheckout'],
    {
      accepted: [0, 1],
    },
  ).trim();
  const excludes = runGit(root, ['config', '--get', 'core.excludesFile'], {
    accepted: [0, 1],
  }).trim();
  const partial = runGit(root, ['config', '--get', 'extensions.partialClone'], {
    accepted: [0, 1],
  }).trim();
  const promisor = runGit(
    root,
    ['config', '--get-regexp', '^remote\\..*\\.promisor$'],
    {
      accepted: [0, 1],
    },
  ).trim();
  if (sparse === 'true' || excludes || partial || promisor) throw failure();
}

/**
 * Isolate an npm-tool proposal without changing its reviewed source registry.
 *
 * The workspace owns its complete Git objects, refs and reconstructed stage-zero
 * index. Raw working files preserve staged-only, dirty and newly authored source
 * states; checkout filters and ambient Git configuration never rewrite bytes.
 * Only the isolated registry receives coordinated, exact npm-tool candidates.
 * The returned workspace is qualification material, never approval evidence.
 */
export function prepareCandidateWorkspace(root) {
  let owned;
  try {
    root = path.resolve(root);
    plainAncestors(root);
    root = realpathSync(root);
    inspectCheckout(root);
    const inventory = reviewUpgrades(root);
    if (
      inventory.status !== 'review-required' ||
      inventory.issues.length !== 0 ||
      inventory.changes.length === 0 ||
      inventory.changes.some(({ role }) => !TOOLS.has(role))
    )
      throw failure();
    const reviewed = readReviewedDependencies(root);
    const proposal = structuredClone(reviewed);
    for (const { role, reviewed: prior, proposed } of inventory.changes) {
      if (prior !== reviewed.tools[role]) throw failure();
      proposal.tools[role] = proposed;
    }
    const effectiveRegistry = validateReviewedDependencies(proposal);
    const files = discoverSources(root);
    if (files.length > MAX_FILES) throw failure();
    let sourceBytes = 0;
    for (const relative of files) {
      const size = lstatSync(ownedFile(root, relative)).size;
      sourceBytes += size;
      if (size > MAX_FILE_BYTES || sourceBytes > MAX_TOTAL_BYTES)
        throw failure();
    }
    const before = checkoutIdentity(root);
    indexEntries(root, before);
    if (before.source.files !== files.length) throw failure();
    owned = temporary('fleetiq-candidate-');
    plainAncestors(owned.root);
    const ownership = lstatSync(owned.root);
    const ownerPath = realpathSync(owned.root);
    const directory = path.join(owned.root, 'workspace');
    mkdirSync(directory);
    runGit(root, [
      'clone',
      '--mirror',
      '--local',
      '--no-hardlinks',
      '--quiet',
      '--',
      root,
      path.join(directory, '.git'),
    ]);
    runGit(directory, ['config', 'core.bare', 'false']);
    runGit(directory, ['config', 'core.hooksPath', '/dev/null']);
    runGit(directory, ['config', '--remove-section', 'remote.origin']);
    for (const key of ['core.filemode', 'core.ignorecase', 'core.autocrlf']) {
      const value = runGit(root, ['config', '--get', key], {
        accepted: [0, 1],
      }).trim();
      if (value) runGit(directory, ['config', key, value]);
    }
    runGit(directory, [
      'update-ref',
      '--no-deref',
      'HEAD',
      before.source.revision,
    ]);
    runGit(directory, ['read-tree', '--empty']);
    runGit(directory, ['update-index', '-z', '--index-info'], {
      input: before.index,
    });
    const exclude = path.join(root, '.git/info/exclude');
    if (existsSync(exclude)) {
      const sourceExclude = ownedFile(root, '.git/info/exclude');
      mkdirSync(path.join(directory, '.git/info'), { recursive: true });
      writeFileSync(
        path.join(directory, '.git/info/exclude'),
        readFileSync(sourceExclude),
      );
    }
    let copiedBytes = 0;
    for (const relative of files) {
      const source = ownedFile(root, relative);
      const size = lstatSync(source).size;
      copiedBytes += size;
      if (size > MAX_FILE_BYTES || copiedBytes > MAX_TOTAL_BYTES)
        throw failure();
      const target = path.join(directory, relative);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(source), { flag: 'wx' });
      chmodSync(target, lstatSync(source).mode & 0o777);
    }
    const copied = checkoutIdentity(directory);
    if (
      !unchangedSource(before.source, copied.source) ||
      copied.index !== before.index ||
      copied.flags !== before.flags ||
      copied.refs !== before.refs ||
      !unchangedCheckout(before, checkoutIdentity(root)) ||
      JSON.stringify(reviewUpgrades(root)) !== JSON.stringify(inventory)
    )
      throw failure();
    writeFileSync(
      ownedFile(directory, REVIEWED_PATH),
      `${JSON.stringify(effectiveRegistry, null, 2)}\n`,
    );
    if (reviewUpgrades(directory).status !== 'current') throw failure();
    const expectedCandidate = checkoutIdentity(directory);
    let disposed = false;
    return {
      directory,
      source: before.source,
      expectedCandidateSource: { ...expectedCandidate.source },
      effectiveRegistry,
      changes: structuredClone(inventory.changes),
      /** Keep every command bound to the isolated sources prepared above. */
      assertCandidateStable() {
        try {
          if (
            !unchangedCheckout(expectedCandidate, checkoutIdentity(directory))
          )
            throw failure();
        } catch {
          throw new Error(
            'Isolated candidate source changed; no qualification result.',
          );
        }
      },
      /** Reject source, staged-only, ref or repository-policy drift during qualification. */
      assertSourceStable() {
        try {
          if (!unchangedCheckout(before, checkoutIdentity(root)))
            throw failure();
        } catch {
          throw new Error(
            'Original candidate source changed; no qualification result.',
          );
        }
      },
      /** Delete only the exact owned temporary parent, never an input checkout. */
      cleanup() {
        if (disposed) return;
        try {
          const metadata = lstatSync(owned.root);
          plainAncestors(owned.root);
          if (
            !metadata.isDirectory() ||
            metadata.isSymbolicLink() ||
            realpathSync(owned.root) !== ownerPath ||
            metadata.dev !== ownership.dev ||
            metadata.ino !== ownership.ino
          )
            throw failure();
          owned.dispose();
          disposed = true;
        } catch {
          throw new Error(
            'Candidate workspace ownership changed; cleanup refused.',
          );
        }
      },
    };
  } catch {
    if (owned) owned.dispose();
    throw failure();
  }
}

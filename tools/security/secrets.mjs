import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverSources } from '../docs/source.mjs';
import { runEntrypoint } from '../sensors/entrypoint.mjs';
import { detectorScan } from './detector.mjs';
import { qualifyDetector } from './install.mjs';
import {
  makeParent,
  ownedFile,
  plainFiles,
  relativePath,
  temporary,
} from './owned.mjs';
import { policies, scanScope } from './policy.mjs';
import { git } from './process.mjs';

function forbidIgnore(name) {
  if (path.posix.basename(name).toLowerCase() === '.gitleaksignore')
    throw new Error('Fingerprint secret ignores are forbidden.');
}
export function copyCandidates(root, destination) {
  const files = discoverSources(root);
  for (const name of files) {
    forbidIgnore(name);
    const source = ownedFile(root, name);
    const target = path.join(destination, name);
    makeParent(target);
    writeFileSync(target, readFileSync(source));
  }
  return files.length;
}
/** Batch raw blob bytes; bypass filters without one subprocess per staged file. */
export function copyIndex(root, destination) {
  const inventory = git(root, ['ls-files', '--stage', '-z'])
    .split('\0')
    .filter(Boolean);
  const entries = inventory.map((entry) => {
    const match = /^(\d{6}) ([a-f0-9]{40,64}) (\d)\t([^\0]+)$/u.exec(entry);
    if (!match || !['100644', '100755'].includes(match[1]) || match[3] !== '0')
      throw new Error('Secret scan requires regular resolved index blobs.');
    const name = relativePath(match[4]);
    forbidIgnore(name);
    return { hash: match[2], name };
  });
  if (!entries.length) return 0;
  const bytes = git(root, ['cat-file', '--batch'], {
    input: `${entries.map((entry) => entry.hash).join('\n')}\n`,
    encoding: null,
    maxBuffer: 64 * 1024 * 1024,
  });
  let offset = 0;
  for (const entry of entries) {
    const newline = bytes.indexOf(10, offset);
    if (newline < 0) throw new Error('Git index batch report is incomplete.');
    const header = bytes.subarray(offset, newline).toString('ascii');
    const match = /^([a-f0-9]{40,64}) blob (\d+)$/u.exec(header);
    if (!match || match[1] !== entry.hash)
      throw new Error('Git index batch report contradicts its inventory.');
    const size = Number(match[2]);
    const start = newline + 1;
    const end = start + size;
    if (!Number.isSafeInteger(size) || end >= bytes.length || bytes[end] !== 10)
      throw new Error('Git index batch content is incomplete.');
    const target = path.join(destination, entry.name);
    makeParent(target);
    writeFileSync(target, bytes.subarray(start, end));
    offset = end + 1;
  }
  if (offset !== bytes.length)
    throw new Error('Git index batch report has unexpected content.');
  return entries.length;
}
/** Source, raw staged blobs and isolated incoming/full history use default rules. */
export function checkSecrets(
  root,
  { detector, environment = process.env, event } = {},
) {
  if (existsSync(path.join(root, '.gitleaksignore')))
    throw new Error(
      'Fingerprint secret ignores are forbidden, including ignored files.',
    );
  const scope = scanScope(root, { environment, event });
  const selectedPolicies = policies(root, scope);
  const exceptions = selectedPolicies[0].secretExceptions.filter((exception) =>
    selectedPolicies.every((policy) =>
      policy.secretExceptions.some(
        (item) =>
          item.rule === exception.rule &&
          item.path === exception.path &&
          item.value === exception.value,
      ),
    ),
  );
  const tool = detector ?? qualifyDetector(root);
  const selected = temporary();
  try {
    const files = path.join(selected.root, 'files');
    const index = path.join(selected.root, 'index');
    mkdirSync(files);
    mkdirSync(index);
    const fileCount = copyCandidates(root, files);
    const indexCount = copyIndex(root, index);
    detectorScan(tool, files, { exceptions });
    detectorScan(tool, index, { exceptions });
    const history = path.join(selected.root, 'history.git');
    git(root, [
      'clone',
      '--bare',
      '--local',
      '--no-hardlinks',
      '--quiet',
      '--',
      path.resolve(root),
      history,
    ]);
    detectorScan(tool, history, { history: scope.range, exceptions });
    return {
      files: fileCount,
      staged: indexCount,
      history: true,
      version: tool.version,
    };
  } finally {
    selected.dispose();
    if (!detector) tool.dispose();
  }
}
/** Scan text/archive content; this does not qualify screenshot or video pixels. */
export function scanDirectory(directory, { detector, policyRoot } = {}) {
  const files = plainFiles(directory);
  for (const name of files) forbidIgnore(name);
  const tool = detector ?? qualifyDetector(policyRoot);
  try {
    detectorScan(tool, directory);
    return { files: files.length, version: tool.version };
  } finally {
    if (!detector) tool.dispose();
  }
}
await runEntrypoint(import.meta.url, () => {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..',
  );
  const report = checkSecrets(root);
  console.log(
    `Secret scan passed: ${report.files} source files, ${report.staged} staged files, qualified history; Gitleaks ${report.version}.`,
  );
});

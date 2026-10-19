import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, lstatSync, readdirSync } from 'node:fs';
import { lstat, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import yauzl from 'yauzl';
import { runEntrypoint } from '../sensors/entrypoint.mjs';
import { ownedFile, plainFiles, relativePath, temporary } from './owned.mjs';
import { scanDirectory } from './secrets.mjs';

const LIMITS = {
  files: 2000,
  fileBytes: 64 * 1024 * 1024,
  expandedBytes: 256 * 1024 * 1024,
  archiveDepth: 4,
};
const extensions = new Set([
  '.md',
  '.json',
  '.html',
  '.css',
  '.png',
  '.webm',
  '.zip',
  '.txt',
  '.log',
  '.js',
  '.map',
  '.svg',
  '.jpeg',
  '.jpg',
  '.webp',
  '.woff2',
  '.woff',
  '.ttf',
  '.otf',
  '.ico',
  '.mp4',
  '.har',
  '.webmanifest',
]);
function zipOpen(file) {
  return new Promise((resolve, reject) => {
    yauzl.open(
      file,
      { lazyEntries: true, validateEntrySizes: true, strictFileNames: true },
      (error, zip) => {
        if (error) reject(new Error('Artifact ZIP metadata is malformed.'));
        else resolve(zip);
      },
    );
  });
}
function zipStream(zip, entry) {
  return new Promise((resolve, reject) => {
    zip.openReadStream(entry, (error, stream) => {
      if (error) reject(new Error('Artifact ZIP content cannot be verified.'));
      else resolve(stream);
    });
  });
}
/** Validate and stream every ZIP entry; nested archives cannot escape or exceed bounds. */
async function extractArchive(file, destination, state, depth = 1) {
  if (depth > LIMITS.archiveDepth)
    throw new Error('Artifact archive depth exceeds its reviewed bound.');
  const zip = await zipOpen(file);
  const names = new Set();
  try {
    for await (const entry of entries(zip)) {
      const name = entry.fileName.endsWith('/')
        ? entry.fileName.slice(0, -1)
        : entry.fileName;
      relativePath(name);
      if (
        name.includes(':') ||
        [...name].some((character) => character.codePointAt(0) < 32) ||
        names.has(name)
      )
        throw new Error('Artifact ZIP has ambiguous or unsafe entry names.');
      names.add(name);
      const unixType = (entry.externalFileAttributes >>> 16) & 0o170000;
      if (
        unixType === 0o120000 ||
        (unixType && ![0o100000, 0o040000].includes(unixType))
      )
        throw new Error('Artifact ZIP links or special entries are forbidden.');
      if ((entry.generalPurposeBitFlag & 1) !== 0)
        throw new Error('Encrypted artifact ZIP cannot be inspected.');
      if (entry.fileName.endsWith('/')) continue;
      state.files += 1;
      state.bytes += entry.uncompressedSize;
      if (
        state.files > LIMITS.files ||
        entry.uncompressedSize > LIMITS.fileBytes ||
        state.bytes > LIMITS.expandedBytes
      )
        throw new Error('Artifact expansion exceeds its reviewed bounds.');
      const nested = path.extname(name).toLowerCase() === '.zip';
      const target = path.join(
        destination,
        `entry-${state.files}${nested ? '.zip' : '.content'}`,
      );
      const stream = await zipStream(zip, entry);
      let streamed = 0;
      stream.on('data', (bytes) => {
        streamed += bytes.length;
        if (streamed > entry.uncompressedSize || streamed > LIMITS.fileBytes)
          stream.destroy(
            new Error('Artifact expansion exceeds its declared bound.'),
          );
      });
      await pipeline(
        stream,
        createWriteStream(target, { flags: 'wx', mode: 0o600 }),
      );
      if ((await stat(target)).size !== entry.uncompressedSize)
        throw new Error(
          'Artifact ZIP content disagrees with its declared size.',
        );
      if (nested) await extractArchive(target, destination, state, depth + 1);
    }
  } finally {
    zip.close();
  }
}
async function* entries(zip) {
  while (true) {
    const next = await new Promise((resolve, reject) => {
      const complete = (value) => {
        zip.off('entry', onEntry);
        zip.off('end', onEnd);
        zip.off('error', onError);
        resolve(value);
      };
      const onEntry = (entry) => complete(entry);
      const onEnd = () => complete(null);
      const onError = () => {
        zip.off('entry', onEntry);
        zip.off('end', onEnd);
        reject(new Error('Artifact ZIP traversal failed.'));
      };
      zip.once('entry', onEntry);
      zip.once('end', onEnd);
      zip.once('error', onError);
      zip.readEntry();
    });
    if (next === null) break;
    yield next;
  }
}
/**
 * Inspect only owned output and its textual/archive content before release.
 * Pixel contents and visual recording safety remain capture-policy review.
 */
export async function inspectArtifact(
  root,
  { policyRoot, detector, scan = scanDirectory } = {},
) {
  const files = plainFiles(root);
  if (!files.length || files.length > LIMITS.files)
    throw new Error(
      'Artifact root is empty or exceeds the reviewed inventory bound.',
    );
  const selected = temporary('fleetiq-artifact-');
  const state = { files: 0, bytes: 0 };
  const digest = createHash('sha256');
  try {
    for (const [index, name] of files.entries()) {
      if (!extensions.has(path.extname(name).toLowerCase()))
        throw new Error('Artifact extension has no reviewed capture policy.');
      const source = ownedFile(root, name);
      const metadata = await lstat(source);
      if (!metadata.size || metadata.size > LIMITS.fileBytes)
        throw new Error('Artifact contains empty or oversized content.');
      state.files += 1;
      state.bytes += metadata.size;
      if (state.bytes > LIMITS.expandedBytes)
        throw new Error('Artifact content exceeds the reviewed size bound.');
      const bytes = await readFile(source);
      if (path.extname(name).toLowerCase() === '.webmanifest') {
        // Playwright's trace viewer includes a standard JSON web manifest.
        // Validate its format, then scan the original bytes like every artifact.
        let manifest;
        try {
          manifest = JSON.parse(
            new TextDecoder('utf-8', { fatal: true }).decode(bytes),
          );
        } catch {
          throw new Error('Artifact web manifest must be a UTF-8 JSON object.');
        }
        if (
          !manifest ||
          typeof manifest !== 'object' ||
          Array.isArray(manifest)
        )
          throw new Error('Artifact web manifest must be a UTF-8 JSON object.');
      }
      digest.update(name).update('\0').update(bytes).update('\0');
      if (path.extname(name).toLowerCase() === '.zip')
        await extractArchive(source, selected.root, state);
      else {
        // Keep original bytes; the detector handles decoded textual payloads.
        await writeFile(
          path.join(selected.root, `file-${index}.content`),
          bytes,
          { flag: 'wx', mode: 0o600 },
        );
      }
    }
    await scan(selected.root, { policyRoot, detector });
    const after = createHash('sha256');
    const finalFiles = plainFiles(root);
    if (finalFiles.join('\0') !== files.join('\0'))
      throw new Error('Artifact inventory changed during release inspection.');
    for (const name of finalFiles)
      after
        .update(name)
        .update('\0')
        .update(await readFile(ownedFile(root, name)))
        .update('\0');
    const sha256 = digest.digest('hex');
    if (after.digest('hex') !== sha256)
      throw new Error('Artifact bytes changed during release inspection.');

    return { passed: true, files: files.length, sha256 };
  } catch (error) {
    const detail = error instanceof Error ? error.message : '';
    const category = detail.startsWith('Secret scan rejected')
      ? 'secret-findings'
      : detail.includes('extension')
        ? 'unregistered-format'
        : detail.includes('empty')
          ? 'empty-content'
          : detail.includes('changed')
            ? 'source-changed'
            : detail.includes('archive') || detail.includes('ZIP')
              ? 'archive-unqualified'
              : detail.includes('link') ||
                  detail.includes('owned') ||
                  detail.includes('path')
                ? 'ownership'
                : 'prerequisite';
    throw new Error(
      `Artifact release inspection failed (${category}); retain no unqualified upload. Inspect privately; scanner does not certify pixels.`,
    );
  } finally {
    selected.dispose();
  }
}
export async function inspectRetention(
  policyRoot,
  { detector, inspect = inspectArtifact } = {},
) {
  const selected = temporary('fleetiq-retention-');
  const results = [];
  try {
    const evidence = path.join(policyRoot, '.verification');
    if (existsSync(evidence)) {
      // Retain exactly the top-level metadata JSON glob; tool archives are not
      // uploaded and cannot silently widen the release scan.
      if (lstatSync(evidence).isSymbolicLink())
        throw new Error('Verification evidence root is linked.');
      const names = readdirSync(evidence).filter((name) =>
        name.endsWith('.json'),
      );
      if (names.length) {
        for (const name of names) {
          const original = ownedFile(policyRoot, `.verification/${name}`);
          await writeFile(
            path.join(selected.root, name),
            await readFile(original),
          );
        }
        results.push(await inspect(selected.root, { policyRoot, detector }));
      }
    }
    for (const relative of [
      'test-results',
      'playwright-report',
      'dist/user-guide',
      'dist/image-reports',
    ]) {
      const root = path.join(policyRoot, relative);
      if (existsSync(root))
        results.push(await inspect(root, { policyRoot, detector }));
    }
    return {
      passed: true,
      roots: results.length,
      nothingToUpload: results.length === 0,
    };
  } finally {
    selected.dispose();
  }
}
await runEntrypoint(import.meta.url, async () => {
  const policyRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..',
  );
  const args = process.argv.slice(2);
  if (args.length === 0) {
    const report = await inspectRetention(policyRoot);
    console.log(
      report.nothingToUpload
        ? 'No registered retention outputs exist; nothing to upload.'
        : `Artifact retention inspection passed: ${report.roots} registered roots.`,
    );
    return;
  }
  if (
    args.length !== 2 ||
    args[0] !== '--path' ||
    ![
      'dist/user-guide',
      'dist/image-reports',
      'playwright-report',
      'test-results',
    ].includes(args[1])
  )
    throw new Error('Artifact scan requires one registered --path output.');
  const root = path.join(policyRoot, args[1]);
  const report = await inspectArtifact(root, { policyRoot });
  console.log(
    `Artifact release inspection passed: ${report.files} files; content SHA256 ${report.sha256}.`,
  );
});

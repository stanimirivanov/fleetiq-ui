import { createHash } from 'node:crypto';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { runEntrypoint } from '../sensors/entrypoint.mjs';
import { makeOwnedDirectory, ownedFile, temporary } from './owned.mjs';
import { GITLEAKS_VERSION, releaseFor } from './pins.mjs';
import { command } from './process.mjs';

export function verifyArchive(bytes, digest) {
  if (createHash('sha256').update(bytes).digest('hex') !== digest)
    throw new Error(
      'Gitleaks archive checksum mismatch; installation refused.',
    );
}
/** Retry transient download failures at most twice; integrity failures remain fatal.
 * Retain a checksum-verifiable archive, never trust a mutable binary receipt.
 */
export async function installDetector(root, fetcher = fetch, wait = delay) {
  const release = releaseFor();
  const directory = makeOwnedDirectory(root, '.verification/tools/gitleaks');
  const destination = path.join(directory, release.name);
  if (existsSync(destination)) {
    const cached = ownedFile(
      root,
      `.verification/tools/gitleaks/${release.name}`,
    );
    verifyArchive(readFileSync(cached), release.digest);
    return { version: GITLEAKS_VERSION };
  }
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await fetcher(
        `https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/${release.name}`,
        { signal: AbortSignal.timeout(120_000), redirect: 'follow' },
      );
    } catch {
      if (attempt === 2)
        throw new Error(
          'Official Gitleaks archive download failed; no scan performed.',
        );
    }
    const transient =
      !response || [408, 429, 500, 502, 503, 504].includes(response.status);
    if (!transient || attempt === 2) break;
    await response?.body?.cancel();
    response = undefined;
    await wait(250 * (attempt + 1));
  }
  if (!response.ok)
    throw new Error(
      'Official Gitleaks archive download failed; no scan performed.',
    );
  const chunks = [];
  let length = 0;
  if (!response.body)
    throw new Error('Gitleaks download has no bounded readable body.');
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > 32 * 1024 * 1024)
      throw new Error('Gitleaks archive exceeds the reviewed download bound.');
    chunks.push(Buffer.from(chunk));
  }
  const bytes = Buffer.concat(chunks, length);
  verifyArchive(bytes, release.digest);
  makeOwnedDirectory(root, '.verification/tools/gitleaks');
  // Exclusive create cannot follow a substituted final link or overwrite a file.
  writeFileSync(destination, bytes, { flag: 'wx', mode: 0o600 });
  return { version: GITLEAKS_VERSION };
}
/** Verify and extract the pinned archive afresh into private owned execution. */
export function qualifyDetector(root) {
  const release = releaseFor();
  let archive;
  try {
    archive = ownedFile(root, `.verification/tools/gitleaks/${release.name}`);
    verifyArchive(readFileSync(archive), release.digest);
  } catch {
    throw new Error(
      'Checksum-qualified Gitleaks archive unavailable; run pnpm security:install.',
    );
  }
  const temporaryRoot = temporary('fleetiq-gitleaks-');
  try {
    const names = command('tar', ['-tf', archive], { cwd: temporaryRoot.root })
      .stdout.trim()
      .split(/\r?\n/u);
    if (
      !names.length ||
      names.some(
        (name) => !/^(?:LICENSE|README\.md|gitleaks(?:\.exe)?)$/u.test(name),
      )
    )
      throw new Error('Gitleaks archive has unexpected extraction entries.');
    command('tar', ['-xf', archive, '-C', temporaryRoot.root], {
      cwd: temporaryRoot.root,
    });
    const executable = ownedFile(temporaryRoot.root, 'gitleaks');
    chmodSync(executable, 0o755);
    const version = command(executable, ['version'], {
      cwd: temporaryRoot.root,
    }).stdout.trim();
    if (version !== GITLEAKS_VERSION)
      throw new Error(
        'Pinned Gitleaks version differs from its qualified archive.',
      );
    return { executable, version, dispose: temporaryRoot.dispose };
  } catch (error) {
    temporaryRoot.dispose();
    throw error;
  }
}
await runEntrypoint(import.meta.url, async () => {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..',
  );
  await installDetector(root);
  console.log(
    `Installed checksum-qualified Gitleaks ${GITLEAKS_VERSION} archive.`,
  );
});

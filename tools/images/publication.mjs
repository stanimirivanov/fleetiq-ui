/** Publish qualified bytes; registry credentials are never supplied to the build. */
import {
  appendFileSync,
  lstatSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';
import {
  makeOwnedDirectory,
  ownedFile,
  plainAncestors,
} from '../security/owned.mjs';
import {
  qualifiedReport,
  requireQualification,
} from '../user-guide/qualification.mjs';
import { authorize } from './authorization.mjs';
import { validateBundleEvidence } from './bundle.mjs';
import { inspectLayout } from './oci.mjs';
import {
  ensure,
  hash,
  IMAGE,
  readJson,
  validateQualification,
  validateScan,
} from './policy.mjs';
import { cancellation } from './process.mjs';
import { retainReports } from './qualify.mjs';
import { Resources } from './resources.mjs';
import { sourceIdentity } from './source.mjs';
import { transport } from './transport.mjs';
export function validateEvidence(directory, source, now = Date.now()) {
  const reports = join(directory, 'reports');
  const record = readJson(join(reports, 'qualification.json'));
  validateQualification(record, source.revision);
  ensure(
    !source.dirty && JSON.stringify(record.source) === JSON.stringify(source),
    'Only the identical clean qualified source can publish.',
  );
  const artifact = inspectLayout(join(directory, 'layout'), source.revision);
  ensure(
    record.image.digest === artifact.digest &&
      record.image.config === artifact.config &&
      record.image.manifest === artifact.manifest,
    'Qualification names another OCI artifact.',
  );
  for (const [name, expected] of [
    ['bundle', record.bundle.digest],
    ['scan', record.scan.digest],
    ['sbom', record.sbom.digest],
    ['provenance', record.provenance.digest],
  ])
    ensure(
      `sha256:${hash(readFileSync(join(reports, `${name}.json`)))}` ===
        expected,
      'Evidence bytes differ from their qualification receipt.',
    );
  ensure(
    `sha256:${hash(artifact.sbom.bytes)}` === record.sbom.digest &&
      `sha256:${hash(artifact.provenance.bytes)}` === record.provenance.digest,
    'Detached attestations differ from the actual image.',
  );
  validateScan(
    readJson(join(reports, 'scan.json')),
    readJson(join(reports, 'scanner.json')),
    now,
    artifact.config,
  );
  validateBundleEvidence(readJson(join(reports, 'bundle.json')));
  return { record, artifact, reports };
}
export function requirePublishedTag(response, digest) {
  ensure(
    response.ok && response.headers.get('docker-content-digest') === digest,
    'Published discovery tag does not resolve to the qualified digest.',
  );
}
async function registryToken() {
  ensure(
    process.env.GITHUB_TOKEN && process.env.GITHUB_ACTOR,
    'Registry credential is unavailable.',
  );
  const response = await fetch(
    'https://ghcr.io/token?service=ghcr.io&scope=repository:stanimirivanov/fleetiq-ux:pull,push',
    {
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(
            `${process.env.GITHUB_ACTOR}:${process.env.GITHUB_TOKEN}`,
          ).toString('base64'),
      },
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    },
  );
  ensure(
    response.ok,
    `Registry authorization failed (HTTP ${response.status}).`,
  );
  const { token } = await response.json();
  ensure(
    typeof token === 'string' && token.length > 0,
    'Registry authorization returned no token.',
  );
  return token;
}
async function registryManifest(method, reference, token) {
  return await fetch(
    `https://ghcr.io/v2/stanimirivanov/fleetiq-ux/manifests/${reference}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.oci.image.index.v1+json',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    },
  );
}
export async function publish() {
  const authorization = await authorize();
  const directory = resolve(process.env.FLEETIQ_QUALIFICATION_DIR ?? '');
  const child = relative(resolve('dist/images'), directory);
  ensure(
    child.startsWith('run-') &&
      !child.includes('..') &&
      !child.includes('/') &&
      !child.includes('\\'),
    'Invalid qualification directory.',
  );
  ensure(
    lstatSync(directory).isDirectory() &&
      !lstatSync(directory).isSymbolicLink(),
    'Qualification directory must not redirect.',
  );
  plainAncestors(directory);
  const source = await sourceIdentity();
  ensure(
    source.revision === authorization.revision && !source.dirty,
    'Checked-out source differs from publication authorization.',
  );
  const manifest = readJson('package.json');
  requireQualification(process.cwd(), source, manifest);
  const pin = manifest.packageManager.split('@')[1];
  const imageReceipt = readdirSync('.verification')
    .filter((name) => /^image-[0-9]+-[a-z0-9-]+\.json$/u.test(name))
    .some((name) =>
      qualifiedReport(
        readJson(ownedFile(process.cwd(), `.verification/${name}`)),
        'image',
        source,
        pin,
      ),
    );
  ensure(
    imageReceipt,
    'Publication requires a complete original-source image group receipt.',
  );
  const { record, artifact, reports } = validateEvidence(directory, source);
  const tools = readJson('tools/images/tools.json');
  const tag =
    'build-' +
    source.revision +
    '-' +
    authorization.run +
    '-' +
    authorization.attempt;
  const token = await registryToken();
  const previous = await registryManifest('HEAD', tag, token);
  ensure(
    previous.status === 404,
    'Publication reference exists or cannot be proved absent (HTTP ' +
      previous.status +
      ').',
  );
  plainAncestors(directory);
  const authDirectory = makeOwnedDirectory(directory, 'registry-auth');
  const config = join(authDirectory, 'config.json');
  let resources;
  let cancel;
  try {
    writeFileSync(
      config,
      JSON.stringify({
        auths: {
          'ghcr.io': {
            auth: Buffer.from(
              `${process.env.GITHUB_ACTOR}:${process.env.GITHUB_TOKEN}`,
            ).toString('base64'),
          },
        },
      }),
      { flag: 'wx', mode: 0o600 },
    );
    resources = new Resources();
    cancel = cancellation();
    cancel.check();
    await transport(
      tools,
      directory,
      [
        'copy',
        '--all',
        '--preserve-digests',
        '--authfile',
        '/auth/config.json',
        'oci:/artifact/layout',
        `docker://${IMAGE}:${tag}`,
      ],
      ['--volume', `${config}:/auth/config.json:ro`],
      true,
    );
    requirePublishedTag(
      await registryManifest('HEAD', tag, token),
      artifact.digest,
    );
    const verified = await registryManifest('GET', artifact.digest, token);
    ensure(
      verified.ok &&
        verified.headers.get('docker-content-digest') === artifact.digest,
      'Published index is unavailable or has another digest.',
    );
    ensure(
      `sha256:${hash(Buffer.from(await verified.arrayBuffer()))}` ===
        artifact.digest,
      'Published registry bytes differ.',
    );
    ensure(
      JSON.stringify(await sourceIdentity()) === JSON.stringify(source),
      'Source changed during publication.',
    );
    cancel.check();
  } finally {
    try {
      if (resources) await resources.cleanup();
    } finally {
      rmSync(config, { force: true });
      cancel?.dispose();
    }
  }
  const publication = {
    format: 'fleetiq-image-publication.v1',
    outcome: 'published',
    image: `${IMAGE}@${artifact.digest}`,
    discovery_tag: tag,
    source,
    platform: record.platform,
    bundle: record.bundle,
    provenance: record.provenance,
    sbom: record.sbom,
    qualification: `sha256:${hash(readFileSync(join(reports, 'qualification.json')))}`,
    scan: record.scan,
    authorization,
  };
  writeFileSync(
    join(reports, 'publication.json'),
    `${JSON.stringify(publication, null, 2)}\n`,
  );
  retainReports(directory, `${authorization.run}-${authorization.attempt}`);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      'Published UX/static edge: `' +
        publication.image +
        '`\n\nSource: `' +
        source.revision +
        '` (linux/amd64). This does not promote an environment.\n',
    );
  console.log(`Published and verified: ${publication.image}`);
}

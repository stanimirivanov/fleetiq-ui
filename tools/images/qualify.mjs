/** One build, exact original OCI scan, real artifact checks, and owned cleanup. */
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { makeOwnedDirectory, plainAncestors } from '../security/owned.mjs';
import { inspectLayout } from './oci.mjs';
import {
  CHECKS,
  ensure,
  hash,
  IMAGE,
  readJson,
  SBOM_CATALOGERS,
  validateDockerfile,
  validateTools,
} from './policy.mjs';
import { cancellation, docker, jsonDocker } from './process.mjs';
import { Resources } from './resources.mjs';
import { qualifyRuntime } from './runtime.mjs';
import { scanRuntime } from './scan.mjs';
import { sourceIdentity } from './source.mjs';
import {
  loadRuntime,
  roundtrip,
  validateLoadedIdentity,
} from './transport.mjs';
/** Only small inspected report JSON enters the existing retention boundary. */
export function retainReports(directory, id) {
  const evidence = makeOwnedDirectory(
    process.cwd(),
    `dist/image-reports/${id}`,
  );
  for (const name of [
    'qualification',
    'scan',
    'scanner',
    'bundle',
    'sbom',
    'provenance',
    'publication',
  ]) {
    const path = join(directory, 'reports', `${name}.json`);
    try {
      readJson(path);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    writeFileSync(join(evidence, `${name}.json`), readFileSync(path), {
      flag: 'wx',
      mode: 0o600,
    });
  }
}
export async function qualify() {
  ensure(
    process.versions.node.split('.')[0] === '24',
    'Image qualification requires Node 24.',
  );
  const tools = readJson('tools/images/tools.json');
  validateTools(tools);
  validateDockerfile(
    readFileSync('Dockerfile', 'utf8').replaceAll('\r\n', '\n'),
    tools,
  );
  const source = await sourceIdentity();
  const r = new Resources();
  const directory = resolve(`dist/images/run-${r.id}`);
  makeOwnedDirectory(process.cwd(), 'dist/images');
  mkdirSync(directory);
  plainAncestors(directory);
  mkdirSync(join(directory, 'reports'));
  const record = {
    format: 'fleetiq-ux-image-qualification.v1',
    outcome: 'incomplete',
    source,
    platform: tools.platform,
    checks: [],
  };
  const save = () =>
    writeFileSync(
      join(directory, 'reports/qualification.json'),
      `${JSON.stringify(record, null, 2)}\n`,
    );
  save();
  const cancel = cancellation();
  let builder = false,
    loaded,
    success = false,
    failure;
  let stage = 'build';
  try {
    await docker([
      'buildx',
      'create',
      '--name',
      r.network,
      '--driver',
      'docker-container',
      '--driver-opt',
      `image=${tools.buildkit}`,
    ]);
    builder = true;
    await docker(
      [
        'buildx',
        'build',
        '--builder',
        r.network,
        '--platform',
        tools.platform,
        '--build-arg',
        `SOURCE_REVISION=${source.revision}`,
        '--tag',
        `${IMAGE}:qualify-${r.id}`,
        '--provenance',
        'mode=max,version=v1',
        '--sbom',
        'generator=' +
          tools.sbom +
          ',"SELECT_CATALOGERS=' +
          SBOM_CATALOGERS +
          '"',
        '--metadata-file',
        join(directory, 'build.json'),
        '--output',
        `type=oci,dest=${join(directory, 'layout')},tar=false`,
        process.cwd(),
      ],
      {
        capture: false,
        timeout: 2400000,
        env: {
          ...process.env,
          BUILDX_GIT_INFO: 'true',
          BUILDX_GIT_CHECK_DIRTY: 'true',
        },
      },
    );
    cancel.check();
    stage = 'oci-metadata';
    const artifact = inspectLayout(join(directory, 'layout'), source.revision);
    ensure(
      readJson(join(directory, 'build.json'))['containerimage.digest'] ===
        artifact.digest,
      'Build output digest differs.',
    );
    record.image = {
      digest: artifact.digest,
      manifest: artifact.manifest,
      config: artifact.config,
    };
    for (const name of ['sbom', 'provenance']) {
      writeFileSync(
        join(directory, 'reports', `${name}.json`),
        artifact[name].bytes,
      );
      record[name] = { digest: `sha256:${hash(artifact[name].bytes)}` };
    }
    record.checks.push('oci-metadata');
    await r.start();
    stage = 'registry-import';
    loaded = await loadRuntime(tools, directory, artifact, r);
    stage = 'runtime';
    const runtime = await qualifyRuntime(loaded, tools, directory, r);
    record.bundle = {
      digest: `sha256:${hash(readFileSync(join(directory, 'reports/bundle.json')))}`,
    };
    record.checks.push(...runtime.checks);
    stage = 'registry-roundtrip';
    await roundtrip(tools, directory, artifact, r, loaded);
    ensure(
      inspectLayout(join(directory, 'roundtrip'), source.revision).digest ===
        artifact.digest,
      'Registry changed the complete OCI index.',
    );
    record.checks.push('registry-roundtrip');
    stage = 'runtime-security-scan';
    console.log(`Scan original OCI runtime: ${artifact.manifest}`);
    record.scan = await scanRuntime(directory, tools, artifact, r);
    record.checks.push('runtime-security-scan');
    ensure(
      JSON.stringify(await sourceIdentity()) === JSON.stringify(source),
      'Qualification sources changed.',
    );
    cancel.check();
    success = true;
  } catch (error) {
    failure = error;
  } finally {
    const cleanupErrors = [];
    const attempt = async (task) => {
      try {
        await task();
      } catch (error) {
        cleanupErrors.push(error);
      }
    };
    await attempt(() => r.cleanup());
    if (builder)
      await attempt(() =>
        docker(['buildx', 'rm', r.network], { timeout: 120000 }),
      );
    if (loaded)
      await attempt(async () => {
        validateLoadedIdentity(
          (await jsonDocker(['image', 'inspect', loaded.image]))[0],
          loaded,
        );
        await docker(['image', 'rm', loaded.image]);
      });
    if (success && !failure && !cleanupErrors.length)
      await attempt(async () => {
        stage = 'cleanup';
        record.checks.push('cleanup');
        ensure(
          JSON.stringify(record.checks) === JSON.stringify(CHECKS),
          'Image checks differ.',
        );
        record.outcome = 'passed';
      });
    if (cleanupErrors.length) {
      record.outcome = 'incomplete';
      failure = new AggregateError(
        [...(failure ? [failure] : []), ...cleanupErrors],
        [failure?.message, ...cleanupErrors.map((error) => error.message)]
          .filter(Boolean)
          .join('; '),
      );
    }
    record.stage = stage;
    await attempt(async () => {
      save();
      retainReports(directory, r.id);
    });
    cancel.dispose();
    if (!failure && cleanupErrors.length) failure = cleanupErrors[0];
  }
  if (failure) throw failure;
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `directory=${directory.replaceAll('\\', '/')}\n`,
    );
  console.log(`UX image qualified: ${record.image.digest}`);
  return directory;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    await qualify();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

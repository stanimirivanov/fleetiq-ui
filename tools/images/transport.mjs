import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { DIGEST, ensure } from './policy.mjs';
import { containerUser, docker, jsonDocker } from './process.mjs';
import { until } from './resources.mjs';
export function transport(
  tools,
  directory,
  args,
  extra = [],
  readOnly = false,
) {
  return docker(
    [
      'run',
      '--rm',
      '--user',
      containerUser(),
      '--read-only',
      '--cap-drop',
      'ALL',
      '--security-opt',
      'no-new-privileges:true',
      '--env',
      'HOME=/tmp',
      '--tmpfs',
      '/tmp:rw,noexec,nosuid,size=512m',
      '--volume',
      `${directory}:/artifact${readOnly ? ':ro' : ''}`,
      ...extra,
      tools.transport,
      '--tmpdir',
      '/tmp',
      ...args,
    ],
    { timeout: 300000 },
  );
}
export function validateLoadedIdentity(metadata, loaded) {
  ensure(
    DIGEST.test(loaded.id) &&
      metadata?.Id === loaded.id &&
      metadata.RepoTags?.includes(loaded.image),
    'Loaded digest reference changed.',
  );
}
// Docker stores may normalize absent/empty defaults and use different local IDs.
// All active runtime config and ordered uncompressed layer digests must agree;
// history and JSON serialization are not runtime behavior. No re-export is needed.
function active(config) {
  const defaults = (value) =>
    value === null ||
    value === undefined ||
    value === false ||
    value === 0 ||
    value === '' ||
    (Array.isArray(value) && !value.length) ||
    (typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      !Object.keys(value).length);
  return Object.fromEntries(
    Object.entries(config ?? {})
      .filter(([, value]) => !defaults(value))
      .map(([key, value]) => [
        key,
        key === 'Healthcheck'
          ? Object.fromEntries(
              Object.entries(value).filter(([, setting]) => !defaults(setting)),
            )
          : value,
      ]),
  );
}
export function validateImportedRuntime(loaded, expected) {
  ensure(
    expected?.rootfs?.type === 'layers' &&
      expected.rootfs.diff_ids?.length > 0 &&
      loaded.RootFS?.Type === 'layers' &&
      loaded.Os === expected.os &&
      loaded.Architecture === expected.architecture,
    'Imported runtime platform differs.',
  );
  ensure(
    isDeepStrictEqual(loaded.RootFS?.Layers, expected.rootfs.diff_ids),
    'Imported runtime filesystem differs.',
  );
  ensure(
    isDeepStrictEqual(active(loaded.Config), active(expected.config)),
    'Imported runtime configuration differs.',
  );
}
export async function loadRuntime(tools, directory, artifact, resources) {
  const registry = await resources.container('registry', [
    '--tmpfs',
    '/var/lib/registry:rw,nosuid,size=256m',
    tools.registry,
  ]);
  await until(async () => {
    try {
      return (
        (
          await docker([
            'exec',
            registry,
            'wget',
            '-q',
            '-O',
            '-',
            'http://127.0.0.1:5000/v2/',
          ])
        ).trim() === '{}'
      );
    } catch {
      return false;
    }
  });
  await transport(
    tools,
    directory,
    [
      'copy',
      '--all',
      '--preserve-digests',
      '--dest-tls-verify=false',
      'oci:/artifact/layout',
      `docker://${registry}:5000/fleetiq:qualified`,
    ],
    ['--network', resources.network],
    true,
  );
  const image = `fleetiq-ux-qualified:${resources.id}`;
  ensure(
    !(
      await docker([
        'image',
        'ls',
        '--filter',
        `reference=${image}`,
        '--format',
        '{{.ID}}',
      ])
    ).trim(),
    'Owned runtime reference already exists.',
  );
  const exporter = await resources.container(
    'importer',
    [
      '--user',
      containerUser(),
      '--read-only',
      '--cap-drop',
      'ALL',
      '--security-opt',
      'no-new-privileges:true',
      '--env',
      'HOME=/tmp',
      '--tmpfs',
      '/tmp:rw,noexec,nosuid,size=512m',
      '--volume',
      `${directory}:/artifact:ro`,
      '--entrypoint',
      '/usr/bin/sleep',
      tools.transport,
      'infinity',
    ],
    'none',
  );
  const archive = join(directory, 'import.tar');
  let loaded;
  let loadAttempted = false;
  try {
    await docker(
      [
        'exec',
        exporter,
        'skopeo',
        '--tmpdir',
        '/tmp',
        '--override-os',
        'linux',
        '--override-arch',
        'amd64',
        'copy',
        'oci:/artifact/layout',
        `docker-archive:/tmp/import.tar:${image}`,
      ],
      { timeout: 300000 },
    );
    await docker(['exec', exporter, 'cat', '/tmp/import.tar'], {
      output: archive,
      timeout: 180000,
    });
    loadAttempted = true;
    await docker(['load', '--input', archive], {
      timeout: 900000,
      diagnostics: true,
    });
    const [metadata] = await jsonDocker(['image', 'inspect', image]);
    loaded = { image, id: metadata.Id, registry };
    validateLoadedIdentity(metadata, loaded);
    validateImportedRuntime(metadata, artifact.configuration);
    return loaded;
  } catch (error) {
    if (loadAttempted) {
      const reference = (
        await docker([
          'image',
          'ls',
          '--filter',
          `reference=${image}`,
          '--format',
          '{{.ID}}',
        ])
      ).trim();
      if (reference) {
        const [candidate] = await jsonDocker(['image', 'inspect', image]);
        ensure(
          candidate.RepoTags?.includes(image),
          'Imported reference ownership changed; cleanup refused.',
        );
        await docker(['image', 'rm', image]);
      }
    }
    throw error;
  } finally {
    if (existsSync(archive)) rmSync(archive);
  }
}
export async function roundtrip(tools, directory, artifact, resources, loaded) {
  await transport(
    tools,
    directory,
    [
      'copy',
      '--all',
      '--preserve-digests',
      '--src-tls-verify=false',
      `docker://${loaded.registry}:5000/fleetiq@${artifact.digest}`,
      'oci:/artifact/roundtrip',
    ],
    ['--network', resources.network],
  );
}

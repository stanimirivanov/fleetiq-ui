import { DIGEST, ensure, hash } from './policy.mjs';
import { docker } from './process.mjs';

export const IMAGE_ROLES = [
  'transport',
  'registry',
  'scanner',
  'node',
  'edge',
  'frontend',
  'buildkit',
  'sbom',
  'tls',
];

function prerequisiteError(role, category) {
  const error = new Error(
    `Image prerequisite failed (role=${role}, category=${category}); check the pinned digest and registry diagnostics.`,
  );
  error.code = category;
  return error;
}

/** Buildx reads the registry directly; a daemon-cached pull cannot prove availability. */
export async function verifyRemoteImage(role, reference, execute = docker) {
  const digest = reference.split('@')[1];
  if (!DIGEST.test(digest)) throw prerequisiteError(role, 'invalid-pin');
  let raw;
  try {
    raw = await execute(
      ['buildx', 'imagetools', 'inspect', '--raw', reference],
      { diagnostics: true, timeout: 60_000 },
    );
  } catch {
    throw prerequisiteError(role, 'remote-manifest-unavailable');
  }
  try {
    if (
      typeof raw !== 'string' ||
      Buffer.byteLength(raw) > 2 * 1024 * 1024 ||
      `sha256:${hash(raw)}` !== digest
    )
      throw new Error();
    const manifest = JSON.parse(raw);
    if (
      manifest.schemaVersion !== 2 ||
      !(
        (Array.isArray(manifest.manifests) && manifest.manifests.length > 0) ||
        (Array.isArray(manifest.layers) && DIGEST.test(manifest.config?.digest))
      )
    )
      throw new Error();
  } catch {
    throw prerequisiteError(role, 'remote-manifest-invalid');
  }
}

/** Verify every remote build input before allowing cached acquisition or a long build. */
export async function pullToolImages(
  tools,
  execute = docker,
  roles = IMAGE_ROLES,
) {
  ensure(
    Array.isArray(roles) &&
      roles.length > 0 &&
      new Set(roles).size === roles.length &&
      roles.every((role) => IMAGE_ROLES.includes(role)),
    'Invalid image prerequisite roles.',
  );
  for (const role of roles) {
    console.log(`Verify remote ${role} manifest: ${tools[role]}`);
    await verifyRemoteImage(role, tools[role], execute);
  }
  for (const role of [
    'transport',
    'registry',
    'scanner',
    'node',
    'edge',
    'tls',
  ].filter((role) => roles.includes(role))) {
    console.log(`Pull pinned ${role} image: ${tools[role]}`);
    try {
      await execute(['pull', '--platform', tools.platform, tools[role]], {
        capture: false,
        timeout: 180_000,
      });
    } catch {
      throw prerequisiteError(role, 'image-pull-failed');
    }
  }
}

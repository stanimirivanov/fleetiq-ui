import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { hash } from '../policy.mjs';
import {
  IMAGE_ROLES,
  pullToolImages,
  verifyRemoteImage,
} from '../prerequisites.mjs';
import { qualifyRemoteProbe } from '../remote-probe.mjs';

const configured = JSON.parse(
  readFileSync(new URL('../tools.json', import.meta.url)),
);
const bytes = JSON.stringify({
  schemaVersion: 2,
  config: { digest: `sha256:${'a'.repeat(64)}` },
  layers: [],
});
const reference = `fixture/image:v1@sha256:${hash(bytes)}`;
const tools = Object.fromEntries(IMAGE_ROLES.map((role) => [role, reference]));
tools.platform = 'linux/amd64';

test('all nine remote manifests are verified before cached pulls can run', async () => {
  const commands = [];
  await pullToolImages(tools, async (args, options) => {
    commands.push(args);
    if (args[0] === 'buildx') {
      assert.equal(options.diagnostics, true);
      assert.equal(options.timeout, 60_000);
      return bytes;
    }
    assert.equal(options.capture, false);
    assert.equal(options.timeout, 180_000);
    return '';
  });
  assert.deepEqual(commands, [
    ...IMAGE_ROLES.map((role) => [
      'buildx',
      'imagetools',
      'inspect',
      '--raw',
      tools[role],
    ]),
    ...['transport', 'registry', 'scanner', 'node', 'edge', 'tls'].map(
      (role) => ['pull', '--platform', tools.platform, tools[role]],
    ),
  ]);
});

test('a warm pull success cannot hide remote manifest removal', async () => {
  let pulls = 0;
  const execute = async (args) => {
    if (args[0] === 'pull') {
      pulls++;
      return 'Image is up to date';
    }
    throw new Error('manifest unknown with private diagnostic bytes');
  };
  await assert.rejects(pullToolImages(tools, execute), {
    code: 'remote-manifest-unavailable',
    message: /role=transport.*category=remote-manifest-unavailable/u,
  });
  assert.equal(pulls, 0);
});

test('remote corruption, malformed metadata and absent pins fail without leaking responses', async () => {
  for (const raw of [
    'private response',
    '{}',
    `${bytes} `,
    'x'.repeat(2 * 1024 * 1024 + 1),
  ]) {
    await assert.rejects(
      verifyRemoteImage('transport', reference, async () => raw),
      { code: 'remote-manifest-invalid' },
    );
  }
  const malformed = 'not json';
  await assert.rejects(
    verifyRemoteImage(
      'transport',
      `fixture@sha256:${hash(malformed)}`,
      async () => malformed,
    ),
    { code: 'remote-manifest-invalid' },
  );
  await assert.rejects(verifyRemoteImage('transport', 'fixture:latest'), {
    code: 'invalid-pin',
  });
  const invalidShape = JSON.stringify({ schemaVersion: 2, manifests: [] });
  await assert.rejects(
    verifyRemoteImage(
      'transport',
      `fixture@sha256:${hash(invalidShape)}`,
      async () => invalidShape,
    ),
    { code: 'remote-manifest-invalid' },
  );
});

test('pull failures identify acquisition separately from remote availability', async () => {
  await assert.rejects(
    pullToolImages(tools, async (args) => {
      if (args[0] === 'buildx') return bytes;
      throw new Error('private daemon detail');
    }),
    {
      code: 'image-pull-failed',
      message: /role=transport.*image-pull-failed/u,
    },
  );
});

test('configured transport uses the upstream immutable namespace and a digest', () => {
  assert.match(
    configured.transport,
    /^quay\.io\/containers\/skopeo:v\d+\.\d+\.\d+-immutable@sha256:[a-f0-9]{64}$/u,
  );
});

// The artifact gate runs this same control with actual Buildx. Unit tests prove
// its orchestration and refusal to accept a broken inspector without requiring Docker.
async function fixtureCommand(args) {
  const ref = args.at(-1);
  const [name, digest] = ref.split('@');
  const response = await fetch(
    `http://${name.replace('/fixture', '')}/v2/fixture/manifests/${digest}`,
  );
  if (!response.ok) throw new Error('manifest unavailable');
  return response.text();
}

test('registry controls accept valid inspection and reject bypassed or cached verification', async () => {
  await qualifyRemoteProbe(fixtureCommand);
  await assert.rejects(
    qualifyRemoteProbe(async () => bytes),
    { code: 'remote-manifest-invalid' },
  );
  let cached;
  await assert.rejects(
    qualifyRemoteProbe(async (args) => (cached ??= await fixtureCommand(args))),
    /accepted removed|cached metadata/u,
  );
});

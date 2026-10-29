import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { GROUPS, REQUIRED_SCRIPTS } from '../../verification/catalogue.mjs';
import { hash, validateQualification } from '../policy.mjs';
import { pullToolImages } from '../prerequisites.mjs';
import { qualificationMode } from '../security-mode.mjs';

const manifest = JSON.parse(
  readFileSync(new URL('../../../package.json', import.meta.url)),
);

test('local security command includes source/dependency review and exact image scan', () => {
  for (const name of [
    'security:preflight',
    'security:image',
    'image:security-artifact',
  ])
    assert.equal(manifest.scripts[name], REQUIRED_SCRIPTS[name]);
  assert.deepEqual(GROUPS['image-security'], [
    'image-tests',
    'image-policy',
    'image-security-artifact',
  ]);
  assert.deepEqual(GROUPS.security, ['secrets', 'dependencies']);
  assert.deepEqual(GROUPS.image, [
    'image-tests',
    'image-policy',
    'image-artifact',
  ]);
});

test('security-only evidence cannot qualify publication even after a successful scan', () => {
  const plan = qualificationMode('security');
  assert.equal(plan.securityOnly, true);
  assert.deepEqual(plan.checks, [
    'oci-metadata',
    'runtime-security-scan',
    'cleanup',
  ]);
  assert.throws(
    () =>
      validateQualification(
        { format: plan.format, outcome: 'passed' },
        'a'.repeat(40),
      ),
    /qualification incomplete/u,
  );
  assert.deepEqual(qualificationMode('full'), {
    format: 'fleetiq-ux-image-qualification.v1',
    securityOnly: false,
  });
  for (const mode of [undefined, null, '', 'skip-scan', true])
    assert.throws(() => qualificationMode(mode), /Unknown/u);
});

test('security preflight verifies build/scanner remote pins but does not acquire registry transport', async () => {
  const raw = JSON.stringify({
    schemaVersion: 2,
    layers: [],
    config: { digest: `sha256:${'a'.repeat(64)}` },
  });
  const plan = qualificationMode('security');
  const tools = Object.fromEntries(
    plan.roles.map((role) => [role, `${role}:v1@sha256:${hash(raw)}`]),
  );
  tools.platform = 'linux/amd64';
  const calls = [];
  await pullToolImages(
    tools,
    async (args) => {
      calls.push(args);
      return raw;
    },
    plan.roles,
  );
  assert.equal(
    calls.filter((args) => args[0] === 'buildx').length,
    plan.roles.length,
  );
  assert(!plan.roles.includes('go'));
  assert(!plan.roles.includes('tls'));
  assert.deepEqual(
    calls.filter((args) => args[0] === 'pull').map((args) => args.at(-1)),
    [tools.scanner, tools.node, tools.edge],
  );
  assert.ok(!calls.flat().some((arg) => /registry:|transport:/u.test(arg)));
  for (const roles of [[], ['scanner', 'scanner'], ['unknown'], null])
    await assert.rejects(
      pullToolImages(
        tools,
        async () => assert.fail('invalid role ran a command'),
        roles,
      ),
      /Invalid/u,
    );
});

test('security CLI rejects bypass flags before any Docker work', () => {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL('../security.mjs', import.meta.url)), '--skip-scan'],
    { encoding: 'utf8', timeout: 10000, windowsHide: true },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unexpected security preflight arguments/u);
});

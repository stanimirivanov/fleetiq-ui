import assert from 'node:assert/strict';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { assembleBook } from './assemble-book.mjs';
import { fixture } from './fixtures.mjs';

const createFixture = async (context) => (await fixture(context)).output;

test('assembles distinct shell, connected-contract and development guide sections', async (context) => {
  const root = await createFixture(context);
  await assembleBook(root);

  const home = await readFile(path.join(root, 'index.html'), 'utf8');
  const index = await readFile(path.join(root, 'README.md'), 'utf8');
  const sample = await readFile(
    path.join(root, 'map-workbench', 'index.html'),
    'utf8',
  );
  const sampleMarkdown = await readFile(
    path.join(root, 'map-workbench', 'README.md'),
    'utf8',
  );
  const production = await readFile(
    path.join(root, 'console-orientation', 'index.html'),
    'utf8',
  );

  const connected = await readFile(
    path.join(root, 'connected-operator-session', 'index.html'),
    'utf8',
  );
  const connectedMarkdown = await readFile(
    path.join(root, 'connected-operator-session', 'README.md'),
    'utf8',
  );
  assert.match(home, /Use connected semantic metadata/);
  assert.match(connected, /mode-note--connected-contract/);
  assert.match(connected, /Provider sign-in return is simulated/);
  assert.match(connectedMarkdown, /do not qualify a deployed provider/);
  assert.doesNotMatch(connected, /mode-note--production-shell/);
  assert.doesNotMatch(connected, /mode-note--development-sample/);
  assert.ok(
    home.indexOf('data-guide-mode="production-shell"') <
      home.indexOf('data-guide-mode="connected-contract"'),
  );
  assert.ok(
    home.indexOf('data-guide-mode="connected-contract"') <
      home.indexOf('data-guide-mode="development-sample"'),
  );
  assert.match(home, /Production console orientation/);
  assert.match(home, /Explore sample workflows/);
  assert.match(home, /synthetic data/);
  assert.match(index, /Development-sample chapters use synthetic data/);
  assert.match(sample, /The assets, telemetry/);
  assert.match(sampleMarkdown, /do not demonstrate live fleet operations/);
  assert.match(production, /mode-note--production-shell/);
  assert.doesNotMatch(production, /mode-note--development-sample/);
});

test('rejects a required chapter with the wrong data mode', async (context) => {
  const root = await createFixture(context);
  const manifest = path.join(root, 'registry-review', 'guide.json');
  const value = JSON.parse(await readFile(manifest, 'utf8'));
  value.dataMode = 'production-shell';
  await writeFile(manifest, JSON.stringify(value));

  await assert.rejects(
    assembleBook(root),
    /registry-review must use dataMode development-sample/,
  );
});

test('rejects an incomplete set of planned screen journeys', async (context) => {
  const root = await createFixture(context);
  const missing = path.join(root, 'alert-triage');
  if (!missing.startsWith(`${path.resolve(root)}${path.sep}`)) {
    throw new Error('Refusing to remove a guide fixture outside its root.');
  }
  await rm(missing, { recursive: true, force: true });

  await assert.rejects(assembleBook(root), /chapter is missing: alert-triage/);
});

for (const slug of [
  'connected-operator-session',
  'connected-asset-discovery',
  'connected-registry-review',
  'connected-recovery',
  'connected-device-onboarding',
  'connected-property-evidence',
  'connected-fleet-overview',
]) {
  test(`rejects missing connected procedure: ${slug}`, async (context) => {
    const root = await createFixture(context);
    const missing = path.resolve(root, slug);
    assert.equal(path.dirname(missing), path.resolve(root));
    await rm(missing, { recursive: true });
    await assert.rejects(
      assembleBook(root),
      new RegExp(`chapter is missing: ${slug}`, 'u'),
    );
  });
}
test('a connected procedure cannot be relabelled as unconfigured shell behavior', async (context) => {
  const root = await createFixture(context);
  const manifest = path.join(root, 'connected-asset-discovery', 'guide.json');
  const value = JSON.parse(await readFile(manifest, 'utf8'));
  value.dataMode = 'production-shell';
  await writeFile(manifest, JSON.stringify(value));
  await assert.rejects(
    assembleBook(root),
    /connected-asset-discovery must use dataMode connected-contract/u,
  );
});

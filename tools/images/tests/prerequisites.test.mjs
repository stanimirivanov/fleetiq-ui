import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { pullToolImages } from '../prerequisites.mjs';

const tools = JSON.parse(
  readFileSync(new URL('../tools.json', import.meta.url)),
);
test('remote digest availability is checked even with a warm local image cache', async () => {
  const commands = [];
  await pullToolImages(tools, async (args, options) => {
    commands.push(args);
    assert.equal(options.capture, false);
    assert.equal(options.timeout, 180_000);
  });
  assert.deepEqual(
    commands,
    ['transport', 'registry', 'scanner', 'node', 'edge'].map((role) => [
      'pull',
      '--platform',
      tools.platform,
      tools[role],
    ]),
  );
});
test('an unavailable tool stops before build and identifies its role', async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      pullToolImages(tools, async () => {
        calls++;
        throw new Error('manifest unknown');
      }),
    /Pinned transport image is unavailable/u,
  );
  assert.equal(calls, 1);
});

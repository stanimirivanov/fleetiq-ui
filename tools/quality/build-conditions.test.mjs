import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadConfigFromFile } from 'vite';

const file = fileURLToPath(
  new URL('../../apps/web/vite.config.ts', import.meta.url),
);

// Load the actual TypeScript configuration, rather than matching source text.
for (const mode of ['production', 'staging', 'development', 'test']) {
  test(`only jsdom test mode forces development browser resolution: ${mode}`, async () => {
    const loaded = await loadConfigFromFile({ command: 'build', mode }, file);
    assert.ok(loaded);
    assert.deepEqual(
      loaded.config.resolve,
      mode === 'test' ? { conditions: ['development', 'browser'] } : undefined,
    );
  });
}

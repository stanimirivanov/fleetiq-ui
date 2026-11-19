import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { ownedFixture } from '../sensors/fixtures.mjs';
import { installDetector } from './install.mjs';
import { releaseFor } from './pins.mjs';

for (const failure of ['network', 408, 429, 502, 503]) {
  test(`installer retries transient ${failure} and still verifies the archive`, async (context) => {
    const root = await ownedFixture(context);
    const bytes = readFileSync(
      new URL(
        `../../.verification/tools/gitleaks/${releaseFor().name}`,
        import.meta.url,
      ),
    );
    let attempts = 0;
    const waits = [];
    const fetcher = async () => {
      attempts++;
      if (attempts === 1) {
        if (failure === 'network')
          throw new TypeError('synthetic network failure');
        return new Response(null, { status: failure });
      }
      return new Response(bytes);
    };
    await installDetector(root, fetcher, async (delay) => waits.push(delay));
    assert.equal(attempts, 2);
    assert.deepEqual(waits, [250]);
    assert.deepEqual(
      readFileSync(
        join(root, '.verification/tools/gitleaks', releaseFor().name),
      ),
      bytes,
    );
  });
}
test('installer bounds transient retries and never accepts unavailable bytes', async (context) => {
  const root = await ownedFixture(context);
  let attempts = 0;
  const waits = [];
  await assert.rejects(
    installDetector(
      root,
      async () => {
        attempts++;
        return new Response(null, { status: 503 });
      },
      async (delay) => waits.push(delay),
    ),
    /download failed/u,
  );
  assert.equal(attempts, 3);
  assert.deepEqual(waits, [250, 500]);
});
for (const failure of ['checksum', 403, 404]) {
  test(`installer does not retry permanent ${failure} failures`, async (context) => {
    const root = await ownedFixture(context);
    let attempts = 0;
    await assert.rejects(
      installDetector(
        root,
        async () => {
          attempts++;
          return failure === 'checksum'
            ? new Response('corrupt')
            : new Response(null, { status: failure });
        },
        () => assert.fail('permanent failure retried'),
      ),
    );
    assert.equal(attempts, 1);
  });
}

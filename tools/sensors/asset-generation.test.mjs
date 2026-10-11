import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { generateAssetContract } from './asset-generation.mjs';
import { ownedFixture } from './fixtures.mjs';

const canonical = Buffer.from('export const AssetPage = {};\n');
async function fixture(
  context,
  program = 'process.stdout.write("export const AssetPage = {};\\n");',
) {
  const repositoryRoot = await ownedFixture(context);
  const specPath = path.join(repositoryRoot, 'spec with spaces.json');
  const outputPath = path.join(repositoryRoot, 'generated contract.ts');
  const generatorPath = path.join(repositoryRoot, 'generator fixture.mjs');
  await writeFile(specPath, '{}\n');
  await writeFile(outputPath, canonical);
  await writeFile(generatorPath, program);
  return { repositoryRoot, specPath, outputPath, generatorPath };
}
async function assertUnchanged(paths, output = canonical) {
  assert.deepEqual(await readFile(paths.outputPath), output);
  assert.deepEqual(await readFile(paths.specPath), Buffer.from('{}\n'));
}

test('real Node subprocess check preserves exact existing bytes', async (context) => {
  const paths = await fixture(context);
  assert.deepEqual(await generateAssetContract({ ...paths, check: true }), {
    checked: true,
    bytes: canonical.length,
  });
  await assertUnchanged(paths);
});
test('generation writes only successful validated stdout bytes', async (context) => {
  const paths = await fixture(context);
  await writeFile(paths.outputPath, 'old\n');
  assert.deepEqual(await generateAssetContract(paths), {
    checked: false,
    bytes: canonical.length,
  });
  await assertUnchanged(paths);
});
test('missing executable fails without exposing OS/path diagnostics', async (context) => {
  const paths = await fixture(context);
  await assert.rejects(
    generateAssetContract({
      ...paths,
      check: true,
      nodeExecutable: path.join(
        paths.repositoryRoot,
        'private-fixture-secret-missing',
      ),
    }),
    (error) => {
      assert.match(error.message, /generation failed: subprocess error/);
      assert.doesNotMatch(error.message, /private-fixture-secret/);
      return true;
    },
  );
  await assertUnchanged(paths);
});
for (const [label, program, expected] of [
  [
    'nonzero exit',
    'process.stderr.write("private-fixture-secret"); process.exit(7);',
    /generation failed: exit 7/,
  ],
  [
    'stderr warning',
    'process.stdout.write("export const AssetPage = {};\\n"); process.stderr.write("private-fixture-secret");',
    /generation warned on stderr/,
  ],
  [
    'missing AssetPage',
    'process.stdout.write("private-fixture-secret");',
    /no AssetPage schema/,
  ],
]) {
  for (const check of [true, false]) {
    test(`${label} rejects and preserves output in ${check ? 'check' : 'write'} mode`, async (context) => {
      const paths = await fixture(context, program);
      await assert.rejects(
        generateAssetContract({ ...paths, check }),
        (error) => {
          assert.match(error.message, expected);
          assert.doesNotMatch(error.message, /private-fixture-secret/);
          return true;
        },
      );
      await assertUnchanged(paths);
    });
  }
}
test('stale bytes are rejected without rewriting output', async (context) => {
  const paths = await fixture(context);
  const stale = Buffer.from('export const AssetPage = { stale: true };\n');
  await writeFile(paths.outputPath, stale);
  await assert.rejects(
    generateAssetContract({ ...paths, check: true }),
    /contract is stale/,
  );
  await assertUnchanged(paths, stale);
});
test('CRLF output is stale even when its generated TypeScript is equivalent', async (context) => {
  const paths = await fixture(context);
  const crlf = Buffer.from('export const AssetPage = {};\r\n');
  await writeFile(paths.outputPath, crlf);
  await assert.rejects(
    generateAssetContract({ ...paths, check: true }),
    /contract is stale/,
  );
  await assertUnchanged(paths, crlf);
});
test('missing committed output is not created in check mode', async (context) => {
  const paths = await fixture(context);
  const outputPath = path.join(paths.repositoryRoot, 'absent.ts');
  await assert.rejects(
    generateAssetContract({ ...paths, outputPath, check: true }),
    /Cannot read generated/,
  );
  await assert.rejects(readFile(outputPath), { code: 'ENOENT' });
  await assertUnchanged(paths);
});
test('interruption and thrown launch failures do not publish output', async (context) => {
  const paths = await fixture(context);
  await assert.rejects(
    generateAssetContract({
      ...paths,
      check: true,
      run: () => ({
        status: null,
        signal: 'SIGTERM',
        stdout: canonical,
        stderr: Buffer.alloc(0),
      }),
    }),
    /subprocess interrupted/,
  );
  await assert.rejects(
    generateAssetContract({
      ...paths,
      check: true,
      run: () => {
        throw new Error('private-fixture-secret');
      },
    }),
    /subprocess could not launch/,
  );
  await assertUnchanged(paths);
});
test('the CLI argument vector is literal and bounds subprocess execution', async (context) => {
  const paths = await fixture(context);
  let observed;
  const run = (command, args, options) => {
    observed = { command, args, options };
    return spawnSync(command, args, options);
  };
  await generateAssetContract({ ...paths, check: true, run });
  assert.equal(observed.command, process.execPath);
  assert.deepEqual(observed.args, [
    paths.generatorPath,
    '--spec',
    paths.specPath,
    '--name',
    'FleetIqApi',
    '--format',
    'httpclient',
  ]);
  assert.equal(observed.options.shell, undefined);
  assert.equal(observed.options.encoding, undefined);
  assert.equal(observed.options.maxBuffer, 4 * 1024 * 1024);
  assert.equal(observed.options.timeout, 120_000);
  await assertUnchanged(paths);
});
test('the installed pinned generator reproduces the real committed client without writes', async () => {
  const outputPath = fileURLToPath(
    new URL('../../apps/web/src/generated/fleetiq-api.ts', import.meta.url),
  );
  const specPath = fileURLToPath(
    new URL(
      '../../contracts/http/fleetiq-v1-ui-baseline.openapi.json',
      import.meta.url,
    ),
  );
  const [beforeOutput, beforeSpec] = await Promise.all([
    readFile(outputPath),
    readFile(specPath),
  ]);
  await generateAssetContract({
    repositoryRoot: fileURLToPath(new URL('../../', import.meta.url)),
    specPath,
    outputPath,
    generatorPath: fileURLToPath(
      new URL(
        '../../node_modules/@effect/openapi-generator/dist/bin.js',
        import.meta.url,
      ),
    ),
    check: true,
  });
  assert.deepEqual(await readFile(outputPath), beforeOutput);
  assert.deepEqual(await readFile(specPath), beforeSpec);
});
test('importing all three CLI modules is silent and side-effect free', () => {
  const urls = [
    '../check-design-tokens.mjs',
    '../check-asset-contract.mjs',
    '../generate-asset-contract.mjs',
  ].map((relative) => new URL(relative, import.meta.url).href);
  const program = `for (const url of ${JSON.stringify(urls)}) await import(url);`;
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '--eval', program],
    { encoding: 'utf8', timeout: 20_000 },
  );
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

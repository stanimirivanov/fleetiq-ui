import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { BROWSER_OPERATIONS, checkAssetContract } from './asset-contract.mjs';
import { ownedFixture } from './fixtures.mjs';

const pinnedBytes = await readFile(
  new URL(
    '../../contracts/http/fleetiq-v1-ui-baseline.openapi.json',
    import.meta.url,
  ),
);
const pinnedSource = JSON.parse(
  await readFile(
    new URL('../../contracts/http/source.json', import.meta.url),
    'utf8',
  ),
);
const published = JSON.parse(pinnedBytes.toString('utf8'));
async function fixture(
  context,
  bytes = pinnedBytes,
  provenance = pinnedSource,
) {
  const root = await ownedFixture(context);
  const contractPath = path.join(root, 'contract.json');
  const provenancePath = path.join(root, 'source.json');
  await writeFile(contractPath, bytes);
  await writeFile(provenancePath, JSON.stringify(provenance));
  return { contractPath, provenancePath };
}
async function changedContract(context, mutate) {
  const contract = structuredClone(published);
  mutate(contract);
  const bytes = Buffer.from(JSON.stringify(contract), 'utf8');
  return fixture(context, bytes, {
    ...pinnedSource,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}

test('the byte-identical pinned contract and provenance pass', async (context) => {
  const paths = await fixture(context);
  assert.deepEqual(await checkAssetContract(paths), {
    commit: pinnedSource.commit,
    operations: 26,
  });
  assert.deepEqual(await readFile(paths.contractPath), pinnedBytes);
});
test('changed contract bytes fail even when JSON meaning is unchanged', async (context) => {
  const paths = await fixture(
    context,
    Buffer.concat([pinnedBytes, Buffer.from('\n')]),
  );
  await assert.rejects(checkAssetContract(paths), /digest differs/);
});
for (const [field, value] of [
  ['repository', 'other-platform'],
  ['remote', 'https://other.invalid'],
  ['commit', 'main'],
  ['path', 'other/openapi.json'],
  ['sha256', 'invalid'],
]) {
  test(`invalid provenance ${field} fails`, async (context) => {
    await assert.rejects(
      checkAssetContract(
        await fixture(context, pinnedBytes, {
          ...pinnedSource,
          [field]: value,
        }),
      ),
      /provenance is missing or invalid/,
    );
  });
}
for (const value of [null, [], {}]) {
  test(`non-provenance JSON ${JSON.stringify(value)} fails`, async (context) => {
    await assert.rejects(
      checkAssetContract(await fixture(context, pinnedBytes, value)),
      /provenance is missing or invalid/,
    );
  });
}
test('malformed provenance has bounded diagnostics', async (context) => {
  const paths = await fixture(context);
  await writeFile(paths.provenancePath, '{"secret":"private-fixture-secret"');
  await assert.rejects(checkAssetContract(paths), (error) => {
    assert.match(error.message, /provenance is invalid JSON/);
    assert.doesNotMatch(error.message, /private-fixture-secret/);
    return true;
  });
});
test('a missing source file is not a successful contract review', async (context) => {
  const paths = await fixture(context);
  await assert.rejects(
    checkAssetContract({
      ...paths,
      provenancePath: path.join(
        path.dirname(paths.provenancePath),
        'missing.json',
      ),
    }),
    /Cannot read pinned OpenAPI/,
  );
});
test('malformed contract with a matching digest still fails safely', async (context) => {
  const bytes = Buffer.from('{"secret":"private-fixture-secret"');
  const paths = await fixture(context, bytes, {
    ...pinnedSource,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
  await assert.rejects(checkAssetContract(paths), (error) => {
    assert.match(error.message, /contract is invalid JSON/);
    assert.doesNotMatch(error.message, /private-fixture-secret/);
    return true;
  });
});
for (const [label, mutate] of [
  [
    'OpenAPI version',
    (contract) => {
      contract.openapi = '3.0.0';
    },
  ],
  [
    'baseline version',
    (contract) => {
      contract.info.version = 'changed';
    },
  ],
  [
    'AssetPage schema',
    (contract) => {
      delete contract.components.schemas.AssetPage;
    },
  ],
  [
    'OperatorSession schema',
    (contract) => {
      delete contract.components.schemas.OperatorSession;
    },
  ],
]) {
  test(`changed ${label} fails despite a refreshed digest`, async (context) => {
    await assert.rejects(
      checkAssetContract(await changedContract(context, mutate)),
      /Unexpected asset catalogue/,
    );
  });
}
for (const schema of ['OperatorTenantPage', 'OperatorTenant', 'TenantAction']) {
  test(`missing tenant discovery schema ${schema} fails despite a refreshed digest`, async (context) => {
    await assert.rejects(
      checkAssetContract(
        await changedContract(context, (contract) => {
          delete contract.components.schemas[schema];
        }),
      ),
      /Unexpected asset catalogue/,
    );
  });
}
const publishedOperations = BROWSER_OPERATIONS.map(
  ({ path: route, method, id }) => ({ route, method, id }),
);
assert.equal(
  publishedOperations.length,
  26,
  'every consumed browser operation has a negative fixture',
);
for (const { route, method, id } of publishedOperations) {
  for (const change of ['missing', 'changed']) {
    test(`${change} published operation ${id} fails despite a refreshed digest`, async (context) => {
      const paths = await changedContract(context, (contract) => {
        if (change === 'missing') delete contract.paths[route][method];
        else contract.paths[route][method].operationId = 'unexpectedOperation';
      });
      await assert.rejects(
        checkAssetContract(paths),
        /Unexpected asset catalogue|Missing or changed published operation/,
      );
    });
  }
}
for (const [field, value] of [
  ['type', 'http'],
  ['in', 'header'],
  ['name', 'wrong-session-cookie'],
]) {
  test(`changed cookie ${field} fails despite a refreshed digest`, async (context) => {
    const paths = await changedContract(context, (contract) => {
      contract.components.securitySchemes.cookieAuth[field] = value;
    });
    await assert.rejects(
      checkAssetContract(paths),
      /Unexpected browser-session security/,
    );
  });
}

for (const field of ['commit', 'sha256']) {
  test(`provenance ${field} cannot be coerced from a JSON array`, async (context) => {
    const paths = await fixture(context, pinnedBytes, {
      ...pinnedSource,
      [field]: [pinnedSource[field]],
    });
    await assert.rejects(
      checkAssetContract(paths),
      /provenance is missing or invalid/,
    );
  });
}

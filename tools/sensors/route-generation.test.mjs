import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { BROWSER_OPERATIONS } from './asset-contract.mjs';
import {
  browserGenerationPatch,
  recoveryCommandSchema,
  routeGenerationPatch,
} from './route-generation.mjs';

const spec = JSON.parse(
  readFileSync(
    new URL(
      '../../contracts/http/fleetiq-v1-ui-baseline.openapi.json',
      import.meta.url,
    ),
    'utf8',
  ),
);
test('consumer generation preserves every selected operation and referenced schema', () => {
  const before = JSON.stringify(spec);
  const patches = browserGenerationPatch(spec);
  assert.equal(JSON.stringify(spec), before);
  const paths = patches[0].value,
    components = patches[1].value;
  for (const { path, method, id } of BROWSER_OPERATIONS) {
    const expected = structuredClone(spec.paths[path][method]);
    if (
      [
        'applyWorkRecovery',
        'createHistoricalExport',
        'cancelHistoricalExport',
        'requestArchiveRestore',
      ].includes(id)
    )
      expected.parameters.push(
        { $ref: '#/components/parameters/admin-mutation-origin' },
        { $ref: '#/components/parameters/admin-mutation-csrf' },
      );
    assert.deepEqual(paths[path][method], expected);
  }
  assert.equal(components.schemas.PublishPropertyDefinitionRequest, undefined);
  assert.ok(
    paths[
      '/api/v1/tenants/{tenant_id}/relationships/{relationship_id}/revisions/{revision}'
    ].post,
  );
  assert.ok(components.schemas.AppendRelationshipRevisionRequest);
  assert.ok(components.schemas.IngestionDiagnostics);
  assert.equal(components.schemas.ProtocolDeviceRoute.anyOf.length, 2);
});
test('route union retains all base constraints and both disjoint policy cases', () => {
  const union = routeGenerationPatch(spec)[0].value.anyOf;
  const base = structuredClone(spec.components.schemas.ProtocolDeviceRoute);
  delete base.allOf;
  for (const branch of union) {
    assert.deepEqual(branch.required, base.required);
    assert.equal(branch.additionalProperties, false);
    for (const [key, value] of Object.entries(base.properties)) {
      if (!['selection', 'policy_version'].includes(key))
        assert.deepEqual(branch.properties[key], value);
    }
  }
  assert.deepEqual(union[0].properties.selection, {
    $ref: '#/components/schemas/ProtocolRouteSelection',
  });
  assert.deepEqual(union[0].properties.policy_version, {
    type: 'integer',
    minimum: 1,
  });
  assert.deepEqual(union[1].properties.selection, { type: 'null' });
  assert.deepEqual(union[1].properties.policy_version, { type: 'null' });
});
test('changed conditions, missing consumed operations and unresolved refs fail closed', () => {
  const changed = structuredClone(spec);
  changed.components.schemas.ProtocolDeviceRoute.allOf[0].else.properties.policy_version.type =
    'string';
  assert.throws(() => browserGenerationPatch(changed), /constraint changed/);
  const missing = structuredClone(spec);
  delete missing.paths['/api/v1/tenants/{tenant_id}/assets/{asset_id}/device']
    .post;
  assert.throws(() => browserGenerationPatch(missing), /Missing consumed/);
  const external = structuredClone(spec);
  external.paths['/api/v1'].get.responses['200'] = {
    $ref: 'https://example.invalid',
  };
  assert.throws(() => browserGenerationPatch(external), /external/);
});

test('recovery generation keeps retry and empty control targets disjoint', () => {
  const [retry, control] = recoveryCommandSchema(spec).oneOf;
  assert.deepEqual(retry.properties.operation, { const: 'retry' });
  assert.deepEqual(retry.properties.target, {
    $ref: '#/components/schemas/WorkRetryTarget',
  });
  assert.deepEqual(control.properties.operation, { enum: ['pause', 'resume'] });
  assert.deepEqual(control.properties.target, {
    type: 'object',
    properties: {},
    additionalProperties: false,
  });
  for (const branch of [retry, control]) {
    assert.deepEqual(branch.required, [
      'operation',
      'expected_generation',
      'target',
    ]);
    assert.equal(branch.additionalProperties, false);
  }
  const changed = structuredClone(spec);
  changed.components.schemas.WorkRecoveryCommand.allOf[0].else.properties.target.maxProperties = 1;
  assert.throws(() => recoveryCommandSchema(changed), /constraint changed/);
});

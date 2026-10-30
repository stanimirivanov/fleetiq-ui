import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  IDENTIFIER_PATTERN,
  identifierGenerationPatch,
} from './identifier-generation.mjs';

const spec = JSON.parse(
  readFileSync(
    new URL(
      '../../contracts/http/fleetiq-v1-ui-baseline.openapi.json',
      import.meta.url,
    ),
  ),
);
test('reviewed identifier translation preserves bounds and rejects whitespace/control ranges', () => {
  const before = JSON.stringify(spec),
    patch = identifierGenerationPatch(spec)[0];
  assert.equal(JSON.stringify(spec), before);
  assert.equal(patch.value.minLength, 1);
  assert.equal(patch.value.maxLength, 128);
  const re = new RegExp(IDENTIFIER_PATTERN, 'u');
  for (const id of ['tenant-a', '车辆', 'é']) assert.ok(re.test(id));
  for (const id of [
    '',
    ' leading',
    'trailing ',
    'a\n',
    'a\0b',
    'a\x1fb',
    'a\x7fb',
    'a\x85b',
    'a\x9fb',
  ])
    assert.ok(!re.test(id));
});
test('unknown identifier constraints fail closed rather than silently dropping validation', () => {
  for (const [key, value] of [
    ['pattern', '.*'],
    ['maxLength', 129],
    ['minLength', 0],
    ['description', 'changed'],
  ]) {
    const changed = structuredClone(spec);
    changed.components.schemas.AdministrationIdentifier[key] = value;
    assert.throws(
      () => identifierGenerationPatch(changed),
      /constraint changed/,
    );
  }
});

test('semantic display-name bounds are retained and drift is rejected', () => {
  const patch = identifierGenerationPatch(spec)[1];
  assert.equal(patch.value.maxLength, 200);
  const changed = structuredClone(spec);
  changed.components.schemas.SemanticDefinitionName.maxLength = 201;
  assert.throws(() => identifierGenerationPatch(changed), /constraint changed/);
});

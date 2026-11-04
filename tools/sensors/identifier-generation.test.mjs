import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const spec = JSON.parse(
  readFileSync(
    new URL(
      '../../contracts/http/fleetiq-v1-ui-baseline.openapi.json',
      import.meta.url,
    ),
  ),
);
test('published identifier patterns reject whitespace and control ranges', () => {
  for (const [name, max] of [
    ['AdministrationIdentifier', 128],
    ['SemanticDefinitionName', 200],
  ]) {
    const schema = spec.components.schemas[name];
    assert.equal(schema.minLength, 1);
    assert.equal(schema.maxLength, max);
    const pattern = new RegExp(schema.pattern, 'u');
    for (const id of ['tenant-a', '车辆', 'é']) assert.ok(pattern.test(id));
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
      assert.ok(!pattern.test(id));
  }
});

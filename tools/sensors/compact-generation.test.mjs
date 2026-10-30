import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { compactBrowserSchemas } from './compact-generation.mjs';

function expand(value, schemas) {
  if (
    value?.$ref?.startsWith('#/components/schemas/BrowserPrimitiveConstraint')
  )
    return expand(schemas[value.$ref.split('/').at(-1)], schemas);
  if (Array.isArray(value)) return value.map((v) => expand(v, schemas));
  return value && typeof value === 'object'
    ? Object.fromEntries(
        Object.entries(value)
          .filter(([k, v]) => k !== 'description' || typeof v !== 'string')
          .map(([k, v]) => [k, expand(v, schemas)]),
      )
    : value;
}
test('hoisting retains exact constraints while removing runtime documentation strings', () => {
  const integer = {
    type: 'integer',
    minimum: 1,
    maximum: 4294967295,
    description: 'Exact revision',
  };
  const components = {
    schemas: {
      First: {
        type: 'object',
        properties: {
          one: { ...integer },
          two: { ...integer },
          different: { ...integer, maximum: 7 },
          text: { type: 'string', minLength: 1 },
        },
      },
    },
  };
  const before = structuredClone(components);
  compactBrowserSchemas(components);
  assert.deepEqual(
    expand(components.schemas.First, components.schemas),
    expand(before.schemas.First, {}),
  );
  assert.equal(Object.keys(components.schemas).length, 2);
  assert.deepEqual(components.schemas.BrowserPrimitiveConstraint1, {
    type: 'integer',
    minimum: 1,
    maximum: 4294967295,
  });
});
test('does not erase unknown constraints or traverse payload examples', () => {
  const s = {
    schemas: {
      One: {
        type: 'object',
        properties: {
          a: { type: 'integer', minimum: 1, multipleOf: 2 },
          b: { type: 'integer', minimum: 1, multipleOf: 2 },
        },
        example: { type: 'integer', minimum: 1, description: 'payload field' },
      },
    },
  };
  const before = structuredClone(s);
  compactBrowserSchemas(s);
  assert.deepEqual(s, before);
});
test('every published schema retains its complete constraint graph after primitive compaction', () => {
  const spec = JSON.parse(
    readFileSync(
      new URL(
        '../../contracts/http/fleetiq-v1-ui-baseline.openapi.json',
        import.meta.url,
      ),
    ),
  );
  const before = structuredClone(spec.components.schemas);
  compactBrowserSchemas(spec.components);
  for (const [name, schema] of Object.entries(before))
    assert.deepEqual(
      expand(spec.components.schemas[name], spec.components.schemas),
      expand(schema, {}),
      name,
    );
});

test('reused parameter constraints and defaults survive hoisting without altering query semantics', () => {
  const components = {
    schemas: {},
    parameters: {
      Limit: {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      },
    },
  };
  const before = structuredClone(components.parameters);
  compactBrowserSchemas(components);
  assert.deepEqual(expand(components.parameters, components.schemas), before);
});

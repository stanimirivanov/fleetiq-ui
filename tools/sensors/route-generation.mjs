import { isDeepStrictEqual } from 'node:util';
import { BROWSER_OPERATIONS } from './asset-contract.mjs';
import { compactBrowserSchemas } from './compact-generation.mjs';

/** Equivalent disjoint union for the one conditional unsupported by Effect 4.0.5.
 * Fail on upstream drift: never silently drop an unknown schema constraint.
 */
export function routeGenerationPatch(spec) {
  const route = spec.components?.schemas?.ProtocolDeviceRoute;
  if (!route) return [];
  const expected = JSON.parse(
    '[{"if":{"additionalProperties":true,"properties":{"selection":{"type":"null"}}},"then":{"additionalProperties":true,"properties":{"policy_version":{"type":"null"}}},"else":{"additionalProperties":true,"properties":{"policy_version":{"type":"integer"}}}}]',
  );
  if (
    !isDeepStrictEqual(route.allOf, expected) ||
    !route.required?.includes('selection') ||
    !route.required?.includes('policy_version') ||
    !isDeepStrictEqual(route.properties.selection, {
      anyOf: [
        { $ref: '#/components/schemas/ProtocolRouteSelection' },
        { type: 'null' },
      ],
    }) ||
    !isDeepStrictEqual(route.properties.policy_version, {
      type: ['integer', 'null'],
      minimum: 1,
      description:
        'Admission policy recorded at commissioning; null for retirement. GET is configuration, not a fresh eligibility check.',
    })
  ) {
    throw new Error(
      'Protocol route generation constraint changed; review its equivalent union.',
    );
  }
  const active = structuredClone(route),
    retired = structuredClone(route);
  delete active.allOf;
  delete retired.allOf;
  active.properties.selection = {
    $ref: '#/components/schemas/ProtocolRouteSelection',
  };
  active.properties.policy_version = { type: 'integer', minimum: 1 };
  retired.properties.selection = { type: 'null' };
  retired.properties.policy_version = { type: 'null' };
  return [
    {
      op: 'replace',
      path: '/components/schemas/ProtocolDeviceRoute',
      value: { anyOf: [active, retired] },
    },
  ];
}

/** Express the published retry/control conditional as disjoint closed objects. */
export function recoveryCommandSchema(spec) {
  const retry = { $ref: '#/components/schemas/WorkRetryTarget' };
  const empty = { type: 'object', maxProperties: 0 };
  const branchOnMatch = 'then';
  const base = {
    type: 'object',
    additionalProperties: false,
    required: ['operation', 'expected_generation', 'target'],
    properties: {
      operation: { type: 'string', enum: ['retry', 'pause', 'resume'] },
      expected_generation: { $ref: '#/components/schemas/WorkGeneration' },
      target: { oneOf: [retry, empty] },
    },
  };
  if (
    !isDeepStrictEqual(spec.components.schemas.WorkRecoveryCommand, {
      ...base,
      allOf: [
        {
          if: { properties: { operation: { const: 'retry' } } },
          [branchOnMatch]: { properties: { target: retry } },
          else: { properties: { target: empty } },
        },
      ],
    })
  )
    throw new Error(
      'Work recovery command constraint changed; review its equivalent union.',
    );
  return {
    oneOf: [
      {
        ...base,
        properties: {
          ...base.properties,
          operation: { const: 'retry' },
          target: retry,
        },
      },
      {
        ...base,
        properties: {
          ...base.properties,
          operation: { enum: ['pause', 'resume'] },
          target: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
        },
      },
    ],
  };
}

/** Generate only consumed operations and their transitive component closure.
 * The upstream artifact stays byte-identical. Browser-only header parameters
 * make published mutation requirements executable in the private client.
 */
export function browserGenerationPatch(spec) {
  if (!spec.paths) return [];
  const source = structuredClone(spec);
  for (const patch of routeGenerationPatch(spec))
    source.components.schemas.ProtocolDeviceRoute = patch.value;
  source.components.schemas.WorkRecoveryCommand = recoveryCommandSchema(spec);
  const paths = {};
  for (const { path, method, id } of BROWSER_OPERATIONS) {
    if (source.paths[path]?.[method]?.operationId !== id)
      throw new Error('Missing consumed browser operation.');
    paths[path] ??= {};
    paths[path][method] = source.paths[path][method];
    // The published operation describes the browser guard in prose. The
    // private browser client sends the same marker as other protected writes.
    if (
      [
        'applyWorkRecovery',
        'createHistoricalExport',
        'cancelHistoricalExport',
        'requestArchiveRestore',
      ].includes(id)
    ) {
      const parameters = paths[path][method].parameters;
      for (const header of ['admin-mutation-origin', 'admin-mutation-csrf']) {
        const $ref = `#/components/parameters/${header}`;
        if (!parameters.some((parameter) => parameter.$ref === $ref))
          parameters.push({ $ref });
      }
    }
    if (source.paths[path].parameters)
      paths[path].parameters = source.paths[path].parameters;
  }
  const components = { securitySchemes: source.components.securitySchemes };
  const seen = new Set();
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (typeof value.$ref === 'string') {
      const ref = value.$ref;
      if (!ref.startsWith('#/components/'))
        throw new Error('Unexpected external generation reference.');
      if (!seen.has(ref)) {
        seen.add(ref);
        const [, , group, name] = ref.split('/');
        const component = source.components[group]?.[name];
        if (!component)
          throw new Error('Missing referenced generation component.');
        components[group] ??= {};
        components[group][name] = component;
        visit(component);
      }
    }
    for (const child of Object.values(value)) visit(child);
  };
  visit(paths);
  compactBrowserSchemas(components);
  return [
    { op: 'replace', path: '/paths', value: paths },
    { op: 'replace', path: '/components', value: components },
  ];
}

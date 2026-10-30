import { isDeepStrictEqual } from 'node:util';
import { BROWSER_OPERATIONS } from './asset-contract.mjs';
import { compactBrowserSchemas } from './compact-generation.mjs';
import { identifierGenerationPatch } from './identifier-generation.mjs';

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

/** Generate only consumed operations and their transitive component closure.
 * The upstream artifact stays byte-identical; no selected operation is altered.
 */
export function browserGenerationPatch(spec) {
  if (!spec.paths) return [];
  const source = structuredClone(spec);
  for (const patch of routeGenerationPatch(spec))
    source.components.schemas.ProtocolDeviceRoute = patch.value;
  for (const patch of identifierGenerationPatch(spec))
    source.components.schemas[patch.path.split('/').at(-1)] = patch.value;
  const paths = {};
  for (const { path, method, id } of BROWSER_OPERATIONS) {
    if (source.paths[path]?.[method]?.operationId !== id)
      throw new Error('Missing consumed browser operation.');
    paths[path] ??= {};
    paths[path][method] = source.paths[path][method];
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

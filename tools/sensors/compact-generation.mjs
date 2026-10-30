/** Hoist identical primitive constraints in the private generator input.
 * Omit documentation descriptions from runtime schemas; published bytes retain them.
 * All validation keywords remain unchanged. Typed failures expose categories only.
 */
export function compactBrowserSchemas(components) {
  const occurrences = new Map();
  const visit = (schema) => {
    if (!schema || typeof schema !== 'object') return;
    if (typeof schema.description === 'string') delete schema.description;
    if (
      ['integer', 'string'].includes(schema.type) &&
      Object.keys(schema).every((k) =>
        [
          'type',
          'minimum',
          'maximum',
          'format',
          'minLength',
          'maxLength',
          'pattern',
          'default',
        ].includes(k),
      )
    ) {
      const key = JSON.stringify(schema);
      const entries = occurrences.get(key) ?? [];
      entries.push(schema);
      occurrences.set(key, entries);
    }
    for (const values of [schema.properties, schema.patternProperties])
      for (const child of Object.values(values ?? {})) visit(child);
    for (const key of [
      'items',
      'additionalProperties',
      'not',
      'if',
      'then',
      'else',
      'contains',
      'propertyNames',
    ])
      visit(schema[key]);
    for (const key of ['anyOf', 'oneOf', 'allOf'])
      for (const child of schema[key] ?? []) visit(child);
  };
  // Response/request schemas refer back to this transitive schema closure.
  for (const schema of Object.values(components.schemas ?? {})) visit(schema);
  const parameterShapes = new Set();
  for (const parameter of Object.values(components.parameters ?? {})) {
    visit(parameter.schema);
    if (
      parameter.schema &&
      ['string', 'integer'].includes(parameter.schema.type)
    )
      parameterShapes.add(JSON.stringify(parameter.schema));
  }
  let ordinal = 0;
  for (const [key, entries] of occurrences) {
    if (entries.length < 2 && !parameterShapes.has(key)) continue;
    const name = `BrowserPrimitiveConstraint${++ordinal}`;
    if (components.schemas[name])
      throw new Error('Browser generation constraint name collision.');
    components.schemas[name] = JSON.parse(key);
    for (const schema of entries) {
      for (const field of Object.keys(schema)) delete schema[field];
      schema.$ref = `#/components/schemas/${name}`;
    }
  }
}

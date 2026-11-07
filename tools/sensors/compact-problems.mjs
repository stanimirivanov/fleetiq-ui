/** Share generated response dispatch for operations whose error aliases all
 * decode the same Problem schema. Keep the exact status set and original tags.
 */
export function compactGeneratedProblems(source) {
  const aliases = new Set(
    Array.from(
      source.matchAll(/^export const (\w+) = Problem$/gmu),
      ([, alias]) => alias,
    ),
  );
  const row = /^ {6}"([45]\d\d)": decodeError\("(\w+)", (\w+)\),$/gmu;
  const blocks = /(?:^ {6}"[45]\d\d": decodeError\("\w+", \w+\),\n){2,}/gmu;
  const compacted = source.replace(blocks, (block) => {
    const entries = Array.from(block.matchAll(row));
    const prefix = entries[0][2].slice(0, -3);
    if (
      !entries.every(
        ([, status, tag, schema]) =>
          tag === prefix + status && tag === schema && aliases.has(schema),
      )
    )
      return block;
    return (
      '      ...decodeProblems(' +
      JSON.stringify(prefix) +
      ', [' +
      entries.map(([, status]) => status).join(', ') +
      ']),\n'
    );
  });
  if (compacted === source) return source;
  const anchor = '  return {\n    httpClient,';
  if (compacted.split(anchor).length !== 2 || source.includes('decodeProblems'))
    throw new Error('Generated problem dispatch changed; review compaction.');
  const tag = '`${Prefix}${Status}`';
  const responses = compacted.replace(
    /withResponse\((options(?:\?\.|\.)config)\)\(HttpClientResponse\.matchStatus\(\{\n {6}"2xx": decodeSuccess\((\w+)\),\n {6}\.\.\.decodeProblems\(("(?:\w+)"), (\[[\d, ]+\])\),\n {6}orElse: unexpectedStatus\n {4}\}\)\)/gu,
    'respond($1, $2, $3, $4)',
  );
  const paths = responses.replaceAll(
    '"/api/v1/tenants/" +',
    'tenantPathPrefix +',
  );
  const markers = paths.replace(
    /HttpClientRequest\.setHeaders\(\{ "Origin": (options(?:\?\.|\.)params)\?\.\["Origin"\] \?\? undefined, "X-FleetIQ-CSRF": \1\?\.\["X-FleetIQ-CSRF"\] \?\? undefined \}\)/gu,
    'mutationHeaders($1)',
  );
  return markers.replace(
    anchor,
    [
      '  function decodeProblems<Prefix extends string, Status extends number>(prefix: Prefix, statuses: readonly Status[]) {',
      '    const entries = statuses.map((status) =>',
      '      [status, decodeError((prefix + status) as ' +
        tag +
        ', Problem)] as const',
      '    );',
      '    return Object.fromEntries(entries) as Record<Status, (typeof entries)[number][1]>;',
      '  }',
      ...(paths !== responses
        ? ['  const tenantPathPrefix = "/api/v1/tenants/"']
        : []),
      ...(responses !== compacted
        ? [
            '  function respond(config: OperationConfig | undefined, schema: Schema.ConstraintDecoder<unknown, never>, prefix: string, statuses: readonly number[]) {',
            '    return withResponse(config)(HttpClientResponse.matchStatus({',
            '      "2xx": decodeSuccess(schema),',
            '      ...decodeProblems(prefix, statuses),',
            '      orElse: unexpectedStatus',
            '    }))',
            '  }',
          ]
        : []),
      ...(markers !== paths
        ? [
            '  function mutationHeaders(params: { readonly Origin?: string | undefined; readonly "X-FleetIQ-CSRF"?: string | undefined } | undefined) {',
            '    return HttpClientRequest.setHeaders({ Origin: params?.Origin, "X-FleetIQ-CSRF": params?.["X-FleetIQ-CSRF"] })',
            '  }',
          ]
        : []),
      anchor,
    ].join('\n'),
  );
}

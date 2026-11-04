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
  return compacted.replace(
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
      anchor,
    ].join('\n'),
  );
}

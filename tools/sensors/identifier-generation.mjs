import { isDeepStrictEqual } from 'node:util';

// The published escaped control ranges are malformed, not an executable regex.
// Preserve the pinned bytes and translate only this reviewed shape to the Rust
// identifier invariant: bounded code points, no trim or Unicode Cc controls.
export const IDENTIFIER_PATTERN =
  '^(?!\\s)(?![\\s\\S]*\\s$)[^\\u0000-\\u001F\\u007F-\\u009F]+$';
const publishedPattern = '^(?!\\s)(?![\\s\\S]*\\s$)[^\\^@-\\^_\\u007F-\\^_]+$';
export function identifierGenerationPatch(spec) {
  return [
    [
      'AdministrationIdentifier',
      {
        type: 'string',
        minLength: 1,
        maxLength: 128,
        pattern: publishedPattern,
        description:
          'Exact opaque domain identifier; no surrounding whitespace or control characters.',
      },
    ],
    [
      'SemanticDefinitionName',
      {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        pattern: publishedPattern,
      },
    ],
  ].flatMap(([name, expected]) => {
    const schema = spec.components?.schemas?.[name];
    if (!schema) return [];
    if (!isDeepStrictEqual(schema, expected))
      throw new Error(
        'Administration identifier generation constraint changed; review its domain translation.',
      );
    return [
      {
        op: 'replace',
        path: `/components/schemas/${name}`,
        value: { ...schema, pattern: IDENTIFIER_PATTERN },
      },
    ];
  });
}

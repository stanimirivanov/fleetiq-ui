import type { DefinitionRef } from './metadata';
import { isMillis, isToken } from './property-evidence';
export const evidenceKeys = [
  'property',
  'property_version',
  'history_start',
  'history_end',
  'history_after',
  'interpretation',
] as const;
export type EvidenceSelection =
  | { readonly kind: 'invalid' }
  | {
      readonly kind: 'ready';
      readonly property: DefinitionRef | null;
      readonly start: string;
      readonly end: string;
      readonly after?: string;
      readonly interpretation?: string;
    };
/** Explicit URL scope; invalid/duplicate/partial selections never silently fall back. */
export function readEvidenceQuery(
  search: string,
  properties: readonly DefinitionRef[],
  defaultEnd: number,
): EvidenceSelection {
  const p = new URLSearchParams(search);
  if (evidenceKeys.some((k) => p.getAll(k).length > 1))
    return { kind: 'invalid' };
  const id = p.get('property'),
    version = p.get('property_version');
  if ((id === null) !== (version === null)) return { kind: 'invalid' };
  const selected =
    id === null
      ? (properties[0] ?? null)
      : properties.find(
          (ref) => ref.id === id && String(ref.version) === version,
        );
  if (id !== null && !selected) return { kind: 'invalid' };
  const start = p.get('history_start') ?? String(BigInt(defaultEnd) - 3600000n),
    end = p.get('history_end') ?? String(defaultEnd);
  if (
    p.has('history_start') !== p.has('history_end') ||
    !isMillis(start) ||
    !isMillis(end) ||
    BigInt(end) <= BigInt(start) ||
    BigInt(end) - BigInt(start) > 604800000n
  )
    return { kind: 'invalid' };
  const after = p.get('history_after'),
    interpretation = p.get('interpretation');
  if (
    (after !== null && !isToken(after)) ||
    (interpretation !== null && !isToken(interpretation))
  )
    return { kind: 'invalid' };
  return {
    kind: 'ready',
    property: selected ?? null,
    start,
    end,
    ...(after === null ? {} : { after }),
    ...(interpretation === null ? {} : { interpretation }),
  };
}

import type { AssetReadOptions } from './asset-catalogue';
import { isValidAssetIdentifier } from './asset-catalogue';
import {
  type DefinitionRef,
  type ExternalIdentifier,
  isDefinitionVersion,
  isRevision,
} from './metadata';
export interface DefinitionPage {
  readonly definitions: readonly (DefinitionRef & { readonly name: string })[];
  readonly next: DefinitionRef | null;
}
export interface AssetDraft {
  readonly id: string;
  readonly name: string;
  readonly asset_type: DefinitionRef;
  readonly external_identifiers: readonly ExternalIdentifier[];
}
export interface RelationshipDraft {
  readonly relationship_type: DefinitionRef;
  readonly source_asset_id: string;
  readonly target_asset_id: string;
  readonly effective_interval: {
    readonly start_ms: number;
    readonly end_ms: number | null;
  };
}
export interface CommandReceipt {
  readonly outcome: string;
  readonly actor: string;
  readonly recordedAt: number;
  readonly id?: string;
  readonly revision?: string;
}
export interface CommissioningGateway {
  types(
    tenant: string,
    kind: 'asset' | 'relationship',
    after: DefinitionRef | null,
    options?: AssetReadOptions,
  ): Promise<DefinitionPage>;
  register(
    tenant: string,
    draft: AssetDraft,
    options?: AssetReadOptions,
  ): Promise<CommandReceipt>;
  append(
    tenant: string,
    id: string,
    revision: string,
    draft: RelationshipDraft,
    options?: AssetReadOptions,
  ): Promise<CommandReceipt>;
}
export const validReference = (r: DefinitionRef) =>
  commandIdentifier(r.id) && isDefinitionVersion(r.version);
export function validAssetDraft(d: AssetDraft): boolean {
  return (
    commandIdentifier(d.id) &&
    d.name.trim().length > 0 &&
    d.name.length <= 256 &&
    validReference(d.asset_type) &&
    new TextEncoder().encode(JSON.stringify(d)).byteLength <= 32768 &&
    d.external_identifiers.length <= 100 &&
    d.external_identifiers.every(
      (i) =>
        commandIdentifier(i.kind) &&
        commandIdentifier(i.value) &&
        (i.authority === null || commandIdentifier(i.authority)),
    ) &&
    new Set(
      d.external_identifiers.map((i) =>
        JSON.stringify([i.kind, i.authority, i.value]),
      ),
    ).size === d.external_identifiers.length
  );
}
/** Input is explicit integer milliseconds. Reject unsafe precision rather than rounding int64 values. */
export function exactMillis(text: string): number | null {
  if (!/^(?:0|-?[1-9][0-9]*)$/u.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : null;
}
export function validRelationship(
  id: string,
  revision: string,
  d: RelationshipDraft,
): boolean {
  return (
    commandIdentifier(id) &&
    isRevision(revision) &&
    validReference(d.relationship_type) &&
    commandIdentifier(d.source_asset_id) &&
    commandIdentifier(d.target_asset_id) &&
    Number.isSafeInteger(d.effective_interval.start_ms) &&
    (d.effective_interval.end_ms === null ||
      (Number.isSafeInteger(d.effective_interval.end_ms) &&
        d.effective_interval.end_ms > d.effective_interval.start_ms))
  );
}

export function commandIdentifier(value: string): boolean {
  return isValidAssetIdentifier(value) && !/\s/u.test(value);
}

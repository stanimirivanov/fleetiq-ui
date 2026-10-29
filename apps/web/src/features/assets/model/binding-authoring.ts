import type { AssetReadOptions } from './asset-catalogue';
import {
  type CommandReceipt,
  commandIdentifier,
  validReference,
} from './commissioning';
import { type DefinitionRef, isRevision } from './metadata';
export interface BindingSource {
  readonly device_asset_id: string;
  readonly endpoint_id: string;
  readonly signal_id: string;
}
export interface BindingDraft {
  readonly source: BindingSource;
  readonly target: {
    readonly asset_id: string;
    readonly property: DefinitionRef;
  };
  readonly effective_interval: {
    readonly start_ms: number;
    readonly end_ms: number | null;
  };
}
export interface BindingFact extends BindingDraft {
  readonly id: string;
  readonly tenantId: string;
  readonly revision: string;
  readonly recordedAt: number;
}
export interface RegisteredEndpoints {
  readonly endpoints: readonly { readonly id: string; readonly kind: string }[];
}
export interface ObservedSources {
  readonly observedAt: number;
  readonly truncated: boolean;
  readonly sources: readonly {
    readonly endpoint_id: string;
    readonly signal_id: string;
    readonly package_id: string;
    readonly package_version: string;
  }[];
}
export interface BindingGateway {
  device(
    tenant: string,
    id: string,
    options?: AssetReadOptions,
  ): Promise<RegisteredEndpoints>;
  observed(
    tenant: string,
    id: string,
    options?: AssetReadOptions,
  ): Promise<ObservedSources>;
  append(
    tenant: string,
    id: string,
    revision: string,
    draft: BindingDraft,
    options?: AssetReadOptions,
  ): Promise<CommandReceipt>;
  exact(
    tenant: string,
    id: string,
    revision: string,
    options?: AssetReadOptions,
  ): Promise<BindingFact>;
}
/** Binding eligibility is exact membership; no property name, kind or latest-version inference. */
export function supportedProperty(
  properties: readonly DefinitionRef[],
  ref: DefinitionRef,
): boolean {
  return properties.some((p) => p.id === ref.id && p.version === ref.version);
}
export function validBinding(
  id: string,
  revision: string,
  d: BindingDraft,
): boolean {
  return (
    commandIdentifier(id) &&
    isRevision(revision) &&
    [d.source.device_asset_id, d.source.endpoint_id, d.source.signal_id].every(
      commandIdentifier,
    ) &&
    commandIdentifier(d.target.asset_id) &&
    validReference(d.target.property) &&
    Number.isSafeInteger(d.effective_interval.start_ms) &&
    (d.effective_interval.end_ms === null ||
      (Number.isSafeInteger(d.effective_interval.end_ms) &&
        d.effective_interval.end_ms > d.effective_interval.start_ms))
  );
}

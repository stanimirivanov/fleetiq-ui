/** Device commissioning ports are independent of transport, identity and presentation. */
export interface Scope {
  readonly tenant: string;
  readonly device: string;
  readonly channel: string;
}
export interface Endpoint {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
}
export interface Identifier {
  readonly kind: string;
  readonly authority: string | null;
  readonly value: string;
}
export interface AssetDraft {
  readonly id: string;
  readonly name: string;
  readonly asset_type: { readonly id: string; readonly version: number };
  readonly external_identifiers: readonly Identifier[];
}
export interface Receipt {
  readonly outcome: 'registered' | 'already_registered';
  readonly registered_by: string;
  readonly recorded_at_ms: number;
}
export interface Device {
  readonly tenant_id: string;
  readonly asset_id: string;
  readonly endpoints: readonly Endpoint[];
}
export interface Selection {
  readonly package_id: string;
  readonly package_version: string;
  readonly world: 'identity-v1' | 'runtime-v1';
}
export interface Route {
  readonly device_asset_id: string;
  readonly channel_id: string;
  readonly revision: number;
  readonly selection: Selection | null;
  readonly policy_version: number | null;
  readonly actor_id: string;
  readonly recorded_at_ms: number;
}
export interface Release {
  readonly package_id: string;
  readonly package_version: string;
  readonly artifact_sha256: string;
  readonly artifact_size_bytes: number;
}
export interface Definition {
  readonly id: string;
  readonly version: number;
  readonly name: string;
}
export interface DefinitionPage {
  readonly definitions: readonly Definition[];
  readonly next_after: { readonly id: string; readonly version: number } | null;
}
export interface AssetPage {
  readonly assets: readonly { readonly id: string; readonly name: string }[];
  readonly next_after: string | null;
}
export type Processing =
  | 'accepted'
  | 'queued'
  | 'leased'
  | 'expired'
  | 'poisoned'
  | 'decoded';
export interface Diagnostics {
  readonly observed_at_ms: number;
  readonly connection_liveness: 'not_observed';
  readonly worker_liveness: 'not_observed';
  readonly coverage: {
    readonly frame_limit: 64;
    readonly output_limit_per_frame: 64;
    readonly source_limit: 128;
    readonly frames_truncated: boolean;
    readonly observations_truncated: boolean;
    readonly sources_truncated: boolean;
  };
  readonly frames: readonly {
    readonly message_id: string;
    readonly package_id: string;
    readonly package_version: string;
    readonly received_at_ms: number;
    readonly processing: Processing;
    readonly observation_count: number | null;
  }[];
  readonly sources: readonly {
    readonly package_id: string;
    readonly package_version: string;
    readonly endpoint_id: string;
    readonly signal_id: string;
  }[];
}
export interface Options {
  readonly signal?: AbortSignal;
}
export interface DeviceGateway {
  assets(
    tenant: string,
    after: string | undefined,
    options?: Options,
  ): Promise<AssetPage>;
  types(
    tenant: string,
    after: DefinitionPage['next_after'],
    options?: Options,
  ): Promise<DefinitionPage>;
  device(scope: Scope, options?: Options): Promise<Device>;
  diagnostics(scope: Scope, options?: Options): Promise<Diagnostics>;
  route(scope: Scope, options?: Options): Promise<Route>;
  release(
    selection: Selection,
    tenant: string,
    options?: Options,
  ): Promise<Release>;
  registerAsset(
    tenant: string,
    draft: AssetDraft,
    options?: Options,
  ): Promise<Receipt>;
  registerDevice(
    scope: Scope,
    endpoints: readonly Endpoint[],
    options?: Options,
  ): Promise<Receipt>;
  changeRoute(
    scope: Scope,
    expected: number,
    selection: Selection | null,
    options?: Options,
  ): Promise<Route>;
}
/** Opaque IDs preserve case and Unicode; IMEI is an external identifier, never authentication. */
export function validText(value: string, maximum = 128): boolean {
  return (
    value.length > 0 &&
    [...value].length <= maximum &&
    value.trim() === value &&
    ![...value].some((c) => {
      const code = c.codePointAt(0) ?? 0;
      return code < 32 || (code >= 127 && code <= 159);
    })
  );
}
export function validAsset(draft: AssetDraft): boolean {
  return (
    validText(draft.id) &&
    validText(draft.name, 200) &&
    validText(draft.asset_type.id) &&
    Number.isInteger(draft.asset_type.version) &&
    draft.asset_type.version >= 1 &&
    draft.asset_type.version <= 4294967295 &&
    draft.external_identifiers.length <= 100 &&
    draft.external_identifiers.every(
      (i) =>
        validText(i.kind) &&
        validText(i.value) &&
        (i.authority === null || validText(i.authority)),
    ) &&
    new Set(
      draft.external_identifiers.map((i) =>
        JSON.stringify([i.kind, i.authority, i.value]),
      ),
    ).size === draft.external_identifiers.length
  );
}
export function validEndpoints(endpoints: readonly Endpoint[]): boolean {
  return (
    endpoints.length <= 100 &&
    endpoints.every(
      (e) => validText(e.id) && validText(e.kind) && validText(e.name, 200),
    ) &&
    new Set(endpoints.map((e) => e.id)).size === endpoints.length
  );
}
export function deviceQuery(search: string) {
  const p = new URLSearchParams(search);
  const values = ['tenant', 'device', 'channel'].map(
    (key) => p.get(key) ?? (key === 'channel' ? 'tcp' : ''),
  );
  return {
    tenant: values[0] ?? '',
    device: values[1] ?? '',
    channel: values[2] ?? 'tcp',
    valid:
      validDevicePages(search) &&
      [
        'tenant',
        'device',
        'channel',
        'asset_after',
        'type_after_id',
        'type_after_version',
      ].every((key) => p.getAll(key).length <= 1) &&
      values.every(
        (v, i) =>
          (i !== 2 && v === '') ||
          (validText(v) && (i !== 2 || /^[A-Za-z0-9_.-]+$/u.test(v))),
      ),
  };
}

export function validDevicePages(search: string): boolean {
  const p = new URLSearchParams(search),
    asset = p.get('asset_after'),
    id = p.get('type_after_id'),
    version = p.get('type_after_version');
  return (
    ['asset_after', 'type_after_id', 'type_after_version'].every(
      (k) => p.getAll(k).length <= 1,
    ) &&
    (asset === null || validText(asset)) &&
    ((id === null && version === null) ||
      (id !== null &&
        version !== null &&
        validText(id) &&
        /^[1-9][0-9]{0,9}$/u.test(version) &&
        Number(version) <= 4294967295))
  );
}
export function deviceHref(
  search: string,
  changes: Readonly<Record<string, string | undefined>>,
): string {
  const p = new URLSearchParams(search);
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) p.delete(key);
    else p.set(key, value);
  }
  return `/devices?${p}`;
}

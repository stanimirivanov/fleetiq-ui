/** Explicit backend grants; no action implies another action. */
export type TenantAction =
  | 'access.manage'
  | 'metadata.manage'
  | 'metadata.read'
  | 'telemetry.read'
  | 'protocol.manage';

export interface OperatorTenant {
  readonly id: string;
  readonly actions: readonly TenantAction[];
}
export interface OperatorTenantPage {
  readonly tenants: readonly OperatorTenant[];
  readonly nextAfter: string | null;
}
export interface OperatorTenantRequest {
  readonly limit: number;
  readonly after?: string;
}
export interface OperatorTenantReader {
  list(
    request: OperatorTenantRequest,
    options?: { readonly signal?: AbortSignal },
  ): Promise<OperatorTenantPage>;
}

/** Match identifier bounds without reproducing database collation in JavaScript. */
export function isValidTenantId(value: string): boolean {
  return (
    value.length > 0 &&
    [...value].length <= 128 &&
    value.trim() === value &&
    ![...value].some((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code < 32 || code === 127;
    })
  );
}

/** A duplicated cursor is invalid URL context, not an instruction to guess a page. */
export function tenantDiscoveryCursor(
  search: string,
): string | undefined | null {
  const values = new URLSearchParams(search).getAll('tenant_after');
  if (values.length === 0) return undefined;
  return values.length === 1 && isValidTenantId(values[0] ?? '')
    ? values[0]
    : null;
}

/** A page is not a complete grant inventory unless it starts and ends the traversal. */
export function metadataReadHint(
  page: OperatorTenantPage,
  selected: string,
  after?: string,
): 'allowed' | 'restricted' | 'unknown' | 'empty' {
  const tenant = page.tenants.find((entry) => entry.id === selected);
  if (tenant)
    return tenant.actions.includes('metadata.read') ? 'allowed' : 'restricted';
  if (
    after === undefined &&
    page.tenants.length === 0 &&
    page.nextAfter === null
  )
    return 'empty';
  return 'unknown';
}

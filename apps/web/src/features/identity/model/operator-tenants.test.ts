import { expect, test } from 'vitest';
import {
  isValidTenantId,
  metadataReadHint,
  tenantDiscoveryCursor,
} from './operator-tenants';

test('tenant cursor is explicit, bounded and unambiguous', () => {
  expect(tenantDiscoveryCursor('?tenant=tenant-a')).toBeUndefined();
  expect(tenantDiscoveryCursor('?tenant_after=tenant-a')).toBe('tenant-a');
  for (const search of [
    '?tenant_after=',
    '?tenant_after=a&tenant_after=b',
    '?tenant_after=%00',
    '?tenant_after=%20a',
  ]) {
    expect(tenantDiscoveryCursor(search)).toBeNull();
  }
  expect(isValidTenantId('é'.repeat(128))).toBe(true);
  expect(isValidTenantId('é'.repeat(129))).toBe(false);
  expect(isValidTenantId('x\u007f')).toBe(false);
});

test('exact grants, not implied permissions or absence from a partial page', () => {
  const page = {
    tenants: [
      {
        id: 'manage-only',
        actions: ['metadata.manage', 'access.manage'] as const,
      },
      { id: 'reader', actions: ['metadata.read'] as const },
    ],
    nextAfter: 'reader',
  };
  expect(metadataReadHint(page, 'manage-only')).toBe('restricted');
  expect(metadataReadHint(page, 'reader')).toBe('allowed');
  expect(metadataReadHint(page, 'elsewhere')).toBe('unknown');
  expect(
    metadataReadHint(
      { tenants: [], nextAfter: null },
      'elsewhere',
      'revoked-cursor',
    ),
  ).toBe('unknown');
  expect(metadataReadHint({ tenants: [], nextAfter: null }, 'elsewhere')).toBe(
    'empty',
  );
});

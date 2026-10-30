import { expect, test } from 'vitest';
import { alertHref, alertQuery, alertTenantHref } from './alert-query';
import { identifier, lifecycle, millis } from './connected-alerts';

test('validates bounded URL scope and exact identities before a request', () => {
  expect(
    alertQuery(
      '?tenant=tenant-a&rule=rule&revision=2&phase=firing&after=v1.00',
    ),
  ).toMatchObject({
    invalid: false,
    tenant: 'tenant-a',
    rule: 'rule',
    revision: 2,
    phase: 'firing',
  });
  for (const q of [
    '?tenant=..',
    '?tenant=x&tenant=y',
    '?phase=unknown',
    '?tenant=x&after=bad',
    '?tenant=x&rule=a',
    '?tenant=x&revision=1',
    '?tenant=x&rule=a&revision=01',
    '?tenant=x&rule=a&revision=4294967296',
    '?tenant=x&evaluation=e',
    '?outputs_after=v1.00',
    '?rule=a&revision=1',
    `?tenant=x&after=v1.${'00'.repeat(5000)}`,
  ])
    expect(alertQuery(q).invalid, q).toBe(true);
  expect(identifier('device/温度')).toBe(true);
  expect(identifier('\ud800')).toBe(false);
  expect(identifier('\u0080')).toBe(false);
  expect(millis('-9223372036854775808')).toBe(true);
  expect(millis('9223372036854775808')).toBe(false);
  expect(millis('-0')).toBe(false);
  expect(lifecycle('9007199254740993')).toBe(true);
});
test('tenant switches clear owned evidence/cursors and retain phase and discovery position', () => {
  const href = alertTenantHref(
    '?tenant=a&phase=firing&tenant_after=tenant-p&after=v1.00&rule=r&revision=1&history_after=v1.01&evaluation=e&outputs_after=v1.02',
    'b',
  );
  expect(href).toBe('/alerts?tenant=b&phase=firing&tenant_after=tenant-p');
  expect(alertHref('?tenant=a', { tenant: undefined })).toBe('/alerts');
});

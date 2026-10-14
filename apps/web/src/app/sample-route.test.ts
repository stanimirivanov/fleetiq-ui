import { expect, test } from 'vitest';
import { isDevelopmentSampleRoute, navigationHref } from './sample-route';

test('sample status is restricted to exact development preview routes', () => {
  expect(isDevelopmentSampleRoute('/', '', true)).toBe(true);
  expect(isDevelopmentSampleRoute('/alerts', '?preview=sample', true)).toBe(
    true,
  );
  expect(isDevelopmentSampleRoute('/alerts', '?preview=sample', false)).toBe(
    false,
  );
  expect(
    isDevelopmentSampleRoute('/alerts/missing', '?preview=sample', true),
  ).toBe(false);
  expect(isDevelopmentSampleRoute('/alerts', '', true)).toBe(false);
  expect(
    isDevelopmentSampleRoute('/assets/asset-004', '?preview=sample', true),
  ).toBe(true);
  expect(
    isDevelopmentSampleRoute(
      '/assets/registry/review',
      '?preview=sample',
      true,
    ),
  ).toBe(true);
});

test('primary links opt into only available development previews', () => {
  expect(navigationHref('/alerts', true)).toBe('/alerts?preview=sample');
  expect(navigationHref('/assets', true)).toBe('/assets?preview=sample');
  expect(navigationHref('/map', true)).toBe('/map?preview=sample');
  expect(navigationHref('/alerts', false)).toBe('/alerts');
  expect(navigationHref('/', true)).toBe('/');
});

test('connected asset navigation preserves review context and never opts into samples', () => {
  expect(
    navigationHref(
      '/assets',
      false,
      '?tenant=tenant-a&after=asset-1&q=machine',
    ),
  ).toBe('/assets?tenant=tenant-a');
  expect(navigationHref('/assets', false, '?preview=sample')).toBe('/assets');
});

test('shell catalogue links preserve both explicit review times but clear selection cursors', () => {
  expect(
    navigationHref(
      '/assets',
      false,
      '?tenant=tenant-a&effective_at_ms=1500&known_at_ms=2500&source_after=binding-1',
    ),
  ).toBe('/assets?tenant=tenant-a&effective_at_ms=1500&known_at_ms=2500');
});

test('catalogue navigation preserves the bounded tenant-discovery cursor independently of asset cursors', () => {
  expect(
    navigationHref(
      '/assets',
      false,
      '?tenant=tenant-b&tenant_after=tenant-a&after=asset-1&q=old',
    ),
  ).toBe('/assets?tenant=tenant-b&tenant_after=tenant-a');
});

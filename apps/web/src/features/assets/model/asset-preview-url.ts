import { isValidAssetIdentifier } from './asset-catalogue';

/** Explicit development preview route state, kept independent of Solid Router. */
export function isAssetSamplePreview(
  pathname: string,
  search: string,
): boolean {
  return (
    pathname === '/assets' &&
    new URLSearchParams(search).get('preview') === 'sample'
  );
}

export type AssetPreviewCursor =
  | { readonly kind: 'first' }
  | { readonly kind: 'page'; readonly after: string }
  | { readonly kind: 'invalid' };

/** Rejects duplicate or malformed cursors before a reader invocation. */
export function readAssetPreviewCursor(search: string): AssetPreviewCursor {
  const values = new URLSearchParams(search).getAll('after');
  if (values.length === 0) return { kind: 'first' };
  const after = values[0];
  if (values.length !== 1 || !after || !isValidAssetIdentifier(after)) {
    return { kind: 'invalid' };
  }
  return { kind: 'page', after };
}

/** Constructs the shareable first or forward page URL. */
export function assetSamplePreviewHref(after?: string): string {
  const params = new URLSearchParams({ preview: 'sample' });
  if (after !== undefined) params.set('after', after);
  return `/assets?${params.toString()}`;
}

/** Development inspector activation requires both a detail path and opt-in. */
export function isAssetInspectorSamplePreview(
  pathname: string,
  search: string,
): boolean {
  return (
    /^\/assets\/[^/]+$/u.test(pathname) &&
    new URLSearchParams(search).get('preview') === 'sample'
  );
}

/** Encodes an asset identity without leaking sample mode into production URLs. */
export function assetInspectorSampleHref(assetId: string): string {
  return `/assets/${encodeURIComponent(assetId)}?preview=sample`;
}

/** The schematic map preview is an explicit development-only route state. */
export function isMapSamplePreview(pathname: string, search: string): boolean {
  return (
    pathname === '/map' &&
    new URLSearchParams(search).get('preview') === 'sample'
  );
}

/** The read-only registry sample requires an exact route and development opt-in. */
export function isRegistrySamplePreview(
  pathname: string,
  search: string,
): boolean {
  const previews = new URLSearchParams(search).getAll('preview');
  return (
    pathname === '/assets/registry/review' &&
    previews.length === 1 &&
    previews[0] === 'sample'
  );
}

/** Constructs a sample registry URL with an optional selected asset. */
export function registrySampleHref(assetId?: string): string {
  const parameters = new URLSearchParams({ preview: 'sample' });
  if (assetId !== undefined) parameters.set('asset', assetId);
  return `/assets/registry/review?${parameters.toString()}`;
}

/** The overview sample follows the same explicit development opt-in as other views. */
export function isOverviewSamplePreview(
  pathname: string,
  search: string,
): boolean {
  const values = new URLSearchParams(search).getAll('preview');
  return pathname === '/' && values.length === 1 && values[0] === 'sample';
}

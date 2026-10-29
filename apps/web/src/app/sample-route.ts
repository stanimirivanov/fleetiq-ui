import { isAlertsSamplePreview } from '#features/alerts';
import {
  fleetWorkspaceHref,
  isAssetInspectorSamplePreview,
  isAssetSamplePreview,
  isMapSamplePreview,
  isOverviewSamplePreview,
  isRegistrySamplePreview,
} from '#features/assets';
import { APP_ROUTES } from './route-metadata';

/** App-shell source status follows the exact development sample routes. */
export function isDevelopmentSampleRoute(
  pathname: string,
  search: string,
  development: boolean,
): boolean {
  return (
    development &&
    (isOverviewSamplePreview(pathname, search) ||
      isAssetSamplePreview(pathname, search) ||
      isAssetInspectorSamplePreview(pathname, search) ||
      isMapSamplePreview(pathname, search) ||
      isRegistrySamplePreview(pathname, search) ||
      isAlertsSamplePreview(pathname, search))
  );
}

/** Primary navigation opts into available previews only in development. */
export function navigationHref(
  pathname: string,
  development: boolean,
  currentSearch = '',
): string {
  if (
    development &&
    new URLSearchParams(currentSearch).get('preview') === 'sample' &&
    (pathname === APP_ROUTES.overview.path ||
      pathname === APP_ROUTES.assets.path ||
      pathname === APP_ROUTES.map.path ||
      pathname === APP_ROUTES.alerts.path)
  ) {
    return `${pathname}?preview=sample`;
  }
  if (pathname === APP_ROUTES.overview.path || pathname === APP_ROUTES.map.path)
    return fleetWorkspaceHref(pathname, currentSearch);
  if (pathname === APP_ROUTES.assets.path) {
    const current = new URLSearchParams(currentSearch);
    const context = new URLSearchParams();
    for (const key of [
      'tenant',
      'tenant_after',
      'effective_at_ms',
      'known_at_ms',
    ]) {
      const value = current.get(key);
      if (value !== null) context.set(key, value);
    }
    if (context.size > 0) return `${pathname}?${context}`;
  }
  return pathname;
}

/** Route and navigation copy is owned by the application composition layer. */
export const APP_ROUTES = {
  overview: { path: '/', title: 'Fleet overview', navigationLabel: 'Overview' },
  map: { path: '/map', title: 'Fleet map', navigationLabel: 'Map' },
  assets: { path: '/assets', title: 'Assets', navigationLabel: 'Assets' },
  devices: {
    path: '/devices',
    title: 'Devices & ingestion',
    navigationLabel: 'Devices',
  },
  alerts: {
    path: '/alerts',
    title: 'Alerts & evidence',
    navigationLabel: 'Alerts',
  },
  assetInspector: { path: '/assets/:assetId', title: 'Asset inspector' },
  registry: { path: '/assets/registry/review', title: 'Asset registry' },
  designSystem: {
    path: '/design-system',
    title: 'Design system',
    navigationLabel: 'Design system',
  },
} as const;

/** Unavailable destinations make the intended workspace shape visible without dead links. */
export const PRIMARY_NAVIGATION = [
  {
    heading: 'Workspace',
    items: [
      { kind: 'route', route: APP_ROUTES.overview, icon: 'overview' },
      { kind: 'route', route: APP_ROUTES.map, icon: 'map' },
      { kind: 'route', route: APP_ROUTES.assets, icon: 'assets' },
      { kind: 'route', route: APP_ROUTES.devices, icon: 'devices' },
      { kind: 'route', route: APP_ROUTES.alerts, icon: 'alerts' },
      { kind: 'planned', label: 'Insights', icon: 'insights' },
    ],
  },
  {
    heading: 'Settings',
    items: [
      { kind: 'planned', label: 'Admin', icon: 'admin' },
      { kind: 'route', route: APP_ROUTES.designSystem, icon: 'design' },
    ],
  },
] as const;

export function routeTitle(pathname: string): string {
  if (/^\/assets\/[^/]+$/u.test(pathname)) {
    return APP_ROUTES.assetInspector.title;
  }
  return (
    Object.values(APP_ROUTES).find((route) => route.path === pathname)?.title ??
    'Page not found'
  );
}

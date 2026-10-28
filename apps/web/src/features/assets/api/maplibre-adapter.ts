import {
  Map as GeographicMap,
  type GeoJSONSource,
  NavigationControl,
  type StyleSpecification,
  setWorkerCount,
  setWorkerUrl,
} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FleetAsset } from '../model/fleet';
import { ownedMapResource, validateMapStyle } from '../model/map-resource';
export interface MapOwner {
  update(assets: readonly FleetAsset[], selected: string | null): void;
  dispose(): void;
}
/** Exact privileged SDK boundary. No global prewarm or externally hosted resources. */
export function mountFleetMap(
  container: HTMLElement,
  select: (id: string) => void,
  status: (message: string) => void,
): MapOwner {
  const worker = new URL(workerUrl, window.location.href);
  if (
    worker.origin !== window.location.origin ||
    (!worker.pathname.startsWith('/assets/') && !import.meta.env.DEV)
  )
    throw new Error('Unowned map worker');
  setWorkerUrl(worker.href);
  setWorkerCount(1);
  const map = new GeographicMap({
    container,
    style: {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 'background-color': '#dfe8eb' },
        },
      ],
    },
    center: [0, 25],
    zoom: 1,
    attributionControl: { compact: true },
    maxTileCacheSize: 64,
    renderWorldCopies: false,
    transformRequest: (url) => ({
      url: ownedMapResource(url, window.location.origin),
      credentials: 'same-origin',
    }),
  });
  let disposed = false,
    rows: readonly FleetAsset[] = [],
    selectedId: string | null = null;
  let basemap = false,
    unavailable = false;
  let styleRequest: AbortController | undefined;
  const paint = () => {
    if (disposed || !map.isStyleLoaded()) return;
    if (!map.getSource('fleet')) {
      map.addSource('fleet', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'fleet-points',
        type: 'circle',
        source: 'fleet',
        paint: {
          'circle-radius': [
            'case',
            ['==', ['get', 'id'], selectedId ?? ''],
            9,
            6,
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'freshness'], 'fresh'],
            '#087f8c',
            '#b7791f',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });
    }
    const source = map.getSource('fleet');
    if (source)
      (source as GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: rows.flatMap((a) =>
          a.location.status === 'observed'
            ? [
                {
                  type: 'Feature' as const,
                  properties: {
                    id: a.id,
                    freshness: a.location.point.freshness,
                  },
                  geometry: {
                    type: 'Point' as const,
                    coordinates: [
                      Number(a.location.point.longitude),
                      Number(a.location.point.latitude),
                    ],
                  },
                },
              ]
            : [],
        ),
      });
    map.setPaintProperty('fleet-points', 'circle-radius', [
      'case',
      ['==', ['get', 'id'], selectedId ?? ''],
      9,
      6,
    ]);
  };
  const style = () => {
    if (disposed) return;
    const dark = document.documentElement.dataset.theme === 'dark';
    basemap = false;
    unavailable = false;
    let styleRequest: AbortController | undefined;
    status('Loading deployment basemap…');
    styleRequest?.abort();
    const controller = new AbortController();
    styleRequest = controller;
    void readMapStyle(
      `/maps/${dark ? 'dark' : 'light'}/style.json`,
      controller.signal,
    ).then(
      (value) => {
        if (!disposed && !controller.signal.aborted) map.setStyle(value);
      },
      () => {
        if (!disposed && !controller.signal.aborted) failed();
      },
    );
  };
  const loaded = () => {
    if (disposed) return;
    basemap = true;
    map.setProjection({ type: 'globe' });
    paint();
    if (!unavailable) status('Geodetic map · observed points only');
  };
  const failed = () => {
    if (disposed) return;
    unavailable = true;
    status(
      'Basemap unavailable. Positions and the accessible list remain available.',
    );
    if (!basemap)
      map.setStyle({
        version: 8,
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#dfe8eb' },
          },
        ],
      });
  };
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
  map.on('load', style);
  map.on('style.load', loaded);
  map.on('error', failed);
  const click = (e: { point: { x: number; y: number } }) => {
    const id = map.queryRenderedFeatures([e.point.x, e.point.y], {
      layers: ['fleet-points'],
    })[0]?.properties?.id;
    if (typeof id === 'string' && rows.some((a) => a.id === id)) select(id);
  };
  map.on('click', click);
  const resize = new ResizeObserver(() => {
    if (!disposed) map.resize();
  });
  resize.observe(container);
  const theme = new MutationObserver(style);
  theme.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return {
    update(assets, id) {
      rows = assets;
      const changed = selectedId !== id;
      selectedId = id;
      paint();
      const a = rows.find((a) => a.id === id);
      if (changed && a?.location.status === 'observed')
        map.jumpTo({
          center: [
            Number(a.location.point.longitude),
            Number(a.location.point.latitude),
          ],
          zoom: Math.max(map.getZoom(), 8),
        });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      styleRequest?.abort();
      rows = [];
      resize.disconnect();
      theme.disconnect();
      map.off('load', style);
      map.off('style.load', loaded);
      map.off('error', failed);
      map.off('click', click);
      map.remove();
    },
  };
}

/** Bounded deployment configuration read; native SDK tile requests remain URL-guarded. */
async function readMapStyle(
  path: string,
  signal: AbortSignal,
): Promise<StyleSpecification> {
  const response = await fetch(ownedMapResource(path, window.location.origin), {
    signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
    credentials: 'omit',
    redirect: 'error',
    cache: 'no-store',
  });
  if (
    !response.ok ||
    !response.headers.get('content-type')?.includes('application/json') ||
    !response.body
  ) {
    await response.body?.cancel();
    throw new Error('Map style unavailable');
  }
  const reader = response.body.getReader(),
    decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0,
    text = '';
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.length;
      if (bytes > 1048576) throw new Error('Map style exceeds limit');
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  return validateMapStyle(
    JSON.parse(text),
    window.location.origin,
  ) as unknown as StyleSpecification;
}

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  events: new Map<string, () => void>(),
  loaded: false,
  hasSource: false,
  projection: vi.fn(),
  setStyle: vi.fn(),
  remove: vi.fn(),
  disconnectResize: vi.fn(),
  disconnectTheme: vi.fn(),
  theme: () => {},
}));
vi.mock('maplibre-gl', () => ({
  Map: class {
    on(name: string, callback: () => void) {
      sdk.events.set(name, callback);
    }
    off(name: string) {
      sdk.events.delete(name);
    }
    addControl() {}
    remove = sdk.remove;
    setStyle = sdk.setStyle;
    setProjection = sdk.projection;
    isStyleLoaded() {
      return sdk.loaded;
    }
    getSource() {
      return sdk.hasSource ? { setData: () => {} } : undefined;
    }
    addSource() {
      sdk.hasSource = true;
    }
    addLayer() {}
    setPaintProperty() {}
  },
  NavigationControl: class {},
  setWorkerCount: vi.fn(),
  setWorkerUrl: vi.fn(),
}));
vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?url', () => ({
  default: '/assets/maplibre-gl-worker-fixture.mjs',
}));

import { mountFleetMap } from './maplibre-adapter';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  sdk.events.clear();
  sdk.loaded = false;
  sdk.hasSource = false;
});
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {
        sdk.disconnectResize();
      }
    },
  );
  vi.stubGlobal(
    'MutationObserver',
    class {
      constructor(callback: () => void) {
        sdk.theme = callback;
      }
      observe() {}
      disconnect() {
        sdk.disconnectTheme();
      }
    },
  );
});

test('superseded theme reads and disposal abort the actual owned style requests', () => {
  const signals: AbortSignal[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(async (_input, init) => {
      const signal = init?.signal;
      if (!signal) throw new Error('Expected cancellable style read');
      signals.push(signal);
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener(
          'abort',
          () => reject(new Error('Owned cancellation')),
          { once: true },
        );
      });
    }),
  );
  const owner = mountFleetMap(document.createElement('div'), vi.fn(), vi.fn());
  try {
    sdk.events.get('load')?.();
    expect(signals).toHaveLength(1);
    sdk.theme();
    expect(signals).toHaveLength(2);
    expect(signals[0]?.aborted).toBe(true);
    owner.dispose();
    expect(signals[1]?.aborted).toBe(true);
    owner.dispose();
    expect(sdk.remove).toHaveBeenCalledTimes(1);
    expect(sdk.disconnectResize).toHaveBeenCalledTimes(1);
    expect(sdk.disconnectTheme).toHaveBeenCalledTimes(1);
    expect(sdk.events.size).toBe(0);
  } finally {
    owner.dispose();
  }
});

test('ready follows deployed style, point source and SDK idle rather than initial style-load', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify({ version: 8, sources: {}, layers: [] }), {
          headers: { 'content-type': 'application/json' },
        }),
    ),
  );
  const status = vi.fn(),
    owner = mountFleetMap(document.createElement('div'), vi.fn(), status);
  try {
    sdk.events.get('style.load')?.();
    sdk.events.get('idle')?.();
    expect(status).not.toHaveBeenCalled();
    sdk.events.get('load')?.();
    await vi.waitFor(() => expect(sdk.setStyle).toHaveBeenCalledTimes(1));
    sdk.events.get('style.load')?.();
    expect(sdk.projection).toHaveBeenCalledWith({ type: 'globe' });
    expect(status).not.toHaveBeenCalledWith(
      'Geodetic map · observed points only',
    );
    sdk.loaded = true;
    sdk.events.get('idle')?.();
    expect(sdk.hasSource).toBe(true);
    expect(status).not.toHaveBeenCalledWith(
      'Geodetic map · observed points only',
    );
    sdk.events.get('idle')?.();
    expect(status).toHaveBeenLastCalledWith(
      'Geodetic map · observed points only',
    );
  } finally {
    owner.dispose();
  }
});

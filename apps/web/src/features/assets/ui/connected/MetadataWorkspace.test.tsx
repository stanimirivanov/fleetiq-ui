import { createMemoryHistory, MemoryRouter, Route } from '@solidjs/router';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { RequestFailure } from '#shared/model';
import type { AssetPage } from '../../model/asset-catalogue';
import type { MetadataReader } from '../../model/metadata';
import { ConnectedCatalogueView } from './ConnectedCatalogueView';
import { ConnectedInspectorView } from './ConnectedInspectorView';
import { MetadataReadContent } from './MetadataReadContent';
import { MetadataReaderProvider } from './MetadataReaderProvider';
import { useMetadataRead } from './useMetadataRead';

const context = '?tenant=tenant-a&effective_at_ms=1500&known_at_ms=2500';
const assets: AssetPage = {
  assets: [
    {
      id: 'asset-1',
      tenantId: 'tenant-a',
      name: 'Primary machine',
      assetType: { id: 'generic.machine', version: 2 },
    },
    {
      id: 'gateway-1',
      tenantId: 'tenant-a',
      name: 'Monitoring gateway',
      assetType: { id: 'generic.gateway', version: 1 },
    },
  ],
  nextAfter: 'gateway-1',
};

function readerWith(overrides: Partial<MetadataReader> = {}): MetadataReader {
  return {
    listPage: vi.fn(async () => assets),
    getAsset: vi.fn(async (request) => ({
      id: request.assetId,
      tenantId: request.tenantId,
      name: 'Primary machine',
      assetType: { id: 'generic.machine', version: 2 },
      externalIdentifiers: [
        { kind: 'serial', authority: 'manufacturer', value: 'machine-serial' },
      ],
    })),
    getAssetType: vi.fn(async (request) => ({
      id: request.id,
      version: request.version,
      name: 'Generic machine',
      supportedProperties: [{ id: 'electrical.voltage', version: 1 }],
    })),
    getProperty: vi.fn(async (request) => ({
      id: request.id,
      version: request.version,
      name: 'Voltage',
      valueKind: 'decimal' as const,
      canonicalUnit: 'V',
    })),
    getRelationshipType: vi.fn(async (request) => ({
      id: request.id,
      version: request.version,
      name: 'Contains',
    })),
    listRelationships: vi.fn(async (request) => ({
      assetId: request.assetId,
      effectiveAtMs: request.effectiveAtMs,
      knownAtMs: request.knownAtMs,
      relationships: [],
      nextAfter: null,
    })),
    listTargetBindings: vi.fn(async (request) => ({
      assetId: request.assetId,
      effectiveAtMs: request.effectiveAtMs,
      knownAtMs: request.knownAtMs,
      bindings: [],
      nextAfter: null,
    })),
    listSourceBindings: vi.fn(async (request) => ({
      source: request.source,
      effectiveAtMs: request.effectiveAtMs,
      knownAtMs: request.knownAtMs,
      bindings: [],
      nextAfter: null,
    })),
    ...overrides,
  };
}

function mountRoute(
  reader: MetadataReader,
  initial: string,
  view: () => JSX.Element,
) {
  const history = createMemoryHistory();
  history.set({ value: initial });
  const rendered = render(() => (
    <MemoryRouter
      history={history}
      root={(props) => (
        <MetadataReaderProvider reader={reader}>
          {props.children}
        </MetadataReaderProvider>
      )}
    >
      <Route path="*" component={view} />
    </MemoryRouter>
  ));
  return { ...rendered, history };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
beforeEach(() => vi.stubGlobal('scrollTo', vi.fn()));

test('requires tenant choice and initializes one explicit shared cutoff pair before reading', async () => {
  const reader = readerWith();
  const view = mountRoute(reader, '/assets', ConnectedCatalogueView);
  expect(reader.listPage).not.toHaveBeenCalled();
  expect(
    screen.getByText('Choose a tenant to open its metadata workspace.'),
  ).toBeTruthy();
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('textbox', { name: 'Tenant ID' }),
    'tenant-a',
  );
  await user.click(screen.getByRole('button', { name: 'Open tenant' }));
  await screen.findByRole('list', { name: 'Connected assets' });
  const params = new URLSearchParams(view.history.get().split('?')[1]);
  expect(params.get('tenant')).toBe('tenant-a');
  expect(params.get('effective_at_ms')).toBe(params.get('known_at_ms'));
  expect(Number.isSafeInteger(Number(params.get('known_at_ms')))).toBe(true);
  expect(reader.listPage).toHaveBeenCalledTimes(1);
});

test('invalid and partial time context sends no catalogue reads and remains editable', () => {
  const reader = readerWith();
  mountRoute(
    reader,
    '/assets?tenant=tenant-a&effective_at_ms=1500',
    ConnectedCatalogueView,
  );
  expect(screen.getByRole('alert').textContent).toContain(
    'Set both review times',
  );
  expect(
    screen.getByRole<HTMLInputElement>('textbox', { name: 'Tenant ID' }).value,
  ).toBe('tenant-a');
  expect(reader.listPage).not.toHaveBeenCalled();
});

test('filters locally while identity and page links retain exact URL review context', async () => {
  const reader = readerWith();
  const view = mountRoute(reader, `/assets${context}`, ConnectedCatalogueView);
  await screen.findByRole('list', { name: 'Connected assets' });
  const link = screen.getByRole('link', { name: 'Inspect Primary machine' });
  expect(link.getAttribute('href')).toBe(`/assets/asset-1${context}`);
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('searchbox', { name: 'Filter assets' }),
    'Primary',
  );
  expect(
    within(screen.getByRole('list', { name: 'Connected assets' })).getAllByRole(
      'listitem',
    ),
  ).toHaveLength(1);
  expect(reader.listPage).toHaveBeenCalledTimes(1);
  expect(view.history.get()).toContain('q=Primary');
  await user.clear(screen.getByRole('searchbox', { name: 'Filter assets' }));
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Asset type' }),
    'generic.gateway',
  );
  expect(
    screen.queryByRole('link', { name: 'Inspect Primary machine' }),
  ).toBeNull();
  expect(reader.listPage).toHaveBeenCalledTimes(1);
  const next = screen.getByRole('link', { name: 'Next page' });
  expect(next.getAttribute('href')).toContain('after=gateway-1');
  expect(next.getAttribute('href')).toContain('effective_at_ms=1500');
});

test('inspector loads exact identity/type references and defers property reads until disclosure', async () => {
  const reader = readerWith();
  mountRoute(reader, `/assets/asset-1${context}`, () => (
    <ConnectedInspectorView assetId="asset-1" />
  ));
  expect(
    await screen.findByRole('heading', { name: 'Primary machine' }),
  ).toBeTruthy();
  expect(await screen.findByText('machine-serial')).toBeTruthy();
  expect(reader.getAssetType).toHaveBeenCalledWith(
    { tenantId: 'tenant-a', id: 'generic.machine', version: 2 },
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  expect(reader.getProperty).not.toHaveBeenCalled();
  const disclosure = await screen.findByText('Property electrical.voltage v1');
  await userEvent.setup().click(disclosure);
  expect(await screen.findByText('Voltage')).toBeTruthy();
  expect(reader.getProperty).toHaveBeenCalledWith(
    { tenantId: 'tenant-a', id: 'electrical.voltage', version: 1 },
    expect.anything(),
  );
  expect(
    screen.getByRole('region', { name: 'Operational evidence' }).textContent,
  ).toContain('Unavailable');
  const registry = screen.getByRole('link', {
    name: 'Review registry mapping',
  });
  expect(registry.getAttribute('href')).toContain('asset=asset-1');
  expect(registry.getAttribute('href')).toContain('known_at_ms=2500');
});

test.each([
  'forbidden',
  'not-found',
  'invalid-response',
  'unavailable',
] as const)(
  'renders a distinct safe %s state instead of empty data',
  async (kind) => {
    const reader = readerWith({
      listPage: vi.fn(async () => {
        throw new RequestFailure(kind);
      }),
    });
    mountRoute(reader, `/assets${context}`, ConnectedCatalogueView);
    const alert = await screen.findByRole('alert');
    const expected = {
      forbidden: 'Access to this tenant is denied',
      'not-found': 'not found',
      'invalid-response': 'invalid response',
      unavailable: 'service is unavailable',
    };
    expect(alert.textContent).toContain(expected[kind]);
    expect(screen.queryByRole('list', { name: 'Connected assets' })).toBeNull();
  },
);

function pendingPage() {
  let resolve: (value: AssetPage) => void = () => {
    throw new Error('Promise not initialized');
  };
  const promise = new Promise<AssetPage>((complete) => {
    resolve = complete;
  });
  return { promise, resolve: (value: AssetPage) => resolve(value) };
}

function ReadProbe(props: { readonly tenant: string }) {
  const read = useMetadataRead(
    () => ({ tenantId: props.tenant, limit: 50 }),
    (reader, request, options) => reader.listPage(request, options),
  );
  return (
    <MetadataReadContent state={read.state()} label="probe" retry={read.retry}>
      {(page) => <p>{page.assets[0]?.name ?? 'Empty page'}</p>}
    </MetadataReadContent>
  );
}

test('aborts tenant changes and unmount, discarding a stale response from a non-cooperative reader', async () => {
  const first = pendingPage();
  const second = pendingPage();
  const signals: AbortSignal[] = [];
  const reader = readerWith({
    listPage: vi.fn((request, options) => {
      if (options?.signal) signals.push(options.signal);
      return request.tenantId === 'tenant-a' ? first.promise : second.promise;
    }),
  });
  const [tenant, setTenant] = createSignal('tenant-a');
  const view = render(() => (
    <MetadataReaderProvider reader={reader}>
      <ReadProbe tenant={tenant()} />
    </MetadataReaderProvider>
  ));
  setTenant('tenant-b');
  await waitFor(() => expect(signals).toHaveLength(2));
  expect(signals[0]?.aborted).toBe(true);
  second.resolve({
    assets: [
      {
        id: 'asset-1',
        assetType: { id: 'generic.machine', version: 2 },
        tenantId: 'tenant-b',
        name: 'Another tenant machine',
      },
    ],
    nextAfter: null,
  });
  expect(await screen.findByText('Another tenant machine')).toBeTruthy();
  first.resolve(assets);
  await first.promise;
  expect(screen.queryByText('Primary machine')).toBeNull();
  expect(screen.getByText('Another tenant machine')).toBeTruthy();
  view.unmount();
  expect(signals[1]?.aborted).toBe(true);
});

test('metadata unauthorized response invalidates the app-owned session', async () => {
  const expired = vi.fn();
  const reader = readerWith({
    listPage: vi.fn(async () => {
      throw new RequestFailure('unauthorized');
    }),
  });
  render(() => (
    <MetadataReaderProvider reader={reader} onUnauthorized={expired}>
      <ReadProbe tenant="tenant-a" />
    </MetadataReaderProvider>
  ));
  expect(
    await screen.findByRole('link', { name: 'Sign in to FleetIQ' }),
  ).toBeTruthy();
  expect(expired).toHaveBeenCalledTimes(1);
});

test('source review preserves sibling cursors and fetches an exact pinned property without inventing observed values', async () => {
  const binding = {
    id: 'binding-1',
    tenantId: 'tenant-a',
    revision: '18446744073709551615',
    recordedAtMs: 2000,
    source: {
      deviceAssetId: 'gateway-1',
      endpointId: 'can-primary',
      signalId: 'bus.voltage',
    },
    target: {
      assetId: 'asset-1',
      property: { id: 'electrical.voltage', version: 1 },
    },
    effectiveInterval: { startMs: 1000, endMs: null },
  };
  const reader = readerWith({
    listTargetBindings: vi.fn(async (request) => ({
      assetId: request.assetId,
      effectiveAtMs: request.effectiveAtMs,
      knownAtMs: request.knownAtMs,
      bindings: [binding],
      nextAfter: 'binding-2',
    })),
    listSourceBindings: vi.fn(async (request) => ({
      source: request.source,
      effectiveAtMs: request.effectiveAtMs,
      knownAtMs: request.knownAtMs,
      bindings: [binding],
      nextAfter: 'binding-3',
    })),
  });
  const view = mountRoute(
    reader,
    `/assets/asset-1${context}&relationship_after=relationship-0&target_after=binding-0`,
    () => <ConnectedInspectorView assetId="asset-1" />,
  );
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: 'Review source bus.voltage' }),
  );
  await screen.findByRole('list', { name: 'Source binding candidate records' });
  expect(await screen.findByText('Voltage')).toBeTruthy();
  expect(reader.listSourceBindings).toHaveBeenCalledWith(
    {
      tenantId: 'tenant-a',
      source: binding.source,
      effectiveAtMs: 1500,
      knownAtMs: 2500,
      limit: 50,
    },
    expect.anything(),
  );
  const params = new URLSearchParams(view.history.get().split('?')[1]);
  expect(params.get('device_asset_id')).toBe('gateway-1');
  expect(params.get('relationship_after')).toBe('relationship-0');
  expect(params.get('target_after')).toBe('binding-0');
  const sourceRegion = screen.getByRole('region', {
    name: 'Source binding candidates',
  });
  expect(sourceRegion.textContent).toContain('revision 18446744073709551615');
  const nextSource = within(sourceRegion).getByRole('link', {
    name: 'Next source binding page',
  });
  expect(nextSource.getAttribute('href')).toContain('source_after=binding-3');
  expect(nextSource.getAttribute('href')).toContain('target_after=binding-0');
  expect(screen.queryByText('400 V')).toBeNull();
});

test('an empty exact-source page never claims an unassigned or unregistered device', async () => {
  const reader = readerWith();
  mountRoute(
    reader,
    `/assets/asset-1${context}&device_asset_id=gateway-1&endpoint_id=can-primary&signal_id=bus.voltage`,
    () => <ConnectedInspectorView assetId="asset-1" />,
  );
  const empty = await screen.findByText(
    'No candidates appear in this bounded source snapshot page. This does not mean the source is unassigned or unregistered.',
  );
  expect(empty).toBeTruthy();
  expect(reader.listSourceBindings).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByRole('list', { name: 'Source binding candidate records' }),
  ).toBeNull();
});

interface ScopedSnapshot {
  readonly tenantId: string;
  readonly effectiveAtMs: number;
  readonly knownAtMs: number;
  readonly limit: number;
  readonly after?: string;
  readonly source: {
    readonly deviceAssetId: string;
    readonly endpointId: string;
    readonly signalId: string;
  };
}
function ScopedSnapshotProbe(props: { readonly request: ScopedSnapshot }) {
  const read = useMetadataRead(
    () => props.request,
    (reader, request, options) => reader.listSourceBindings(request, options),
  );
  return <output aria-label="Scoped read state">{read.state().kind}</output>;
}
const snapshotRequest: ScopedSnapshot = {
  tenantId: 'tenant-a',
  effectiveAtMs: 1500,
  knownAtMs: 2500,
  limit: 50,
  source: {
    deviceAssetId: 'gateway-1',
    endpointId: 'can-primary',
    signalId: 'bus.voltage',
  },
};
test.each([
  ['tenant', { ...snapshotRequest, tenantId: 'tenant-b' }],
  ['effective cutoff', { ...snapshotRequest, effectiveAtMs: 1600 }],
  ['known cutoff', { ...snapshotRequest, knownAtMs: 2600 }],
  [
    'source',
    {
      ...snapshotRequest,
      source: { ...snapshotRequest.source, signalId: 'bus.current' },
    },
  ],
  ['cursor', { ...snapshotRequest, after: 'binding-1' }],
] as const)(
  'scoped %s change aborts old work and retains the latest completion',
  async (_name, nextRequest) => {
    let firstResolve!: (
      value: Awaited<ReturnType<MetadataReader['listSourceBindings']>>,
    ) => void;
    let secondResolve!: (
      value: Awaited<ReturnType<MetadataReader['listSourceBindings']>>,
    ) => void;
    const first = new Promise<
      Awaited<ReturnType<MetadataReader['listSourceBindings']>>
    >((resolve) => {
      firstResolve = resolve;
    });
    const second = new Promise<
      Awaited<ReturnType<MetadataReader['listSourceBindings']>>
    >((resolve) => {
      secondResolve = resolve;
    });
    const signals: AbortSignal[] = [];
    const reader = readerWith({
      listSourceBindings: (_request, options) => {
        if (!options?.signal) throw new Error('Cancellation signal missing');
        signals.push(options.signal);
        return signals.length === 1 ? first : second;
      },
    });
    const [request, setRequest] = createSignal<ScopedSnapshot>(snapshotRequest);
    const view = render(() => (
      <MetadataReaderProvider reader={reader}>
        <ScopedSnapshotProbe request={request()} />
      </MetadataReaderProvider>
    ));
    setRequest(nextRequest);
    await waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[0]?.aborted).toBe(true);
    const result = (request: ScopedSnapshot) => ({
      source: request.source,
      effectiveAtMs: request.effectiveAtMs,
      knownAtMs: request.knownAtMs,
      bindings: [],
      nextAfter: null,
    });
    secondResolve(result(nextRequest));
    await second;
    expect(await screen.findByText('ready')).toBeTruthy();
    firstResolve(result(snapshotRequest));
    await first;
    expect(screen.getByText('ready')).toBeTruthy();
    view.unmount();
    expect(signals[1]?.aborted).toBe(true);
  },
);

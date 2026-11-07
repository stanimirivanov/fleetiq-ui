import { createMemoryHistory, MemoryRouter, Route } from '@solidjs/router';
import { cleanup, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { createSignal } from 'solid-js';
import { afterEach, expect, test, vi } from 'vitest';
import { RequestFailure } from '#shared/model';
import {
  parseCurrentProperty,
  parsePropertyEvidence,
} from '../../../api/parse-property-evidence';
import {
  request,
  wireChange,
  wireCurrent,
} from '../../../api/tests/evidence-fixture';
import type { MetadataReader } from '../../../model/metadata';
import type {
  CurrentProperty,
  TelemetryReader,
} from '../../../model/property-evidence';
import { MetadataReaderProvider } from '../MetadataReaderProvider';
import { useMetadataWorkspace } from '../useMetadataWorkspace';
import { PropertyTelemetry } from './PropertyTelemetry';

afterEach(cleanup);
function ports(overrides: Partial<TelemetryReader> = {}) {
  const telemetry: TelemetryReader = {
    current: vi.fn(async () => parseCurrentProperty(wireCurrent(), request)),
    history: vi.fn(async () => ({
      changes: [
        parsePropertyEvidence(wireChange(), request),
        {
          ...parsePropertyEvidence(wireChange(), request),
          interpretation: 'v1.bb',
          eventAt: '2000',
          source: {
            ...parsePropertyEvidence(wireChange(), request).source,
            recordedAt: '2000',
            outputIndex: 1,
          },
        },
      ],
      nextAfter: null,
    })),
    interpretation: vi.fn(async () =>
      parsePropertyEvidence(wireChange(), request),
    ),
    ...overrides,
  };
  const reader: MetadataReader & { telemetry: TelemetryReader } = {
    telemetry,
    listPage: vi.fn(),
    getAsset: vi.fn(),
    getAssetType: vi.fn(),
    getProperty: vi.fn(async (q) => ({
      ...request.property,
      id: q.id,
      version: q.version,
    })),
    getRelationshipType: vi.fn(),
    listRelationships: vi.fn(),
    listTargetBindings: vi.fn(),
    listSourceBindings: vi.fn(),
  };
  return { reader, telemetry };
}
function mount(
  p: ReturnType<typeof ports>,
  search = '?tenant=tenant-a&effective_at_ms=3000&known_at_ms=3000',
  actions?: () => readonly string[],
) {
  const history = createMemoryHistory();
  history.set({ value: `/assets/asset-a${search}` });
  const expired = vi.fn();
  const view = render(() => (
    <MemoryRouter history={history}>
      <Route
        path="/assets/:assetId"
        component={() => (
          <MetadataReaderProvider
            reader={p.reader}
            onUnauthorized={expired}
            {...(actions ? { actions } : {})}
          >
            <Harness />
          </MetadataReaderProvider>
        )}
      />
    </MemoryRouter>
  ));
  function Harness() {
    const workspace = useMetadataWorkspace();
    return (
      <PropertyTelemetry
        asset={{
          id: 'asset-a',
          tenantId: 'tenant-a',
          name: 'Machine',
          assetType: { id: 'equipment', version: 1 },
          externalIdentifiers: [],
        }}
        properties={[request.property, { id: 'other', version: 2 }]}
        workspace={workspace}
      />
    );
  }
  return { history, expired, ...view };
}
test('connects a reading to exact provenance and applies a bounded URL-owned history window', async () => {
  const p = ports();
  mount(p);
  const user = userEvent.setup();
  await waitFor(() =>
    expect(
      screen.getByRole('region', { name: 'Property readings' }).textContent,
    ).toContain('9223372036854775807'),
  );
  expect(screen.getByRole('img', { name: /Event-time values/ })).toBeTruthy();
  expect(
    screen.getByRole('table', {
      name: 'Exact historical values, quality and provenance',
    }),
  ).toBeTruthy();
  await user.click(
    screen.getByRole('button', { name: 'Inspect reading provenance' }),
  );
  expect(
    await screen.findByRole('region', { name: 'Interpretation provenance' }),
  ).toBeTruthy();
  expect(await screen.findByText('Original binding')).toBeTruthy();
  expect(p.telemetry.interpretation).toHaveBeenCalled();
  await user.clear(screen.getByLabelText('History start (Unix ms, inclusive)'));
  await user.type(
    screen.getByLabelText('History start (Unix ms, inclusive)'),
    '0',
  );
  await user.click(
    screen.getByRole('button', { name: 'Apply history window' }),
  );
  await waitFor(() =>
    expect(p.telemetry.history).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: '0', end: '3000', limit: 50 }),
      expect.anything(),
    ),
  );
  expect(
    screen.queryByRole('region', { name: 'Interpretation provenance' }),
  ).toBeNull();
});
test('property changes abort old work and ignore a late non-cooperative reading', async () => {
  let resolveOld: (value: CurrentProperty) => void = () => {};
  let oldSignal: AbortSignal | undefined;
  const p = ports({
    current: vi.fn<TelemetryReader['current']>((q, options) =>
      q.property.id === 'electrical.voltage'
        ? new Promise<CurrentProperty>((resolve) => {
            resolveOld = resolve;
            oldSignal = options?.signal;
          })
        : Promise.resolve<CurrentProperty>({
            ...parseCurrentProperty(wireCurrent(), request),
            item: {
              freshness: 'fresh',
              change: {
                ...parsePropertyEvidence(wireChange(), request),
                value: { kind: 'integer', value: '222' },
              },
            },
          }),
    ),
  });
  const view = mount(p);
  const user = userEvent.setup();
  await waitFor(() => expect(p.telemetry.current).toHaveBeenCalled());
  await user.selectOptions(
    screen.getByLabelText('Property and definition version'),
    JSON.stringify(['other', 2]),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('region', { name: 'Property readings' }).textContent,
    ).toContain('222'),
  );
  expect(oldSignal?.aborted).toBe(true);
  resolveOld(parseCurrentProperty(wireCurrent(), request));
  await Promise.resolve();
  expect(
    screen.getByRole('region', { name: 'Property readings' }).textContent,
  ).not.toContain('9223372036854775807');
  view.unmount();
});
test('invalid context blocks reads and telemetry denial does not become an empty/sample state', async () => {
  let p = ports();
  const invalid = mount(
    p,
    '?tenant=tenant-a&effective_at_ms=3000&known_at_ms=3000&history_start=0',
  );
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    expect.stringContaining('URL context is invalid'),
  );
  expect(p.telemetry.current).not.toHaveBeenCalled();
  expect(p.telemetry.history).not.toHaveBeenCalled();
  invalid.unmount();
  const wrongTenant = mount(
    p,
    '?tenant=tenant-b&effective_at_ms=3000&known_at_ms=3000',
  );
  expect(
    screen.getByText(
      /Choose the required context to review selected property definition/,
    ),
  ).toBeTruthy();
  expect(p.reader.getProperty).not.toHaveBeenCalled();
  expect(p.telemetry.current).not.toHaveBeenCalled();
  wrongTenant.unmount();
  p = ports({
    current: vi.fn(async () => {
      throw new RequestFailure('forbidden');
    }),
  });
  mount(p);
  expect(await screen.findByText(/Telemetry access denied/)).toBeTruthy();
  expect(screen.queryByText(/No materialized value/)).toBeNull();
});

test('an empty continuation is not described as an empty history window', async () => {
  const p = ports({
    history: vi.fn(async () => ({ changes: [], nextAfter: null })),
  });
  mount(
    p,
    '?tenant=tenant-a&effective_at_ms=3000&known_at_ms=3000&history_after=v1.aa',
  );
  expect(
    await screen.findByText(
      /This continuation page contains no stored interpretations/,
    ),
  ).toBeTruthy();
  expect(
    screen.queryByText(/^No stored interpretations in this window/),
  ).toBeNull();
});

test('live subscription owns cancellation and ignores late values after property change', async () => {
  const subscriptions: {
    receive: Parameters<NonNullable<TelemetryReader['subscribe']>>[1];
    signal: AbortSignal;
  }[] = [];
  const p = ports({
    subscribe: vi.fn(async (_q, receive, options) => {
      subscriptions.push({ receive, signal: options.signal });
      await new Promise<void>((resolve) =>
        options.signal.addEventListener('abort', () => resolve(), {
          once: true,
        }),
      );
    }),
  });
  const view = mount(p);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Start live updates' }),
    ).toHaveProperty('disabled', false),
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Start live updates' }),
  );
  await waitFor(() => expect(subscriptions).toHaveLength(1));
  const first = subscriptions[0];
  if (!first) throw new Error('missing subscription');
  first.receive({
    kind: 'snapshot',
    id: 'cursor',
    snapshot: parseCurrentProperty(wireCurrent(), request),
  });
  await waitFor(() =>
    expect(screen.getByText('Delivery: live')).not.toBeNull(),
  );
  await userEvent.selectOptions(
    screen.getByLabelText('Property and definition version'),
    JSON.stringify(['other', 2]),
  );
  await waitFor(() => expect(first.signal.aborted).toBe(true));
  first.receive({
    kind: 'snapshot',
    id: 'late',
    snapshot: {
      ...parseCurrentProperty(wireCurrent(), request),
      processedCount: '999999999',
    },
  });
  expect(screen.queryByText(/999999999/)).toBeNull();
  view.unmount();
  expect(subscriptions.every((s) => s.signal.aborted)).toBe(true);
});
test('live authority denial clears current and history evidence', async () => {
  const p = ports({
    subscribe: async (_q, receive) => {
      receive({
        kind: 'snapshot',
        id: 'cursor',
        snapshot: parseCurrentProperty(wireCurrent(), request),
      });
      receive({ kind: 'stream-ended', reason: 'access_denied' });
    },
  });
  mount(p);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Start live updates' }),
    ).toHaveProperty('disabled', false),
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Start live updates' }),
  );
  await waitFor(() =>
    expect(
      screen.getByText(/Access is denied.*Automatic recovery stopped/),
    ).not.toBeNull(),
  );
  expect(
    screen.queryByRole('region', { name: 'Hot property history' }),
  ).toBeNull();
  await userEvent.click(
    screen.getByRole('button', { name: 'Stop live updates' }),
  );
  expect(
    screen.queryByRole('region', { name: 'Hot property history' }),
  ).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Inspect reading provenance' }),
  ).toBeNull();
});

test('labels exact summaries and hides late results when switching back to raw history', async () => {
  let finish!: (
    v: import('../../../model/history-review-types').NumericSummary,
  ) => void;
  const summary = vi.fn<NonNullable<TelemetryReader['summary']>>(
    () =>
      new Promise<import('../../../model/history-review-types').NumericSummary>(
        (r) => {
          finish = r;
        },
      ),
  );
  const p = ports({ summary });
  const view = mount(
    p,
    '?tenant=tenant-a&effective_at_ms=3000&known_at_ms=3000&history_start=0&history_end=3000&history_resolution=1000',
  );
  await waitFor(() => expect(summary).toHaveBeenCalledOnce());
  expect(p.telemetry.history).not.toHaveBeenCalled();
  view.history.set({
    value:
      '/assets/asset-a?tenant=tenant-a&effective_at_ms=3000&known_at_ms=3000&history_start=0&history_end=3000',
  });
  await waitFor(() => expect(p.telemetry.history).toHaveBeenCalledOnce());
  expect(summary.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  finish({
    series: '1',
    revision: '2',
    observedAt: '3000',
    unit: 'volt',
    buckets: [
      {
        start: '0',
        end: '1000',
        total: 1,
        count: 1,
        excluded: 0,
        min: '9223372036854775807',
        max: '9223372036854775807',
        sum: '9223372036854775807',
      },
    ],
    nextAfter: null,
    restore: undefined,
  });
  await Promise.resolve();
  expect(screen.queryByText(/Summary publication/)).toBeNull();
});
test('renders selected archive coverage even when no interpretations are available', async () => {
  const p = ports({
    history: vi.fn(async () => ({
      changes: [],
      nextAfter: null,
      coverage: {
        archive: 'unavailable' as const,
        manifestId: '7',
        generation: '2',
      },
    })),
  });
  mount(
    p,
    '?tenant=tenant-a&effective_at_ms=3000&known_at_ms=3000&history_start=0&history_end=3000&history_manifest=7&history_generation=2',
  );
  await screen.findByText(/Archive coverage: unavailable/);
  expect(
    screen.queryByText('No stored interpretations in this window.'),
  ).toBeNull();
  expect(
    screen.getByText(/This read returned no interpretations/),
  ).toBeTruthy();
  expect(p.telemetry.history).toHaveBeenCalledWith(
    expect.objectContaining({ restore: { manifestId: '7', generation: '2' } }),
    expect.anything(),
  );
  expect(screen.getByText(/not complete interval coverage/)).toBeTruthy();
});

test('refreshing a summary continuation starts a new publication review', async () => {
  const summary = vi.fn<NonNullable<TelemetryReader['summary']>>(async () => ({
    series: '1',
    revision: '2',
    observedAt: '3000',
    unit: 'volt',
    buckets: [],
    nextAfter: null,
    restore: undefined,
  }));
  const p = ports({ summary });
  const view = mount(
    p,
    '?tenant=tenant-a&effective_at_ms=3000&known_at_ms=3000&history_start=0&history_end=3000&history_resolution=1000&history_after=v1.cc',
  );
  await screen.findByText(/Summary publication 1, revision 2/);
  await userEvent.click(
    screen.getByRole('button', { name: 'Refresh summary' }),
  );
  await waitFor(() =>
    expect(summary.mock.calls.at(-1)?.[0].after).toBeUndefined(),
  );
  expect(view.history.get()).not.toContain('history_after=');
});

const exportSearch =
  '?tenant=tenant-a&effective_at_ms=3000&known_at_ms=3000&history_start=0&history_end=3000';
const exportGrants = ['telemetry.read', 'operations.manage'];
const readyExport = {
  id: '7',
  state: 'ready' as const,
  expiresAt: '4000',
  bytes: 16,
};

test('replays an uncertain export with its original request key and window', async () => {
  const create = vi
    .fn()
    .mockRejectedValueOnce(new RequestFailure('unavailable'))
    .mockResolvedValueOnce(readyExport);
  mount(
    ports({
      exports: { create, status: vi.fn(), cancel: vi.fn(), download: vi.fn() },
    }),
    exportSearch,
    () => exportGrants,
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Request export' }),
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Retry exact export request' }),
  );
  await screen.findByRole('button', { name: 'Download export' });
  expect(create.mock.calls[0]?.[0]).toMatchObject({
    tenantId: 'tenant-a',
    assetId: 'asset-a',
    start: '0',
    end: '3000',
  });
  expect(create.mock.calls[1]?.[0]).toEqual(create.mock.calls[0]?.[0]);
});

test('revocation and a changed history window discard late export completions', async () => {
  for (const change of ['grant', 'window']) {
    const [actions, setActions] = createSignal(exportGrants);
    let finish!: (job: typeof readyExport) => void;
    const create = vi.fn(
      (_request, _options) =>
        new Promise<typeof readyExport>((resolve) => {
          finish = resolve;
        }),
    );
    const view = mount(
      ports({
        exports: {
          create,
          status: vi.fn(),
          cancel: vi.fn(),
          download: vi.fn(),
        },
      }),
      exportSearch,
      actions,
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Request export' }),
    );
    if (change === 'grant') setActions(['telemetry.read']);
    else
      view.history.set({
        value:
          '/assets/asset-a' +
          exportSearch.replace('history_end=3000', 'history_end=2000'),
      });
    await waitFor(() =>
      expect(create.mock.calls[0]?.[1].signal.aborted).toBe(true),
    );
    finish(readyExport);
    await Promise.resolve();
    expect(
      screen.queryByRole('button', { name: 'Download export' }),
    ).toBeNull();
    view.unmount();
  }
});

test('replays a restore expectation, refreshes status and selects exact ready staging', async () => {
  const pending = {
    manifestId: '7',
    generation: '1',
    state: 'pending' as const,
  };
  const request = vi
    .fn()
    .mockRejectedValueOnce(new RequestFailure('unavailable'))
    .mockResolvedValueOnce(pending);
  const status = vi.fn().mockResolvedValue({ ...pending, state: 'ready' });
  const view = mount(
    ports({ restores: { request, status } }),
    exportSearch,
    () => exportGrants,
  );
  await userEvent.type(
    await screen.findByLabelText('Manifest to restore'),
    '7',
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Request restore' }),
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Retry exact restore request' }),
  );
  await screen.findByText(/Restore pending/);
  expect(request.mock.calls[0]?.[0]).toEqual({
    tenantId: 'tenant-a',
    manifestId: '7',
    expected: '0',
  });
  expect(request.mock.calls[1]?.[0]).toEqual(request.mock.calls[0]?.[0]);
  await userEvent.click(
    screen.getByRole('button', { name: 'Refresh restore status' }),
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Review restored history' }),
  );
  expect(view.history.get()).toContain('history_manifest=7');
  expect(view.history.get()).toContain('history_generation=1');
});

test('a late ready restore cannot select staging after permission revocation', async () => {
  const [actions, setActions] = createSignal(exportGrants);
  let complete!: (job: {
    manifestId: string;
    generation: string;
    state: 'ready';
  }) => void;
  const request = vi.fn(
    (_command, _options) =>
      new Promise<{ manifestId: string; generation: string; state: 'ready' }>(
        (resolve) => {
          complete = resolve;
        },
      ),
  );
  const view = mount(
    ports({ restores: { request, status: vi.fn() } }),
    exportSearch,
    actions,
  );
  await userEvent.type(
    await screen.findByLabelText('Manifest to restore'),
    '7',
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Request restore' }),
  );
  setActions(['telemetry.read']);
  await waitFor(() =>
    expect(request.mock.calls[0]?.[1].signal.aborted).toBe(true),
  );
  complete({ manifestId: '7', generation: '1', state: 'ready' });
  await Promise.resolve();
  expect(
    screen.queryByRole('button', { name: 'Review restored history' }),
  ).toBeNull();
  expect(view.history.get()).not.toContain('history_manifest=');
});

test('an old export cannot displace the exact replay of a new uncertain request', async () => {
  const create = vi
    .fn()
    .mockResolvedValueOnce(readyExport)
    .mockRejectedValueOnce(new RequestFailure('unavailable'))
    .mockResolvedValueOnce({ ...readyExport, id: '8' });
  const cancel = vi
    .fn()
    .mockResolvedValue({ ...readyExport, state: 'cancelled' });
  const status = vi.fn();
  mount(
    ports({ exports: { create, cancel, status, download: vi.fn() } }),
    exportSearch,
    () => exportGrants,
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Request export' }),
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Cancel export' }),
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Request export' }),
  );
  const retry = await screen.findByRole('button', {
    name: 'Retry exact export request',
  });
  expect(
    screen.queryByRole('button', { name: 'Refresh export status' }),
  ).toBeNull();
  await userEvent.click(retry);
  expect(create.mock.calls[2]?.[0]).toEqual(create.mock.calls[1]?.[0]);
});

test('a superseded restore allows explicit recovery with a new expectation', async () => {
  const request = vi
    .fn()
    .mockResolvedValue({ manifestId: '7', generation: '1', state: 'ready' });
  const status = vi.fn().mockRejectedValue(new RequestFailure('not-found'));
  mount(
    ports({ restores: { request, status } }),
    exportSearch,
    () => exportGrants,
  );
  await userEvent.type(
    await screen.findByLabelText('Manifest to restore'),
    '7',
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Request restore' }),
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Refresh restore status' }),
  );
  await screen.findByRole('button', { name: 'Request restore' });
  expect(
    screen.queryByRole('button', { name: 'Review restored history' }),
  ).toBeNull();
  expect(request).toHaveBeenCalledOnce();
});

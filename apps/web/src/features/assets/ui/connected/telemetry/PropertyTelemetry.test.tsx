import { createMemoryHistory, MemoryRouter, Route } from '@solidjs/router';
import { cleanup, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
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
) {
  const history = createMemoryHistory();
  history.set({ value: `/assets/asset-a${search}` });
  const expired = vi.fn();
  const view = render(() => (
    <MemoryRouter history={history}>
      <Route
        path="/assets/:assetId"
        component={() => (
          <MetadataReaderProvider reader={p.reader} onUnauthorized={expired}>
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

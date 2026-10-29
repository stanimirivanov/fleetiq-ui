import { cleanup, render, screen, waitFor } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, expect, test, vi } from 'vitest';
import type {
  BindingGateway,
  RegisteredEndpoints,
} from '../../model/binding-authoring';
import type { MetadataReader } from '../../model/metadata';
import { MetadataReaderProvider } from '../connected/MetadataReaderProvider';
import {
  type BindingSourceController,
  useBindingSource,
} from './useBindingSource';
import {
  type BindingTargetController,
  useBindingTarget,
} from './useBindingTarget';

afterEach(cleanup);
function provider(
  gateway: BindingGateway | undefined,
  actions: () => readonly string[],
  children: () => JSX.Element,
) {
  const unused = async () => {
    throw new Error('Unexpected metadata operation');
  };
  const reader: MetadataReader = {
    listPage: unused,
    getRelationshipType: unused,
    listRelationships: unused,
    listTargetBindings: unused,
    listSourceBindings: unused,
    getAsset: async (q) => ({
      id: q.assetId,
      tenantId: q.tenantId,
      name: 'Equipment',
      assetType: { id: 'equipment', version: 2 },
      externalIdentifiers: [],
    }),
    getAssetType: async (q) => ({
      id: q.id,
      version: q.version,
      name: 'Equipment',
      supportedProperties: [{ id: 'battery.voltage', version: 3 }],
    }),
    getProperty: async (q) => ({
      id: q.id,
      version: q.version,
      name: 'Voltage',
      valueKind: 'decimal',
      canonicalUnit: 'V',
    }),
  };
  return render(() => (
    <MetadataReaderProvider
      reader={reader}
      bindings={gateway}
      actions={actions}
    >
      {children()}
    </MetadataReaderProvider>
  ));
}
function gateway(): BindingGateway {
  return {
    device: vi.fn(async () => ({
      endpoints: [{ id: 'can-primary', kind: 'can' }],
    })),
    observed: vi.fn(async () => ({
      observedAt: 2500,
      truncated: false,
      sources: [],
    })),
    append: vi.fn(),
    exact: vi.fn(),
  };
}
test('registered endpoint selection does not imply observed signals; protocol diagnostics require explicit grant and action', async () => {
  const port = gateway(),
    [actions, setActions] = createSignal(['metadata.read']);
  let controller!: BindingSourceController;
  provider(port, actions, () => {
    controller = useBindingSource(() => 'tenant-a');
    return <output>{String(controller.valid())}</output>;
  });
  expect(controller.canObserve()).toBe(false);
  controller.changeDevice('bad id');
  controller.load();
  expect(port.device).not.toHaveBeenCalled();
  controller.changeDevice('gateway-1');
  controller.load();
  await waitFor(() => expect(controller.registered.state().kind).toBe('ready'));
  controller.selectEndpoint('can-primary');
  controller.setSignal('custom.protocol.signal');
  expect(controller.valid()).toBe(true);
  controller.inspect();
  await Promise.resolve();
  expect(port.observed).not.toHaveBeenCalled();
  setActions(['metadata.read', 'protocol.manage']);
  expect(port.observed).not.toHaveBeenCalled();
  controller.inspect();
  await waitFor(() => expect(port.observed).toHaveBeenCalledOnce());
  expect(controller.observed.state().kind).toBe('ready');
  expect(controller.valid()).toBe(true);
  expect(controller.canObserve()).toBe(true);
  controller.inspect();
  await waitFor(() => expect(port.observed).toHaveBeenCalledTimes(2));
  controller.choose({
    endpoint_id: 'can-primary',
    signal_id: 'observed.signal',
  });
  expect(controller.value().signal_id).toBe('observed.signal');
  controller.choose({ endpoint_id: 'unregistered', signal_id: 'wrong.signal' });
  expect(controller.value().signal_id).toBe('observed.signal');
  controller.selectEndpoint('unregistered');
  expect(controller.valid()).toBe(false);
});
test('source changes abort superseded reads and reject non-cooperative late endpoint evidence', async () => {
  let resolve!: (v: { endpoints: { id: string; kind: string }[] }) => void;
  let signal: AbortSignal | undefined;
  const port = gateway();
  port.device = vi.fn<BindingGateway['device']>((_t, _id, o) => {
    signal = o?.signal;
    return new Promise<RegisteredEndpoints>((r) => {
      resolve = r;
    });
  });
  let controller!: BindingSourceController;
  provider(
    port,
    () => ['metadata.read'],
    () => {
      controller = useBindingSource(() => 'tenant-a');
      return <output>{String(controller.valid())}</output>;
    },
  );
  controller.changeDevice('old-device');
  controller.load();
  await waitFor(() => expect(port.device).toHaveBeenCalledOnce());
  controller.changeDevice('new-device');
  await waitFor(() => expect(signal?.aborted).toBe(true));
  resolve({ endpoints: [{ id: 'old-port', kind: 'can' }] });
  await Promise.resolve();
  expect(controller.endpoints()).toEqual([]);
  expect(controller.value().signal_id).toBe('');
  expect(controller.valid()).toBe(false);
});
test('target selection rejects unsupported versions and invalidates pinned properties when identity changes', async () => {
  const port = gateway();
  let controller!: BindingTargetController;
  provider(
    port,
    () => ['metadata.read'],
    () => {
      controller = useBindingTarget(() => 'tenant-a');
      return <output>{String(controller.valid())}</output>;
    },
  );
  controller.changeAsset('bad id');
  controller.load();
  expect(controller.identity.state().kind).toBe('idle');
  controller.changeAsset('asset-a');
  controller.load();
  await waitFor(() => expect(controller.type.state().kind).toBe('ready'));
  controller.select({ id: 'battery.voltage', version: 4 });
  expect(controller.valid()).toBe(false);
  expect(controller.property.state().kind).toBe('idle');
  controller.select({ id: 'battery.voltage', version: 3 });
  await waitFor(() => expect(controller.valid()).toBe(true));
  expect(screen.getByRole('status').textContent).toBe('true');
  expect(controller.value()).toEqual({
    asset_id: 'asset-a',
    property: { id: 'battery.voltage', version: 3 },
  });
  controller.changeAsset('other-asset');
  expect(controller.valid()).toBe(false);
  expect(controller.selected().id).toBe('');
});

test('protocol grant removal aborts diagnostics and hides late sampled tuples without inventing inventory', async () => {
  const port = gateway(),
    [actions, setActions] = createSignal(['metadata.read', 'protocol.manage']);
  let controller!: BindingSourceController;
  let signal: AbortSignal | undefined,
    resolve!: (value: Awaited<ReturnType<BindingGateway['observed']>>) => void;
  port.observed = vi.fn<BindingGateway['observed']>((_t, _id, o) => {
    signal = o?.signal;
    return new Promise((r) => {
      resolve = r;
    });
  });
  provider(port, actions, () => {
    controller = useBindingSource(() => 'tenant-a');
    return <output>{String(controller.valid())}</output>;
  });
  controller.changeDevice('gateway-1');
  controller.load();
  await waitFor(() => expect(controller.registered.state().kind).toBe('ready'));
  controller.selectEndpoint('can-primary');
  controller.setSignal('manual.signal');
  controller.inspect();
  await waitFor(() => expect(port.observed).toHaveBeenCalledOnce());
  setActions(['metadata.read']);
  await waitFor(() => expect(signal?.aborted).toBe(true));
  resolve({
    observedAt: 2500,
    truncated: false,
    sources: [
      {
        endpoint_id: 'can-primary',
        signal_id: 'late.signal',
        package_id: 'protocol',
        package_version: '1',
      },
    ],
  });
  await Promise.resolve();
  expect(controller.observed.state().kind).toBe('idle');
  expect(controller.value().signal_id).toBe('manual.signal');
  expect(controller.valid()).toBe(true);
});
test('missing binding transport fails explicitly and cannot become eligible endpoint evidence', async () => {
  let controller!: BindingSourceController;
  provider(
    undefined,
    () => ['metadata.read', 'protocol.manage'],
    () => {
      controller = useBindingSource(() => 'tenant-a');
      return <output>{String(controller.valid())}</output>;
    },
  );
  controller.changeDevice('gateway-1');
  controller.load();
  await waitFor(() => expect(controller.registered.state().kind).toBe('error'));
  controller.inspect();
  await waitFor(() => expect(controller.observed.state().kind).toBe('error'));
  expect(controller.valid()).toBe(false);
  expect(controller.endpoints()).toEqual([]);
});

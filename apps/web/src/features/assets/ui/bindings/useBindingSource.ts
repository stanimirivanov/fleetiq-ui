import { createMemo, createSignal } from 'solid-js';
import { RequestFailure } from '#shared/model';
import type { BindingSource } from '../../model/binding-authoring';
import { commandIdentifier } from '../../model/commissioning';
import { useMetadataReader } from '../connected/MetadataReaderProvider';
import { useMetadataRead } from '../connected/useMetadataRead';
/** Registered endpoints and observed tuples have separate, permission-scoped reads. */
export function useBindingSource(tenant: () => string) {
  const context = useMetadataReader(),
    [device, setDevice] = createSignal(''),
    [lookup, setLookup] = createSignal(''),
    [endpoint, setEndpoint] = createSignal(''),
    [signal, setSignal] = createSignal(''),
    [inspect, setInspect] = createSignal(false);
  const registered = useMetadataRead(
    () => (lookup() ? { tenant: tenant(), id: lookup() } : null),
    (_r, q, o) =>
      context.bindings?.device(q.tenant, q.id, o) ??
      Promise.reject(new RequestFailure('unavailable')),
  );
  const endpoints = () => {
    const s = registered.state();
    return s.kind === 'ready' ? s.value.endpoints : [];
  };
  const observed = useMetadataRead(
    () =>
      lookup() && inspect() && context.actions?.()?.includes('protocol.manage')
        ? { tenant: tenant(), id: lookup() }
        : null,
    (_r, q, o) =>
      context.bindings?.observed(q.tenant, q.id, o) ??
      Promise.reject(new RequestFailure('unavailable')),
  );
  const value = createMemo<BindingSource>(() => ({
    device_asset_id: device(),
    endpoint_id: endpoint(),
    signal_id: signal(),
  }));
  return {
    device,
    endpoint,
    signal,
    registered,
    endpoints,
    observed,
    value,
    canObserve: () => context.actions?.()?.includes('protocol.manage') === true,
    valid: () =>
      lookup() === device() &&
      registered.state().kind === 'ready' &&
      endpoints().some((e) => e.id === endpoint()) &&
      commandIdentifier(signal()),
    changeDevice: (v: string) => {
      setDevice(v);
      setLookup('');
      setEndpoint('');
      setSignal('');
      setInspect(false);
    },
    load: () => {
      if (commandIdentifier(device())) setLookup(device());
    },
    selectEndpoint: (id: string) => {
      setEndpoint(id);
      setSignal('');
    },
    setSignal,
    inspect: () => {
      if (!context.actions?.()?.includes('protocol.manage')) return;
      if (inspect()) observed.retry();
      else setInspect(true);
    },
    choose: (s: { endpoint_id: string; signal_id: string }) => {
      if (endpoints().some((e) => e.id === s.endpoint_id)) {
        setEndpoint(s.endpoint_id);
        setSignal(s.signal_id);
      }
    },
  };
}
export type BindingSourceController = ReturnType<typeof useBindingSource>;

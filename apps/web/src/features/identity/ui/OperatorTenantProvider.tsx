import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  type ParentProps,
  useContext,
} from 'solid-js';
import { RequestFailure, type RequestFailureKind } from '#shared/model';
import {
  metadataReadHint,
  type OperatorTenantPage,
  type OperatorTenantReader,
} from '../model/operator-tenants';
import { useOperatorSession } from './OperatorSessionProvider';

export type TenantDiscoveryState =
  | { readonly kind: 'idle' | 'loading' }
  | { readonly kind: 'error'; readonly failure: RequestFailureKind }
  | { readonly kind: 'ready'; readonly page: OperatorTenantPage };
interface TenantDiscovery {
  readonly state: () => TenantDiscoveryState;
  readonly refresh: () => void;
  readonly metadataBlock: () => string | undefined;
  readonly canReadMetadata: () => boolean | undefined;
}
const Context = createContext<TenantDiscovery>();

/** One bounded page per session/cursor lifetime; superseded results cannot reappear. */
export function OperatorTenantProvider(
  props: ParentProps<{
    readonly reader: OperatorTenantReader;
    readonly enabled: () => boolean;
    readonly after: () => string | undefined | null;
    readonly selected: () => string;
  }>,
) {
  const operator = useOperatorSession();
  const [revision, setRevision] = createSignal(0);
  // URL readers also observe unrelated filters. Memoize primitive context before
  // constructing a lifetime key so those changes cannot trigger network reads.
  const after = createMemo(() => props.after());
  const enabled = createMemo(() => props.enabled());
  const key = createMemo(() => ({
    session: operator.state(),
    after: after(),
    enabled: enabled(),
    revision: revision(),
  }));
  const [stored, setStored] = createSignal<{
    key: ReturnType<typeof key> | null;
    state: TenantDiscoveryState;
  }>({
    key: null,
    state: { kind: 'idle' },
  });
  const state = createMemo<TenantDiscoveryState>(() => {
    const current = key();
    if (!current.enabled || current.session.kind !== 'authenticated')
      return { kind: 'idle' };
    if (current.after === null)
      return { kind: 'error', failure: 'invalid-request' };
    return stored().key === current ? stored().state : { kind: 'loading' };
  });
  createEffect(
    on(key, (current) => {
      if (
        !current.enabled ||
        current.session.kind !== 'authenticated' ||
        current.after === null
      )
        return;
      const controller = new AbortController();
      let active = true;
      onCleanup(() => {
        active = false;
        controller.abort();
      });
      setStored({ key: current, state: { kind: 'loading' } });
      const failed = (cause: unknown) => {
        if (!active) return;
        const failure =
          cause instanceof RequestFailure ? cause.kind : 'unavailable';
        setStored({ key: current, state: { kind: 'error', failure } });
        if (failure === 'unauthorized') operator.invalidate();
      };
      try {
        void props.reader
          .list(
            { limit: 50, after: current.after },
            { signal: controller.signal },
          )
          .then((page) => {
            if (active)
              setStored({ key: current, state: { kind: 'ready', page } });
          }, failed);
      } catch (cause) {
        failed(cause);
      }
    }),
  );
  const hint = createMemo(() => {
    const current = state();
    return current.kind === 'ready'
      ? metadataReadHint(
          current.page,
          props.selected(),
          props.after() ?? undefined,
        )
      : undefined;
  });
  const metadataBlock = () => {
    if (hint() === 'restricted')
      return 'This tenant does not advertise metadata.read. Manage permissions do not imply read access.';
    if (hint() === 'empty')
      return 'No accessible tenants were returned. Ask your administrator to review your access.';
    const current = state();
    if (current.kind === 'loading') return 'Checking current tenant access…';
    if (current.kind !== 'ready')
      return 'Tenant access could not be checked. Retry discovery before reviewing metadata.';
    return undefined;
  };
  return (
    <Context.Provider
      value={{
        state,
        metadataBlock,
        refresh: () => setRevision((value) => value + 1),
        canReadMetadata: () =>
          hint() === 'restricted' || hint() === 'empty'
            ? false
            : hint() === 'allowed'
              ? true
              : undefined,
      }}
    >
      {props.children}
    </Context.Provider>
  );
}

export function useOperatorTenants(): TenantDiscovery {
  const value = useContext(Context);
  if (!value) throw new Error('Operator tenant provider is required');
  return value;
}

/** Shell composition may also render outside a connected metadata workspace. */
export function useOptionalOperatorTenants(): TenantDiscovery | undefined {
  return useContext(Context);
}

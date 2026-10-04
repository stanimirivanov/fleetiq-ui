import type { AssetPage } from '@fleetiq/api-contract';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  CatalogueRequestError,
  type AssetPageLoader,
} from '../api/previewCatalogue';

type CatalogueState =
  | { kind: 'loading' }
  | { kind: 'ready'; page: AssetPage }
  | { kind: 'error'; message: string };

const requestMessages = {
  unauthorized: 'Sign in is required to view this tenant.',
  forbidden: 'You do not have access to this tenant.',
  invalid: 'The asset request is invalid.',
  failure: 'The asset catalogue could not be loaded.',
} as const;

function messageFor(error: unknown): string {
  if (error instanceof CatalogueRequestError) return requestMessages[error.kind];
  return requestMessages.failure;
}

type Props = { tenantId: string; loadPage?: AssetPageLoader };

/** Contract-backed identity list. It does not infer condition from asset type. */
export function AssetListPage({ tenantId, loadPage }: Props) {
  const [state, setState] = useState<CatalogueState>({ kind: 'loading' });
  const [reload, setReload] = useState(0);
  const [paging, setPaging] = useState(false);
  const [pagingError, setPagingError] = useState(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    controller.current?.abort();
    if (!loadPage) return;
    const next = new AbortController();
    controller.current = next;
    setState({ kind: 'loading' });
    setPagingError(false);
    void loadPage(tenantId, null, next.signal).then(
      (page) => {
        if (!next.signal.aborted) setState({ kind: 'ready', page });
      },
      (error: unknown) => {
        if (!next.signal.aborted) setState({ kind: 'error', message: messageFor(error) });
      },
    );
    return () => controller.current?.abort();
  }, [tenantId, loadPage, reload]);

  const loadMore = useCallback(() => {
    if (!loadPage || state.kind !== 'ready' || !state.page.next_after || paging) return;
    const next = new AbortController();
    controller.current = next;
    setPaging(true);
    setPagingError(false);
    void loadPage(tenantId, state.page.next_after, next.signal).then(
      (page) => {
        if (!next.signal.aborted) {
          setState({
            kind: 'ready',
            page: {
              assets: [...state.page.assets, ...page.assets],
              next_after: page.next_after,
            },
          });
          setPaging(false);
        }
      },
      () => {
        if (!next.signal.aborted) {
          setPaging(false);
          setPagingError(true);
        }
      },
    );
  }, [loadPage, paging, state, tenantId]);

  return (
    <main className="min-h-screen bg-canvas px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-outline pb-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent">FleetIQ</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Assets</h1>
          <p className="mt-2 text-muted">Tenant {tenantId}</p>
        </header>
        {loadPage ? (
          <p className="mt-6 rounded-lg border border-accent/40 bg-surface px-4 py-3 text-sm text-foreground">
            Development preview. Asset identities are synthetic; live condition is unavailable.
          </p>
        ) : (
          <section className="mt-8 rounded-xl border border-outline bg-surface p-6">
            <h2 className="text-lg font-semibold">Catalogue not connected</h2>
            <p className="mt-2 text-muted">A production identity and API client are required before tenant assets can be shown.</p>
          </section>
        )}
        {loadPage && state.kind === 'loading' && (
          <p className="mt-8 text-muted" role="status">Loading assets…</p>
        )}
        {loadPage && state.kind === 'error' && (
          <section className="mt-8 rounded-xl border border-outline bg-surface p-6" role="alert">
            <h2 className="font-semibold">Assets unavailable</h2>
            <p className="mt-2 text-muted">{state.message}</p>
            <button className="mt-4 rounded-lg border border-accent px-4 py-2 text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" onClick={() => setReload((value) => value + 1)} type="button">Retry</button>
          </section>
        )}
        {loadPage && state.kind === 'ready' && (
          <section className="mt-8" aria-label="Asset catalogue">
            {state.page.assets.length === 0 ? (
              <p className="rounded-xl border border-outline bg-surface p-6 text-muted" role="status">No assets are registered for this tenant.</p>
            ) : (
              <ul className="grid gap-3">
                {state.page.assets.map((asset) => (
                  <li className="rounded-xl border border-outline bg-surface p-5" key={asset.id}>
                    <Link className="block rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent" to={'/tenants/' + encodeURIComponent(tenantId) + '/assets/' + encodeURIComponent(asset.id)}>
                      <span className="text-lg font-semibold">{asset.name}</span>
                      <span className="mt-1 block text-sm text-muted">ID {asset.id} · Type {asset.asset_type.id} v{asset.asset_type.version}</span>
                      <span className="mt-3 inline-block rounded border border-unknown px-2 py-1 text-sm text-unknown">Condition unknown</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {state.page.next_after && (
              <div className="mt-6">
                <button className="rounded-lg border border-outline px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" disabled={paging} onClick={loadMore} type="button">{paging ? 'Loading more…' : 'Load more'}</button>
                {pagingError && <p className="mt-2 text-unknown" role="alert">More assets could not be loaded. Try again.</p>}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

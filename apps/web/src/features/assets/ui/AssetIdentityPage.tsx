import { Link } from 'react-router';

type Props = { tenantId: string; assetId: string };

/** Route identity only: the partial contract has no asset-detail endpoint yet. */
export function AssetIdentityPage({ tenantId, assetId }: Props) {
  return (
    <main className="min-h-screen bg-canvas px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link className="text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" to={'/tenants/' + encodeURIComponent(tenantId) + '/assets'}>Back to assets</Link>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-accent">Asset identity</p>
        <h1 className="mt-4 text-3xl font-semibold">Asset {assetId}</h1>
        <p className="mt-2 text-muted">Tenant {tenantId}</p>
        <section className="mt-8 rounded-xl border border-outline bg-surface p-6">
          <h2 className="text-lg font-semibold">Detail not connected</h2>
          <p className="mt-2 text-muted">This link carries an asset identifier only. Live detail, telemetry, and condition are not available yet.</p>
        </section>
      </div>
    </main>
  );
}

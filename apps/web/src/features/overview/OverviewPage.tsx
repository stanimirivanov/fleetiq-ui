import { Link } from 'react-router';

export function OverviewPage() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] w-full px-5 py-8 sm:px-8 lg:px-10">
      <div className="w-full">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">
          Overview
        </p>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight">
          Fleet workspace
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          The asset identity catalogue is available as a development preview.
          Live telemetry and operator workflows are still being built.
        </p>
        <section className="mt-10 rounded-2xl border border-outline bg-surface shadow-sm p-6">
          <h2 className="text-lg font-medium">Asset catalogue preview</h2>
          <p className="mt-2 text-muted">
            Run <code>pnpm dev:web:preview</code> to see synthetic,
            contract-backed assets. The preview starts its MSW handler
            automatically; there is no separate mock server.
          </p>
          <Link
            className="mt-4 inline-block text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            to="/tenants/tenant-a/assets"
          >
            Open asset catalogue
          </Link>
        </section>
        <section className="mt-4 rounded-2xl border border-outline bg-surface shadow-sm p-6">
          <h2 className="text-lg font-medium">Connected data</h2>
          <p className="mt-2 text-muted">
            No backend data is connected yet. Without preview mode, the
            catalogue shows its unconnected state.
          </p>
        </section>
      </div>
    </main>
  );
}

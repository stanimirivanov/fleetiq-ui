export function OverviewPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
          FleetIQ
        </p>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight">
          Fleet workspace
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          The web shell is ready. Asset views, live telemetry, and operator
          workflows arrive as contract-backed feature slices.
        </p>
        <div className="mt-10 rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="text-lg font-medium">Connected data</h2>
          <p className="mt-2 text-slate-400">
            No backend data is connected yet. This state is intentional.
          </p>
        </div>
      </div>
    </main>
  );
}

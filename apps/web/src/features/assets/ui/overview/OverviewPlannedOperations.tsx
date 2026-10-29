import { OverviewPanel } from './OverviewPanel';
export function OverviewPlannedOperations() {
  return (
    <>
      <OverviewPanel
        title="Attention queue"
        description="M05 · operational rules not connected"
      >
        <p class="text-sm text-muted">
          Health and alert decisions are unavailable. Missing or stale
          coordinates do not create an incident.
        </p>
      </OverviewPanel>
      <OverviewPanel
        title="Energy and utilization"
        description="M05 · analytics not connected"
      >
        <div class="grid gap-2" aria-hidden="true">
          <span class="h-2 w-3/4 rounded bg-outline/40" />
          <span class="h-2 w-1/2 rounded bg-outline/40" />
          <span class="h-2 w-2/3 rounded bg-outline/40" />
        </div>
        <p class="mt-3 text-sm text-muted">
          No utilization, energy trend or forecast is inferred from inventory
          and position evidence.
        </p>
      </OverviewPanel>
    </>
  );
}

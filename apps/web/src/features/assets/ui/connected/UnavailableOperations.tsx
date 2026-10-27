import { StatusBadge } from '#shared/ui';
import { MetadataPanel } from './MetadataPanel';

/** Capability gaps are explicit; production never displays illustrative operations. */
export function UnavailableOperations() {
  return (
    <MetadataPanel
      title="Operational evidence"
      description="Property values and hot history are separate from asset condition, connection liveness, live positions and alerts."
    >
      <div class="grid gap-3 sm:grid-cols-3">
        <Capability label="Asset condition" />
        <Capability label="Device connection" />
        <Capability label="Asset alerts" />
      </div>
      <div class="mt-4 rounded-lg border border-dashed border-outline bg-canvas p-4">
        <p class="text-xs font-semibold">
          Live delivery & operational coverage
        </p>
        <p class="mt-2 text-xs leading-5 text-muted">
          Current readings refresh explicitly; resumable live subscriptions are
          not connected yet. Binding metadata and reading age cannot establish
          device connectivity, location or asset health.
        </p>
      </div>
    </MetadataPanel>
  );
}
function Capability(props: { readonly label: string }) {
  return (
    <div class="rounded-lg border border-outline bg-canvas p-3">
      <p class="mb-2 text-xs text-muted">{props.label}</p>
      <StatusBadge label="Unavailable" tone="unknown" />
    </div>
  );
}

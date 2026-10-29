import { Match, Switch } from 'solid-js';
import { FleetReadNotice } from './connected/FleetReadNotice';
import { useFleetWorkspace } from './connected/useFleetWorkspace';
import { CoordinateMappingForm } from './map/CoordinateMappingForm';
import { ConnectedOverviewDashboard } from './overview/ConnectedOverviewDashboard';
export default function ConnectedOverviewContent() {
  const workspace = useFleetWorkspace('/');
  const { context, request, query, read, ready, change } = workspace;
  return (
    <>
      <div class="flex flex-wrap gap-3">
        {context.tenantControl?.({ tenantId: workspace.tenant })}
      </div>
      <CoordinateMappingForm
        request={request()}
        tenant={workspace.tenant()}
        apply={(values) =>
          change({ ...values, fleet_after: null, asset: null })
        }
      />
      <Switch>
        <Match when={query().kind === 'invalid'}>
          <FleetReadNotice
            heading="Invalid overview scope"
            label="Invalid context"
            tone="warning"
          >
            Select one tenant and a complete exact coordinate mapping.
          </FleetReadNotice>
        </Match>
        <Match when={!request()}>
          <FleetReadNotice
            heading="Configure fleet overview"
            label="Setup required"
            tone="unknown"
          >
            Choose a tenant and coordinate-property mapping. Whole-tenant counts
            and location evidence come from one authorized fleet snapshot; no
            names are guessed.
          </FleetReadNotice>
        </Match>
        <Match when={ready()}>
          {(result) => (
            <ConnectedOverviewDashboard
              page={result().page}
              query={result().query}
              search={workspace.search()}
              change={change}
              refresh={read.retry}
            />
          )}
        </Match>
        <Match when={read.state().kind === 'loading'}>
          <p role="status">Loading fleet overview…</p>
        </Match>
        <Match when={read.state().kind === 'blocked'}>
          <FleetReadNotice
            heading="Overview access unavailable"
            label="Access unavailable"
            tone="warning"
          >
            The selected tenant is unavailable to this operator.
          </FleetReadNotice>
        </Match>
        <Match
          when={
            read.state().kind === 'error' ||
            read.state().kind === 'unconfigured'
          }
        >
          <FleetReadNotice
            heading="Overview snapshot unavailable"
            label="Read failed"
            tone="warning"
          >
            A validated authorized fleet snapshot could not be obtained.
            Metadata and telemetry read permission are required. Previous
            evidence is hidden.
          </FleetReadNotice>
          <button type="button" class="fi-action-button" onClick={read.retry}>
            Retry overview
          </button>
        </Match>
      </Switch>
    </>
  );
}

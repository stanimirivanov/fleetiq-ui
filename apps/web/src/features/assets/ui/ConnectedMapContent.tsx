import { Match, Switch } from 'solid-js';
import { FleetReadNotice } from './connected/FleetReadNotice';
import { useFleetWorkspace } from './connected/useFleetWorkspace';
import { ConnectedMapWorkspace } from './map/ConnectedMapWorkspace';
import { CoordinateMappingForm } from './map/CoordinateMappingForm';
export default function ConnectedMapContent() {
  const workspace = useFleetWorkspace('/map');
  const { context, query, request, read, ready, change } = workspace;
  return (
    <>
      <div class="flex flex-wrap items-center gap-3">
        {context.tenantControl?.({
          tenantId: () => workspace.tenant(),
        })}
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
            heading="Invalid map scope"
            label="Invalid context"
            tone="warning"
          >
            Use one valid tenant and an exact latitude/longitude mapping.
          </FleetReadNotice>
        </Match>
        <Match when={!request()}>
          <FleetReadNotice
            heading="Choose coordinate properties"
            label="Setup required"
            tone="unknown"
          >
            Select a tenant and apply a coordinate mapping to read observed
            fleet locations.
          </FleetReadNotice>
        </Match>
        <Match when={ready()}>
          {(result) => (
            <ConnectedMapWorkspace
              page={result().page}
              query={result().query}
              search={workspace.search()}
              change={change}
              refresh={read.retry}
            />
          )}
        </Match>
        <Match when={read.state().kind === 'loading'}>
          <p role="status">Loading fleet snapshot…</p>
        </Match>
        <Match when={read.state().kind === 'blocked'}>
          <FleetReadNotice
            heading="Fleet access unavailable"
            label="Access unavailable"
            tone="warning"
          >
            The selected tenant is not available to this operator.
          </FleetReadNotice>
        </Match>
        <Match
          when={
            read.state().kind === 'error' ||
            read.state().kind === 'unconfigured'
          }
        >
          <FleetReadNotice
            heading="Fleet snapshot unavailable"
            label="Read failed"
            tone="warning"
          >
            Metadata and telemetry read permission are both required. Invalid or
            unavailable evidence is never replaced with sample positions.
          </FleetReadNotice>
          <button type="button" onClick={read.retry}>
            Retry fleet snapshot
          </button>
        </Match>
      </Switch>
    </>
  );
}

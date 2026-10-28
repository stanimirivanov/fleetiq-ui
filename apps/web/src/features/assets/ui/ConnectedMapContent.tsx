import { useLocation, useNavigate } from '@solidjs/router';
import { createMemo, Match, Switch } from 'solid-js';
import { RequestFailure } from '#shared/model';
import { readFleetQuery } from '../model/fleet-query';
import { metadataHref } from '../model/metadata-query';
import { useMetadataReader } from './connected/MetadataReaderProvider';
import { useMetadataRead } from './connected/useMetadataRead';
import { ConnectedMapWorkspace } from './map/ConnectedMapWorkspace';
import { CoordinateMappingForm } from './map/CoordinateMappingForm';
import { MapNotice } from './map/MapNotice';
export default function ConnectedMapContent() {
  const location = useLocation(),
    navigate = useNavigate(),
    context = useMetadataReader();
  const query = createMemo(() => readFleetQuery(location.search));
  const request = createMemo(() => {
    const q = query();
    return q.kind === 'ready' ? q.request : null;
  });
  const read = useMetadataRead(request, (_reader, r, options) => {
    if (!context.reader?.fleet)
      return Promise.reject(new RequestFailure('unavailable'));
    return context.reader.fleet.snapshot(r, options);
  });
  const ready = createMemo(() => {
    const s = read.state(),
      q = query();
    return s.kind === 'ready' && q.kind === 'ready'
      ? { page: s.value, query: q }
      : null;
  });
  const change = (values: Record<string, string | null>) =>
    navigate(metadataHref('/map', location.search, values));
  return (
    <>
      <div class="flex flex-wrap items-center gap-3">
        {context.tenantControl?.({
          tenantId: () =>
            new URLSearchParams(location.search).get('tenant') ?? '',
        })}
      </div>
      <CoordinateMappingForm
        request={request()}
        tenant={new URLSearchParams(location.search).get('tenant') ?? ''}
        apply={(values) =>
          change({ ...values, fleet_after: null, asset: null })
        }
      />
      <Switch>
        <Match when={query().kind === 'invalid'}>
          <MapNotice
            heading="Invalid map scope"
            label="Invalid context"
            tone="warning"
          >
            Use one valid tenant and an exact latitude/longitude mapping.
          </MapNotice>
        </Match>
        <Match when={!request()}>
          <MapNotice
            heading="Choose coordinate properties"
            label="Setup required"
            tone="unknown"
          >
            Select a tenant and apply a coordinate mapping to read observed
            fleet locations.
          </MapNotice>
        </Match>
        <Match when={ready()}>
          {(result) => (
            <ConnectedMapWorkspace
              page={result().page}
              query={result().query}
              search={location.search}
              change={change}
              refresh={read.retry}
            />
          )}
        </Match>
        <Match when={read.state().kind === 'loading'}>
          <p role="status">Loading fleet snapshot…</p>
        </Match>
        <Match when={read.state().kind === 'blocked'}>
          <MapNotice
            heading="Fleet access unavailable"
            label="Access unavailable"
            tone="warning"
          >
            The selected tenant is not available to this operator.
          </MapNotice>
        </Match>
        <Match
          when={
            read.state().kind === 'error' ||
            read.state().kind === 'unconfigured'
          }
        >
          <MapNotice
            heading="Fleet snapshot unavailable"
            label="Read failed"
            tone="warning"
          >
            Metadata and telemetry read permission are both required. Invalid or
            unavailable evidence is never replaced with sample positions.
          </MapNotice>
          <button type="button" onClick={read.retry}>
            Retry fleet snapshot
          </button>
        </Match>
      </Switch>
    </>
  );
}

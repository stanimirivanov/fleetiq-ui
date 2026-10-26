import { useLocation, useNavigate } from '@solidjs/router';
import { createMemo, Show } from 'solid-js';
import { PageHeader, TextLink } from '#shared/ui';
import { deviceHref, deviceQuery } from '../model/devices';
import { AssetRegistration } from './AssetRegistration';
import { DeviceLookup } from './DeviceLookup';
import { useDevices } from './DeviceProvider';
import { DeviceReview } from './DeviceReview';
/** Route orchestration only; child sections own form state and resource lifetimes. */
export function DevicesPage() {
  const location = useLocation(),
    navigate = useNavigate(),
    context = useDevices();
  const query = createMemo(() => deviceQuery(location.search));
  const select = (device: string) =>
    navigate(deviceHref(location.search, { device }));
  const channel = (value: string) => {
    const p = new URLSearchParams(location.search);
    p.set('channel', value);
    navigate(`/devices?${p}`);
  };
  return (
    <div class="grid min-w-0 gap-5">
      <PageHeader eyebrow="Commissioning / Devices" title="Devices & ingestion">
        Register communication assets, pin decoder routes and review durable
        ingestion evidence.
      </PageHeader>
      <section class="rounded-xl border border-outline bg-surface p-4">
        {context.tenantControl(query().tenant)}
      </section>
      <Show
        when={query().valid}
        fallback={
          <div role="alert">
            <p>
              Invalid or duplicate device context. Use a single tenant, device
              and channel in the URL.
            </p>
            <TextLink href="/devices">Reset device context</TextLink>
          </div>
        }
      >
        <Show
          when={query().tenant}
          fallback={
            <p role="status" class="text-sm text-muted">
              Choose a permitted tenant to begin device commissioning.
            </p>
          }
          keyed
        >
          {(tenant) => (
            <>
              <Show when={context.actions() === undefined}>
                <p role="status">Checking tenant access…</p>
              </Show>
              <div class="grid min-w-0 gap-5 xl:grid-cols-[minmax(17rem,0.8fr)_minmax(0,2fr)]">
                <div class="grid content-start gap-5">
                  <DeviceLookup
                    tenant={tenant}
                    selected={query().device}
                    select={select}
                  />
                  <AssetRegistration tenant={tenant} select={select} />
                </div>
                <div class="grid min-w-0 content-start gap-5">
                  <Show
                    when={query().device}
                    fallback={
                      <p
                        role="status"
                        class="rounded-xl border border-outline bg-surface p-5 text-sm text-muted"
                      >
                        Open an existing asset or register one to configure its
                        communication capability.
                      </p>
                    }
                    keyed
                  >
                    {(device) => (
                      <DeviceReview
                        tenant={tenant}
                        device={device}
                        channel={query().channel}
                        changeChannel={channel}
                      />
                    )}
                  </Show>
                </div>
              </div>
              <p class="text-xs text-muted">
                Leaving this scope cancels local work; it does not undo commands
                already accepted by the server. Registration, routing and
                telemetry evidence are separate operations.
              </p>
            </>
          )}
        </Show>
      </Show>
    </div>
  );
}

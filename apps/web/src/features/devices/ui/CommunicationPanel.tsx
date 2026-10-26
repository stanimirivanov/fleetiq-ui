import { createSignal, For, Show } from 'solid-js';
import type { Endpoint, Scope } from '../model/devices';
import { validEndpoints } from '../model/devices';
import { EndpointFields } from './DeclarationFields';
import {
  buttonClass,
  CommandNotice,
  DevicePanel,
  ReadNotice,
} from './DevicePrimitives';
import { useDevices } from './DeviceProvider';
import { useDeviceCommand } from './useDeviceCommand';
import { useDeviceRead } from './useDeviceRead';
export function CommunicationPanel(props: {
  scope: Scope;
  registered: () => void;
}) {
  const context = useDevices();
  const [endpoints, setEndpoints] = createSignal<readonly Endpoint[]>([]);
  const read = useDeviceRead(
    () => (context.actions()?.includes('metadata.read') ? props.scope : null),
    (r, o) => context.gateway.device(r, o),
  );
  const current = () => {
    const s = read.state();
    return s.kind === 'ready' ? s.value : undefined;
  };
  const command = useDeviceCommand(
    (r: { scope: Scope; endpoints: readonly Endpoint[] }, o) =>
      context.gateway.registerDevice(r.scope, r.endpoints, o),
    () => {
      read.refresh();
      props.registered();
    },
    () => context.actions()?.includes('metadata.manage') === true,
  );
  const allowed = () => context.actions()?.includes('metadata.manage') === true;
  return (
    <DevicePanel title="2. Communication capability">
      <Show when={!context.actions()?.includes('metadata.read')}>
        <p class="text-xs text-muted">
          Endpoint inspection requires metadata.read; protocol access remains
          independent.
        </p>
      </Show>
      <ReadNotice
        state={read.state()}
        retry={read.refresh}
        missing="No communication capability found. Register endpoints below after ensuring the asset exists."
      />
      <Show when={current()}>
        {(device) => (
          <div class="grid gap-2">
            <p class="text-sm">Registered device: {device().asset_id}</p>
            <For each={device().endpoints}>
              {(endpoint) => (
                <p class="rounded border border-outline px-3 py-2 text-sm">
                  {endpoint.name} · {endpoint.id}
                  <span class="ml-2 text-xs text-muted">{endpoint.kind}</span>
                </p>
              )}
            </For>
            <Show when={device().endpoints.length === 0}>
              <p class="text-xs text-muted">
                Registered with an empty endpoint declaration.
              </p>
            </Show>
          </div>
        )}
      </Show>
      <Show when={!current()}>
        <form
          class="mt-3 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (allowed() && validEndpoints(endpoints()))
              command.submit({ scope: props.scope, endpoints: endpoints() });
          }}
        >
          <fieldset
            class="grid gap-3"
            disabled={!allowed() || command.locked()}
          >
            <EndpointFields changed={setEndpoints} />
            <p class="text-xs text-muted">
              Create-only declaration; existing endpoint content cannot be
              overwritten. An ambiguous result must be retried with the same
              complete ordered declaration.
            </p>
            <button
              type="submit"
              class={buttonClass}
              disabled={!validEndpoints(endpoints())}
            >
              Register communication capability
            </button>
          </fieldset>
        </form>
      </Show>
      <Show when={!allowed()}>
        <p class="mt-3 text-xs text-muted">
          Registration requires metadata.manage.
        </p>
      </Show>
      <CommandNotice
        state={command.state()}
        retry={command.retry}
        enabled={context.actions()?.includes('metadata.manage') === true}
      />
    </DevicePanel>
  );
}

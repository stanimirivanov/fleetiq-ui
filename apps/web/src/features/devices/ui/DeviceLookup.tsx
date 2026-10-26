import { useLocation, useNavigate } from '@solidjs/router';
import { createSignal, For, Show } from 'solid-js';
import { deviceHref, validText } from '../model/devices';
import {
  buttonClass,
  DeviceField,
  DevicePanel,
  inputClass,
  ReadNotice,
} from './DevicePrimitives';
import { useDevices } from './DeviceProvider';
import { useDeviceRead } from './useDeviceRead';
export function DeviceLookup(props: {
  tenant: string;
  selected: string;
  select: (id: string) => void;
}) {
  const context = useDevices();
  const [entered, setEntered] = createSignal(props.selected);
  const location = useLocation(),
    navigate = useNavigate();
  const after = () =>
    new URLSearchParams(location.search).get('asset_after') ?? undefined;
  const setAfter = (value: string | undefined) =>
    navigate(deviceHref(location.search, { asset_after: value }));
  const list = useDeviceRead(
    () =>
      context.actions()?.includes('metadata.read')
        ? { tenant: props.tenant, after: after(), selected: props.selected }
        : null,
    (r, o) => context.gateway.assets(r.tenant, r.after, o),
  );
  const page = () => {
    const s = list.state();
    return s.kind === 'ready' ? s.value : undefined;
  };
  return (
    <DevicePanel title="Open device">
      <form
        class="grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (validText(entered())) props.select(entered());
        }}
      >
        <DeviceField label="Existing asset / device ID">
          {(controlId) => (
            <>
              <input
                id={controlId}
                class={inputClass}
                value={entered()}
                onInput={(e) => setEntered(e.currentTarget.value)}
              />
            </>
          )}
        </DeviceField>
        <button
          type="submit"
          class={buttonClass}
          disabled={!validText(entered())}
        >
          Open device
        </button>
      </form>
      <div class="mt-4 grid gap-2">
        <p class="text-xs text-muted">
          Assets on this bounded page; opening one checks its communication
          capability. No fleet or device total is implied.
        </p>
        <ReadNotice state={list.state()} retry={list.refresh} />
        <button
          type="button"
          class={buttonClass}
          onClick={list.refresh}
          disabled={!context.actions()?.includes('metadata.read')}
        >
          Refresh assets
        </button>
        <Show when={page()?.assets.length === 0}>
          <p class="text-xs text-muted">No assets on this page.</p>
        </Show>
        <For each={page()?.assets}>
          {(asset) => (
            <button
              type="button"
              class={buttonClass}
              aria-pressed={props.selected === asset.id}
              onClick={() => {
                setEntered(asset.id);
                props.select(asset.id);
              }}
            >
              {asset.name}
              <span class="ml-2 text-xs text-muted">{asset.id}</span>
            </button>
          )}
        </For>
        <div class="flex gap-2">
          <button
            type="button"
            class={buttonClass}
            disabled={!after()}
            onClick={() => setAfter(undefined)}
          >
            First asset page
          </button>
          <button
            type="button"
            class={buttonClass}
            disabled={!page()?.next_after}
            onClick={() => setAfter(page()?.next_after ?? undefined)}
          >
            Next asset page
          </button>
        </div>
      </div>
    </DevicePanel>
  );
}

import { createMemo, createSignal, Show } from 'solid-js';
import type { Scope, Selection } from '../model/devices';
import { validText } from '../model/devices';
import {
  buttonClass,
  CommandNotice,
  DeviceField,
  DevicePanel,
  inputClass,
  ReadNotice,
} from './DevicePrimitives';
import { useDevices } from './DeviceProvider';
import { useDeviceCommand } from './useDeviceCommand';
import { useDeviceRead } from './useDeviceRead';
export function ProtocolRoutePanel(props: {
  scope: Scope;
  registrationRevision: number;
}) {
  const context = useDevices();
  const allowed = () => context.actions()?.includes('protocol.manage') === true;
  const [packageId, setPackageId] = createSignal(''),
    [version, setVersion] = createSignal(''),
    [world, setWorld] = createSignal<Selection['world']>('identity-v1'),
    [probe, setProbe] = createSignal<Selection | null>(null);
  const selection = createMemo<Selection>(() => ({
    package_id: packageId(),
    package_version: version(),
    world: world(),
  }));
  const route = useDeviceRead(
    () =>
      allowed()
        ? { scope: props.scope, revision: props.registrationRevision }
        : null,
    (r, o) => context.gateway.route(r.scope, o),
  );
  const release = useDeviceRead(
    () =>
      allowed() && probe()
        ? { selection: probe() as Selection, tenant: props.scope.tenant }
        : null,
    (r, o) => context.gateway.release(r.selection, r.tenant, o),
  );
  const current = () => {
    const r = route.state();
    return r.kind === 'ready' ? r.value : undefined;
  };
  const expected = () => {
    const r = route.state();
    return r.kind === 'ready'
      ? r.value.revision
      : r.kind === 'error' && r.failure === 'not-found'
        ? 0
        : null;
  };
  const checked = () =>
    release.state().kind === 'ready' &&
    JSON.stringify(probe()) === JSON.stringify(selection());
  const command = useDeviceCommand(
    (r: { scope: Scope; expected: number; selection: Selection | null }, o) =>
      context.gateway.changeRoute(r.scope, r.expected, r.selection, o),
    route.refresh,
    () => context.actions()?.includes('protocol.manage') === true,
  );
  const assign = () => {
    const revision = expected();
    if (allowed() && checked() && revision !== null)
      command.submit({
        scope: props.scope,
        expected: revision,
        selection: selection(),
      });
  };
  return (
    <DevicePanel title="3. Pinned protocol route">
      <p class="mb-3 text-xs text-muted">
        Channel {props.scope.channel}. This configures an existing listener
        channel; it does not open a listener or prove current eligibility.
      </p>
      <Show when={!allowed()}>
        <p class="text-sm text-muted">
          Requires protocol.manage. Metadata permissions do not imply it.
        </p>
      </Show>
      <Show when={allowed()}>
        <div class="grid gap-3">
          <ReadNotice
            state={route.state()}
            retry={route.refresh}
            missing="No route evidence. Initial assignment expects revision 0; the backend checks registration and admission."
          />
          <Show when={current()}>
            {(value) => (
              <div class="rounded border border-outline p-3 text-sm">
                <p>Current revision {value().revision}</p>
                <p>
                  {value().selection
                    ? `${value().selection?.package_id} @ ${value().selection?.package_version}`
                    : 'Retired route'}
                </p>
                <p class="text-xs text-muted">
                  Recorded admission policy: {value().policy_version ?? 'none'}{' '}
                  · actor {value().actor_id}
                </p>
              </div>
            )}
          </Show>
          <button type="button" class={buttonClass} onClick={route.refresh}>
            Refresh current route
          </button>
          <fieldset class="grid gap-3" disabled={command.locked()}>
            <DeviceField label="Exact package ID">
              {(controlId) => (
                <>
                  <input
                    id={controlId}
                    class={inputClass}
                    value={packageId()}
                    onInput={(e) => setPackageId(e.currentTarget.value)}
                  />
                </>
              )}
            </DeviceField>
            <DeviceField label="Exact package version">
              {(controlId) => (
                <>
                  <input
                    id={controlId}
                    class={inputClass}
                    value={version()}
                    onInput={(e) => setVersion(e.currentTarget.value)}
                  />
                </>
              )}
            </DeviceField>
            <DeviceField label="Protocol world">
              {(controlId) => (
                <>
                  <select
                    id={controlId}
                    class={inputClass}
                    value={world()}
                    onChange={(e) =>
                      setWorld(e.currentTarget.value as Selection['world'])
                    }
                  >
                    <option value="identity-v1">Identity v1</option>
                    <option value="runtime-v1">Runtime v1</option>
                  </select>
                </>
              )}
            </DeviceField>
            <button
              type="button"
              class={buttonClass}
              disabled={!validText(packageId()) || !validText(version())}
              onClick={() => setProbe({ ...selection() })}
            >
              Check stored release
            </button>
            <ReadNotice
              state={release.state()}
              retry={release.refresh}
              missing="Exact stored release not found. Publish it through the package tooling before assigning it."
            />
            <Show when={checked()}>
              <p role="status" class="break-all text-xs text-muted">
                Stored release verified. This does not attest admission;
                assignment rechecks the current policy.
              </p>
            </Show>
            <button
              type="button"
              class={buttonClass}
              disabled={!checked() || expected() === null}
              onClick={assign}
            >
              Assign pinned release
            </button>
            <button
              type="button"
              class={buttonClass}
              disabled={!current()?.selection}
              onClick={() => {
                const revision = expected();
                if (revision !== null)
                  command.submit({
                    scope: props.scope,
                    expected: revision,
                    selection: null,
                  });
              }}
            >
              Retire route
            </button>
          </fieldset>
          <CommandNotice
            state={command.state()}
            retry={command.retry}
            enabled={context.actions()?.includes('protocol.manage') === true}
            success="Route command acknowledged. Current configuration is re-read; a retry receipt need not be the latest head."
          />
        </div>
      </Show>
    </DevicePanel>
  );
}

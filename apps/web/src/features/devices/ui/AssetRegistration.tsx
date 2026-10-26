import { useLocation, useNavigate } from '@solidjs/router';
import { createMemo, createSignal, For, Show } from 'solid-js';
import type { AssetDraft, DefinitionPage, Identifier } from '../model/devices';
import { deviceHref, validAsset } from '../model/devices';
import { IdentifierFields } from './DeclarationFields';
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
export function AssetRegistration(props: {
  tenant: string;
  select: (id: string) => void;
}) {
  const context = useDevices();
  const canManage = () =>
    context.actions()?.includes('metadata.manage') === true;
  const [id, setId] = createSignal(''),
    [name, setName] = createSignal(''),
    [type, setType] = createSignal(''),
    [version, setVersion] = createSignal('1'),
    [identifiers, setIdentifiers] = createSignal<readonly Identifier[]>([]);
  const location = useLocation(),
    navigate = useNavigate();
  const after = createMemo<DefinitionPage['next_after']>(() => {
    const p = new URLSearchParams(location.search),
      id = p.get('type_after_id'),
      version = p.get('type_after_version');
    return id && version ? { id, version: Number(version) } : null;
  });
  const setAfter = (value: DefinitionPage['next_after']) =>
    navigate(
      deviceHref(location.search, {
        type_after_id: value?.id,
        type_after_version: value ? String(value.version) : undefined,
      }),
    );
  const types = useDeviceRead(
    () =>
      context.actions()?.includes('metadata.read')
        ? { tenant: props.tenant, after: after() }
        : null,
    (r, o) => context.gateway.types(r.tenant, r.after, o),
  );
  const page = () => {
    const s = types.state();
    return s.kind === 'ready' ? s.value : undefined;
  };
  const draft = createMemo<AssetDraft>(() => ({
    id: id(),
    name: name(),
    asset_type: { id: type(), version: Number(version()) },
    external_identifiers: identifiers(),
  }));
  const command = useDeviceCommand(
    async (r: { tenant: string; draft: AssetDraft }, o) => ({
      receipt: await context.gateway.registerAsset(r.tenant, r.draft, o),
      id: r.draft.id,
    }),
    (value) => props.select(value.id),
    () => context.actions()?.includes('metadata.manage') === true,
  );
  return (
    <DevicePanel title="1. Register asset">
      <form
        class="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (canManage() && validAsset(draft()))
            command.submit({ tenant: props.tenant, draft: draft() });
        }}
      >
        <p class="text-xs text-muted">
          Create-only registration. Existing assets can be selected directly.
          This does not configure ingestion.
        </p>
        <fieldset
          class="grid min-w-0 gap-3"
          disabled={!canManage() || command.locked()}
        >
          <DeviceField label="Internal asset ID">
            {(controlId) => (
              <>
                <input
                  id={controlId}
                  class={inputClass}
                  required
                  value={id()}
                  onInput={(e) => setId(e.currentTarget.value)}
                />
              </>
            )}
          </DeviceField>
          <DeviceField label="Asset display name">
            {(controlId) => (
              <>
                <input
                  id={controlId}
                  class={inputClass}
                  required
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                />
              </>
            )}
          </DeviceField>
          <Show when={page()}>
            <DeviceField label="Published type on this page">
              {(controlId) => (
                <>
                  <select
                    id={controlId}
                    class={inputClass}
                    value=""
                    onChange={(e) => {
                      const d =
                        page()?.definitions[Number(e.currentTarget.value)];
                      if (d) {
                        setType(d.id);
                        setVersion(String(d.version));
                      }
                    }}
                  >
                    <option value="" disabled>
                      Choose exact version
                    </option>
                    <For each={page()?.definitions}>
                      {(d, index) => (
                        <option value={index()}>
                          {d.name} · {d.id} v{d.version}
                        </option>
                      )}
                    </For>
                  </select>
                </>
              )}
            </DeviceField>
          </Show>
          <ReadNotice state={types.state()} retry={types.refresh} />
          <div class="flex gap-2">
            <button
              type="button"
              class={buttonClass}
              disabled={after() === null}
              onClick={() => setAfter(null)}
            >
              First type page
            </button>
            <button
              type="button"
              class={buttonClass}
              disabled={!page()?.next_after}
              onClick={() => setAfter(page()?.next_after ?? null)}
            >
              Next type page
            </button>
          </div>
          <DeviceField label="Exact asset type ID">
            {(controlId) => (
              <>
                <input
                  id={controlId}
                  class={inputClass}
                  required
                  value={type()}
                  onInput={(e) => setType(e.currentTarget.value)}
                />
              </>
            )}
          </DeviceField>
          <DeviceField label="Type version">
            {(controlId) => (
              <>
                <input
                  id={controlId}
                  class={inputClass}
                  type="number"
                  min="1"
                  max="4294967295"
                  required
                  value={version()}
                  onInput={(e) => setVersion(e.currentTarget.value)}
                />
              </>
            )}
          </DeviceField>
          <IdentifierFields changed={setIdentifiers} />
          <Show when={!validAsset(draft())}>
            <p class="text-xs text-muted">
              Complete the identity, name and exact published type. IDs cannot
              contain controls or surrounding whitespace; identifiers must be
              unique.
            </p>
          </Show>
          <button
            type="submit"
            class={buttonClass}
            disabled={!validAsset(draft())}
          >
            Register asset
          </button>
        </fieldset>
        <Show when={!canManage()}>
          <p class="text-xs text-muted">
            Requires metadata.manage; read and protocol grants do not imply it.
          </p>
        </Show>
        <CommandNotice
          state={command.state()}
          retry={command.retry}
          enabled={context.actions()?.includes('metadata.manage') === true}
          success="Asset registration acknowledged. Continue with communication capability."
        />
      </form>
    </DevicePanel>
  );
}

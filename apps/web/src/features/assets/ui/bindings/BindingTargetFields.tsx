import { createUniqueId, For } from 'solid-js';
import { commandIdentifier } from '../../model/commissioning';
import { CommandField, fieldClass } from '../commissioning/CommandFields';
import { MetadataReadContent } from '../connected/MetadataReadContent';
import type { BindingTargetController } from './useBindingTarget';
export function BindingTargetFields(props: {
  target: BindingTargetController;
}) {
  const id = createUniqueId();
  return (
    <section aria-label="Binding target property" class="grid gap-3">
      <CommandField
        label="Binding target asset ID"
        value={props.target.asset()}
        change={props.target.changeAsset}
      />
      <button
        type="button"
        class="fi-action-button"
        disabled={!commandIdentifier(props.target.asset())}
        onClick={props.target.load}
      >
        Load target property versions
      </button>
      <MetadataReadContent
        state={props.target.identity.state()}
        label="binding target asset"
        retry={props.target.identity.retry}
      >
        {(asset) => (
          <p class="break-all text-xs">
            {asset.name} · pinned type {asset.assetType.id} v
            {asset.assetType.version}
          </p>
        )}
      </MetadataReadContent>
      <MetadataReadContent
        state={props.target.type.state()}
        label="binding target type"
        retry={props.target.type.retry}
      >
        {(_type) => (
          <div class="grid gap-1 text-xs">
            <label for={id}>Exact supported target property</label>
            <select
              id={id}
              class={fieldClass}
              required
              value={JSON.stringify([
                props.target.selected().id,
                props.target.selected().version,
              ])}
              onChange={(e) => {
                const r = props.target
                  .properties()
                  .find(
                    (p) =>
                      JSON.stringify([p.id, p.version]) ===
                      e.currentTarget.value,
                  );
                if (r) props.target.select(r);
              }}
            >
              <option value="">Choose an exact supported property</option>
              <For each={props.target.properties()}>
                {(p) => (
                  <option value={JSON.stringify([p.id, p.version])}>
                    {p.id} v{p.version}
                  </option>
                )}
              </For>
            </select>
          </div>
        )}
      </MetadataReadContent>
      <MetadataReadContent
        state={props.target.property.state()}
        label="binding target property"
        retry={props.target.property.retry}
      >
        {(property) => (
          <p class="text-xs">
            {property.name} · {property.valueKind} · canonical unit{' '}
            {property.canonicalUnit ?? 'none'}
          </p>
        )}
      </MetadataReadContent>
      <p class="text-xs text-muted">
        Only exact members of the pinned type are eligible. No value conversion
        or unit compatibility is inferred from a signal name.
      </p>
    </section>
  );
}

import { createMemo, createSignal, For, Show } from 'solid-js';
import type { DefinitionRef } from '../../../model/metadata';
import { metadataInputClass } from '../MetadataPanel';
/** Search is local disclosure state; the selected exact reference lives in the URL. */
export function PropertyChooser(props: {
  readonly properties: readonly DefinitionRef[];
  readonly selected: DefinitionRef | null;
  readonly choose: (reference: DefinitionRef) => void;
}) {
  const [filter, setFilter] = createSignal('');
  const visible = createMemo(() =>
    props.properties
      .filter((p) => p.id.toLowerCase().includes(filter().toLowerCase()))
      .slice(0, 100),
  );
  const selectedMissing = () =>
    props.selected &&
    !visible().some(
      (p) =>
        p.id === props.selected?.id && p.version === props.selected.version,
    )
      ? props.selected
      : null;
  const key = (p: DefinitionRef) => JSON.stringify([p.id, p.version]);
  return (
    <div class="grid gap-3 sm:grid-cols-2">
      <label class="grid gap-1 text-xs">
        Find a declared property
        <input
          class={metadataInputClass}
          type="search"
          value={filter()}
          onInput={(e) => setFilter(e.currentTarget.value)}
        />
      </label>
      <label class="grid gap-1 text-xs">
        Property and definition version
        <select
          class={metadataInputClass}
          value={props.selected ? key(props.selected) : ''}
          onChange={(e) => {
            const selected = props.properties.find(
              (p) => key(p) === e.currentTarget.value,
            );
            if (selected) props.choose(selected);
          }}
        >
          <Show when={selectedMissing()}>
            {(p) => (
              <option value={key(p())}>
                {p().id} · v{p().version}
              </option>
            )}
          </Show>
          <For each={visible()}>
            {(p) => (
              <option value={key(p)}>
                {p.id} · v{p.version}
              </option>
            )}
          </For>
        </select>
      </label>
      <p class="text-xs text-muted sm:col-span-2">
        {props.properties.length} declared references; up to 100 matching
        choices shown. Only the selected property is queried.
      </p>
    </div>
  );
}

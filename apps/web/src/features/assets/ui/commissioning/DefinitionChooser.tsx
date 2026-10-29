import { createSignal, createUniqueId, For, Show } from 'solid-js';
import type { DefinitionRef } from '../../model/metadata';
import { MetadataReadContent } from '../connected/MetadataReadContent';
import { useCommissioningGateway } from '../connected/MetadataReaderProvider';
import { useMetadataRead } from '../connected/useMetadataRead';
import { fieldClass } from './CommandFields';
export function DefinitionChooser(props: {
  tenant: string;
  kind: 'asset' | 'relationship';
  selected: DefinitionRef;
  select: (ref: DefinitionRef) => void;
}) {
  const controlId = createUniqueId();
  const context = useCommissioningGateway(),
    [after, setAfter] = createSignal<DefinitionRef | null>(null);
  const read = useMetadataRead(
    () => ({ tenant: props.tenant, kind: props.kind, after: after() }),
    (_r, q, o) => context.types(q.tenant, q.kind, q.after, o),
  );
  const page = () => {
    const s = read.state();
    return s.kind === 'ready' ? s.value : undefined;
  };
  const next = (ref: DefinitionRef | null) => {
    props.select({ id: '', version: 1 });
    setAfter(ref);
  };
  return (
    <section
      aria-label={`${props.kind} definition versions`}
      class="grid gap-2"
    >
      <MetadataReadContent
        state={read.state()}
        label={`${props.kind} definitions`}
        retry={read.retry}
      >
        {(value) => (
          <>
            <div class="grid gap-1 text-xs">
              <label for={controlId}>Exact {props.kind} type version</label>
              <select
                id={controlId}
                class={fieldClass}
                required
                value={JSON.stringify([
                  props.selected.id,
                  props.selected.version,
                ])}
                onChange={(e) => {
                  const ref = value.definitions.find(
                    (d) =>
                      JSON.stringify([d.id, d.version]) ===
                      e.currentTarget.value,
                  );
                  if (ref) props.select({ id: ref.id, version: ref.version });
                }}
              >
                <option value="">Choose an installed version</option>
                <For each={value.definitions}>
                  {(d) => (
                    <option value={JSON.stringify([d.id, d.version])}>
                      {d.name} · {d.id} v{d.version}
                    </option>
                  )}
                </For>
              </select>
            </div>
            <Show when={!value.definitions.length}>
              <p>No definitions on this page.</p>
            </Show>
          </>
        )}
      </MetadataReadContent>
      <nav
        aria-label={`${props.kind} definition pages`}
        class="flex flex-wrap gap-2 text-xs"
      >
        <Show when={after()}>
          <button
            type="button"
            class="fi-action-button"
            onClick={() => next(null)}
          >
            First definitions
          </button>
        </Show>
        <Show when={page()?.next}>
          {(ref) => (
            <button
              type="button"
              class="fi-action-button"
              onClick={() => next(ref())}
            >
              Next definitions
            </button>
          )}
        </Show>
      </nav>
      <p class="text-xs text-muted">
        Exact installed versions only. Pages are bounded; there is no
        latest-version alias.
      </p>
    </section>
  );
}

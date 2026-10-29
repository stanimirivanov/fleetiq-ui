import { createUniqueId, For, Show } from 'solid-js';
import { commandIdentifier } from '../../model/commissioning';
import { CommandField, fieldClass } from '../commissioning/CommandFields';
import { MetadataReadContent } from '../connected/MetadataReadContent';
import type { BindingSourceController } from './useBindingSource';
export function BindingSourceFields(props: {
  source: BindingSourceController;
}) {
  const id = createUniqueId();
  return (
    <section aria-label="Binding source discovery" class="grid gap-3">
      <CommandField
        label="Binding source device ID"
        value={props.source.device()}
        change={props.source.changeDevice}
      />
      <button
        type="button"
        class="fi-action-button"
        disabled={!commandIdentifier(props.source.device())}
        onClick={props.source.load}
      >
        Load registered endpoints
      </button>
      <MetadataReadContent
        state={props.source.registered.state()}
        label="registered binding endpoints"
        retry={props.source.registered.retry}
      >
        {(value) => (
          <div class="grid gap-1 text-xs">
            <label for={id}>Registered source endpoint</label>
            <select
              id={id}
              class={fieldClass}
              required
              value={props.source.endpoint()}
              onChange={(e) =>
                props.source.selectEndpoint(e.currentTarget.value)
              }
            >
              <option value="">Choose a registered endpoint</option>
              <For each={value.endpoints}>
                {(e) => (
                  <option value={e.id}>
                    {e.id} · {e.kind}
                  </option>
                )}
              </For>
            </select>
          </div>
        )}
      </MetadataReadContent>
      <CommandField
        label="Binding source signal ID"
        value={props.source.signal()}
        change={props.source.setSignal}
      />
      <p class="text-xs text-muted">
        Signal names may be entered explicitly for custom protocols.
        Registration proves an endpoint, not emitted signals. Empty binding
        candidates never establish sensor inventory.
      </p>
      <Show
        when={props.source.canObserve()}
        fallback={
          <p class="text-xs text-muted">
            Observed-source diagnostics require a separate protocol.manage
            grant.
          </p>
        }
      >
        <button
          type="button"
          class="fi-action-button"
          onClick={props.source.inspect}
        >
          Inspect observed signals
        </button>
        <MetadataReadContent
          state={props.source.observed.state()}
          label="observed binding sources"
          retry={props.source.observed.retry}
        >
          {(value) => (
            <div class="grid gap-2 text-xs">
              <p>
                Sample observed at {value.observedAt} ms ·{' '}
                {value.truncated
                  ? 'Truncated coverage'
                  : 'Within sampled limits'}
                . At most 64 messages, 64 outputs per message and 128 source
                tuples; never complete capabilities.
              </p>
              <For each={value.sources}>
                {(s) => (
                  <button
                    type="button"
                    class="fi-action-button"
                    disabled={
                      !props.source
                        .endpoints()
                        .some((e) => e.id === s.endpoint_id)
                    }
                    onClick={() => props.source.choose(s)}
                  >
                    {s.endpoint_id} / {s.signal_id} · decoder {s.package_id}@
                    {s.package_version}
                  </button>
                )}
              </For>
              <Show when={!value.sources.length}>
                <p>
                  No sources in this sample. This does not mean no sensors or no
                  emitted signals.
                </p>
              </Show>
            </div>
          )}
        </MetadataReadContent>
      </Show>
    </section>
  );
}

import { createSignal, Show } from 'solid-js';
import { isValidAssetIdentifier } from '../../model/asset-catalogue';
import {
  snapshotCursorKeys,
  tenantContextChanges,
} from '../../model/metadata-query';
import {
  MetadataPanel,
  metadataButtonClass,
  metadataInputClass,
} from './MetadataPanel';
import { useMetadataReader } from './MetadataReaderProvider';
import type { MetadataWorkspace } from './useMetadataWorkspace';

function TenantControl(props: { readonly workspace: MetadataWorkspace }) {
  const [error, setError] = createSignal('');
  const submit = (event: SubmitEvent & { currentTarget: HTMLFormElement }) => {
    event.preventDefault();
    const tenant = String(
      new FormData(event.currentTarget).get('tenant') ?? '',
    );
    if (!isValidAssetIdentifier(tenant)) {
      setError('Enter a valid tenant identifier.');
      return;
    }
    setError('');
    props.workspace.update(tenantContextChanges(tenant));
  };
  return (
    <form
      onSubmit={submit}
      class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
    >
      <label class="grid gap-1 text-xs font-medium">
        Tenant ID
        <input
          name="tenant"
          class={metadataInputClass}
          value={props.workspace.value('tenant')}
          required
          autocomplete="off"
        />
      </label>
      <button type="submit" class={metadataButtonClass}>
        Open tenant
      </button>
      <Show when={error()}>
        <p role="alert" class="text-xs text-status-critical">
          {error()}
        </p>
      </Show>
    </form>
  );
}

function ReviewTimeControl(props: { readonly workspace: MetadataWorkspace }) {
  const submit = (event: SubmitEvent & { currentTarget: HTMLFormElement }) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    props.workspace.update({
      effective_at_ms: String(data.get('effective_at_ms') ?? ''),
      known_at_ms: String(data.get('known_at_ms') ?? ''),
      binding: null,
      ...Object.fromEntries(snapshotCursorKeys.map((key) => [key, null])),
    });
  };
  return (
    <form
      onSubmit={submit}
      class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
    >
      <label class="grid gap-1 text-xs font-medium">
        Effective at (Unix ms)
        <input
          name="effective_at_ms"
          class={metadataInputClass}
          value={props.workspace.value('effective_at_ms')}
          inputmode="numeric"
          required
        />
      </label>
      <label class="grid gap-1 text-xs font-medium">
        Known at (Unix ms)
        <input
          name="known_at_ms"
          class={metadataInputClass}
          value={props.workspace.value('known_at_ms')}
          inputmode="numeric"
          required
        />
      </label>
      <button type="submit" class={metadataButtonClass}>
        Apply review times
      </button>
    </form>
  );
}

/** Composition supplies discovery controls; isolated consumers can enter a known ID. */
export function MetadataContextControls(props: {
  readonly workspace: MetadataWorkspace;
}) {
  const context = useMetadataReader();
  const invalid = () => {
    const result = props.workspace.result();
    return result.kind === 'invalid' ? result.message : null;
  };
  return (
    <MetadataPanel
      title="Review context"
      description="Metadata belongs to one tenant. Effective time selects physical validity; known time limits recorded revisions."
    >
      <div class="grid items-start gap-4 2xl:grid-cols-[minmax(18rem,1fr)_minmax(0,1.4fr)]">
        <Show
          when={context.tenantControl}
          fallback={<TenantControl workspace={props.workspace} />}
        >
          {(control) =>
            control()({ tenantId: () => props.workspace.value('tenant') })
          }
        </Show>
        <ReviewTimeControl workspace={props.workspace} />
      </div>
      <Show when={props.workspace.result().kind === 'missing-tenant'}>
        <p role="status" class="mt-3 text-xs text-muted">
          Choose a tenant to open its metadata workspace.
        </p>
      </Show>
      <Show when={props.workspace.result().kind === 'missing-cutoffs'}>
        <p role="status" class="mt-3 text-xs text-muted">
          Preparing explicit review times…
        </p>
      </Show>
      <Show when={invalid()}>
        {(message) => (
          <p role="alert" class="mt-3 text-sm text-status-critical">
            {message()} No metadata requests have been sent.
          </p>
        )}
      </Show>
    </MetadataPanel>
  );
}

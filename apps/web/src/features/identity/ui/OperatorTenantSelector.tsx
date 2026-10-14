import { For, Match, Show, Switch } from 'solid-js';
import {
  DirectTenantEntry,
  tenantButtonClass,
  tenantInputClass,
} from './DirectTenantEntry';
import { useOperatorTenants } from './OperatorTenantProvider';

/** Explicit selection and bounded traversal; no hidden walk over the grant inventory. */
export function OperatorTenantSelector(props: {
  readonly selected: string;
  readonly after: string | undefined | null;
  readonly select: (id: string) => void;
  readonly page: (after: string | null) => void;
}) {
  const tenants = useOperatorTenants();
  const ready = () => {
    const state = tenants.state();
    return state.kind === 'ready' ? state.page : undefined;
  };
  const selected = () =>
    ready()?.tenants.find((tenant) => tenant.id === props.selected);
  const error = () => {
    const state = tenants.state();
    return state.kind === 'error' ? state.failure : undefined;
  };
  return (
    <section aria-label="Tenant access" class="grid min-w-0 gap-2">
      <div class="flex flex-wrap items-end gap-2">
        <label class="grid min-w-0 flex-1 gap-1 text-xs font-medium">
          Permitted tenant
          <select
            class={tenantInputClass}
            value={selected()?.id ?? ''}
            disabled={!ready()}
            onChange={(event) => {
              if (event.currentTarget.value)
                props.select(event.currentTarget.value);
            }}
          >
            <option value="" disabled>
              Choose a tenant
            </option>
            <For each={ready()?.tenants}>
              {(tenant) => <option value={tenant.id}>{tenant.id}</option>}
            </For>
          </select>
        </label>
        <button
          type="button"
          class={tenantButtonClass}
          onClick={tenants.refresh}
        >
          Refresh tenant access
        </button>
      </div>
      <Switch>
        <Match when={tenants.state().kind === 'loading'}>
          <p role="status" class="text-xs text-muted">
            Loading permitted tenants…
          </p>
        </Match>
        <Match when={error()}>
          <p role="alert" class="text-xs text-status-critical">
            {error() === 'invalid-request'
              ? 'Invalid tenant page cursor. Return to the first tenant page.'
              : error() === 'invalid-response'
                ? 'Invalid tenant discovery response. No grants from it are used.'
                : 'Tenant discovery is unavailable. Refresh to try again.'}
          </p>
        </Match>
        <Match when={ready()?.tenants.length === 0}>
          <p role="status" class="text-xs text-muted">
            {props.after
              ? 'No tenants on this continuation page. Return to the first page to refresh discovery.'
              : 'No accessible tenants. Ask your administrator to review your access.'}
          </p>
        </Match>
      </Switch>
      <Show
        when={selected()}
        fallback={
          <Show when={props.selected && ready()}>
            <p class="text-xs text-muted">
              Selected tenant {props.selected} is outside this discovery page;
              access is unverified.
            </p>
          </Show>
        }
      >
        {(tenant) => (
          <fieldset
            class="flex flex-wrap gap-1"
            aria-label="Advertised tenant actions"
          >
            <For each={tenant().actions}>
              {(action) => (
                <span class="rounded border border-outline px-2 py-1 text-[0.65rem] text-muted">
                  {action}
                </span>
              )}
            </For>
          </fieldset>
        )}
      </Show>
      <Show
        when={tenants.metadataBlock() && (ready()?.tenants.length ?? 0) > 0}
      >
        <p role="status" class="text-xs text-muted">
          {tenants.metadataBlock()}
        </p>
      </Show>
      <nav aria-label="Tenant discovery pages" class="flex flex-wrap gap-2">
        <Show when={props.after !== undefined}>
          <button
            type="button"
            class={tenantButtonClass}
            onClick={() => props.page(null)}
          >
            First tenants
          </button>
        </Show>
        <Show when={ready()?.nextAfter}>
          {(after) => (
            <button
              type="button"
              class={tenantButtonClass}
              onClick={() => props.page(after())}
            >
              Next tenants
            </button>
          )}
        </Show>
      </nav>
      <DirectTenantEntry selected={props.selected} select={props.select} />
      <p class="text-[0.65rem] text-muted">
        Current explicit grants guide controls; the backend authorizes each
        operation.
      </p>
    </section>
  );
}

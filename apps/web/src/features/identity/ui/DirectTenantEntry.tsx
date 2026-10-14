import { createSignal, Show } from 'solid-js';
import { isValidTenantId } from '../model/operator-tenants';

export const tenantInputClass =
  'min-w-0 rounded border border-outline bg-canvas px-3 py-2 text-sm text-ink';
export const tenantButtonClass =
  'rounded border border-outline bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50';

/** Escape hatch for a known ID outside this bounded discovery page. It grants nothing. */
export function DirectTenantEntry(props: {
  readonly selected: string;
  readonly select: (id: string) => void;
}) {
  const [error, setError] = createSignal('');
  const submit = (event: SubmitEvent & { currentTarget: HTMLFormElement }) => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get('tenant') ?? '');
    if (!isValidTenantId(value)) {
      setError('Enter a valid tenant identifier.');
      return;
    }
    setError('');
    props.select(value);
  };
  return (
    <details class="text-xs text-muted">
      <summary class="cursor-pointer">Open a known tenant ID</summary>
      <form
        onSubmit={submit}
        class="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      >
        <label class="grid gap-1">
          Tenant ID
          <input
            name="tenant"
            value={props.selected}
            class={tenantInputClass}
            required
            autocomplete="off"
          />
        </label>
        <button type="submit" class={tenantButtonClass}>
          Open tenant
        </button>
        <Show when={error()}>
          <p role="alert" class="text-status-critical">
            {error()}
          </p>
        </Show>
      </form>
      <p class="mt-2">
        An ID outside this page is unverified. The service checks every metadata
        request.
      </p>
    </details>
  );
}

import { Show } from 'solid-js';
import type { FleetRequest } from '../../model/fleet';
/** Local draft values become shareable scope only after an explicit submit. */
export function CoordinateMappingForm(props: {
  readonly request: FleetRequest | null;
  readonly tenant: string;
  readonly apply: (values: Record<string, string>) => void;
}) {
  return (
    <details
      class="rounded-xl border border-outline bg-surface p-4"
      open={!props.request}
    >
      <summary class="cursor-pointer text-sm font-semibold">
        Coordinate property mapping
      </summary>
      <p class="my-3 text-xs text-muted">
        Choose installed exact property versions. No coordinate roles are
        inferred.
      </p>
      <Show
        when={props.tenant}
        fallback={<p class="text-sm text-muted">Select a tenant first.</p>}
      >
        <form
          class="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            props.apply(
              Object.fromEntries([...data].map(([k, v]) => [k, String(v)])),
            );
          }}
        >
          <label class="grid gap-1 text-sm">
            Latitude property
            <input
              class="rounded border border-outline bg-canvas p-2"
              name="latitude_property"
              required
              maxLength={128}
              value={props.request?.mapping.latitude.id ?? ''}
            />
          </label>
          <label class="grid gap-1 text-sm">
            Longitude property
            <input
              class="rounded border border-outline bg-canvas p-2"
              name="longitude_property"
              required
              maxLength={128}
              value={props.request?.mapping.longitude.id ?? ''}
            />
          </label>
          <label class="grid gap-1 text-sm">
            Latitude version
            <input
              class="rounded border border-outline bg-canvas p-2"
              name="latitude_version"
              type="number"
              min="1"
              max="4294967295"
              required
              value={props.request?.mapping.latitude.version ?? 1}
            />
          </label>
          <label class="grid gap-1 text-sm">
            Longitude version
            <input
              class="rounded border border-outline bg-canvas p-2"
              name="longitude_version"
              type="number"
              min="1"
              max="4294967295"
              required
              value={props.request?.mapping.longitude.version ?? 1}
            />
          </label>
          <label class="grid gap-1 text-sm">
            Encoding
            <select
              class="rounded border border-outline bg-canvas p-2"
              name="encoding"
              value={props.request?.mapping.encoding ?? 'degrees'}
            >
              <option value="degrees">Degrees · canonical unit deg</option>
              <option value="e7">E7 integer · no unit</option>
            </select>
          </label>
          <button
            class="self-end rounded bg-accent px-4 py-2 text-sm font-semibold text-on-accent"
            type="submit"
          >
            Apply mapping
          </button>
        </form>
      </Show>
    </details>
  );
}
